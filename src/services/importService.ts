/**
 * @file Service for handling climb import logic, including CSV parsing and duplicate detection.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Climb } from '@/types/climbing';
import { CsvClimb, ClimbTypeSpec, SendTypeSpec } from '../lib/importSpec'; // Relative path
import { validateClimbRecord } from '../lib/importValidation'; // Relative path
import Papa from 'papaparse';

/**
 * Checks if a climb already exists in the database for the current user.
 * @param climb - A partial Climb object containing at least name, grade, date, and location.
 *                It should also implicitly include user_id for the query.
 * @returns The existing climb if a duplicate is found, otherwise null.
 */
export async function checkDuplicateClimb(
  climb: Partial<Climb> & { user_id: string }
): Promise<Climb | null> {
  if (!climb.name || !climb.grade || !climb.date || !climb.location || !climb.user_id) {
    console.error('[checkDuplicateClimb] Error: Missing required fields for duplicate check. Name, grade, date, location, and user_id are required. Provided:', climb);
    return null;
  }

  try {
    const { data, error, status } = await supabase
      .from('climbs')
      .select('*')
      .eq('user_id', climb.user_id)
      .eq('name', climb.name)
      .eq('grade', climb.grade)
      .eq('date', climb.date)
      .eq('location', climb.location)
      .maybeSingle();

    if (error && status !== 406) { // 406 is expected if .maybeSingle() finds no rows
      console.error(`[checkDuplicateClimb] Supabase error checking for duplicate climb (Name: ${climb.name}, Date: ${climb.date}):`, error.message);
      return null;
    }
    return data as Climb | null;
  } catch (err: any) {
    console.error(`[checkDuplicateClimb] Unexpected error during duplicate check (Name: ${climb.name}, Date: ${climb.date}):`, err.message, err.stack);
    return null;
  }
}

/**
 * Transforms a CsvClimb object into a Partial<Climb> object suitable for database insertion.
 * @param csvClimb The CsvClimb object from the parsed CSV.
 * @param userId The ID of the user importing the climb.
 * @param rowIndex The index of the row in the CSV for logging purposes.
 * @returns A Partial<Climb> object or null if transformation fails.
 */
function transformCsvClimbToDbClimb(csvClimb: CsvClimb, userId: string, rowIndex: number): Partial<Climb> | null {
  try {
    const dbClimb: Partial<Climb> = {
      user_id: userId,
      name: csvClimb.name,
      grade: csvClimb.grade,
      type: csvClimb.type,
      send_type: csvClimb.send_type,
      date: csvClimb.date,
      location: csvClimb.location,
      attempts: csvClimb.attempts,
      rating: csvClimb.rating,
      notes: csvClimb.notes,
      color: csvClimb.color,
      gym: csvClimb.gym,
      country: csvClimb.country,
    };

    if (csvClimb.duration !== undefined) {
      if (typeof csvClimb.duration === 'string') {
        const parts = csvClimb.duration.split(':');
        if (parts.length === 3) {
          dbClimb.duration = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
        } else if (!isNaN(Number(csvClimb.duration))) {
          dbClimb.duration = Number(csvClimb.duration);
        } else {
          console.warn(`[transformCsvClimbToDbClimb] Row ${rowIndex}: Could not parse duration string: ${csvClimb.duration}`);
        }
      } else if (typeof csvClimb.duration === 'number') {
        dbClimb.duration = csvClimb.duration;
      }
    }

    if (csvClimb.elevation_gain !== undefined) {
      dbClimb.elevation_gain = csvClimb.elevation_gain;
    }

    if (csvClimb.skills) {
      dbClimb.skills = csvClimb.skills.split(',').map(s => s.trim()).filter(s => s !== '');
    }
    if (csvClimb.physical_skills) {
      dbClimb.physical_skills = csvClimb.physical_skills.split(',').map(s => s.trim()).filter(s => s !== '');
    }
    if (csvClimb.technical_skills) {
      dbClimb.technical_skills = csvClimb.technical_skills.split(',').map(s => s.trim()).filter(s => s !== '');
    }

    if (csvClimb.stiffness !== undefined) {
      const stiffnessNum = Number(csvClimb.stiffness);
      if (!isNaN(stiffnessNum)) {
        dbClimb.stiffness = stiffnessNum;
      } else {
         console.warn(`[transformCsvClimbToDbClimb] Row ${rowIndex}: Stiffness value "${csvClimb.stiffness}" is not a valid number and will be ignored.`);
      }
    }
    return dbClimb;
  } catch (error: any) {
    console.error(`[transformCsvClimbToDbClimb] Row ${rowIndex}: Error transforming CSV data for climb "${csvClimb.name}":`, error.message, error.stack);
    return null;
  }
}


/**
 * Imports climbs from a CSV string for a given user.
 * @param csvString The CSV data as a string.
 * @param userId The ID of the user for whom to import the climbs.
 * @returns An object containing counts of successful imports, errors, and specific error messages.
 */
export async function importClimbsFromCsv(
  csvString: string,
  userId: string
): Promise<{ successCount: number; errorCount: number; errors: string[]; }> {
  let successCount = 0;
  let errorCount = 0;
  const importErrors: string[] = [];

  return new Promise((resolve) => {
    Papa.parse<Record<string, any>>(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        const { data: rows, errors: parseErrors } = results;

        if (parseErrors.length > 0) {
          parseErrors.forEach(err => {
            const errorMessage = `CSV Parsing Error: ${err.message} (Code: ${err.code}, Row: ${err.row})`;
            console.error(`[importClimbsFromCsv] ${errorMessage}`);
            importErrors.push(errorMessage);
            errorCount++;
          });
          // If there are parsing errors that prevent processing rows, we might resolve early.
          // However, Papaparse often provides row-specific errors, so we can continue processing valid rows.
        }

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowIndex = i + 2; // CSV row number (1-based index + header)
          let csvClimbRecord: CsvClimb;

          try {
            const mappedRow: Partial<CsvClimb> = {};
            for (const key in row) {
              if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== null && row[key] !== undefined) {
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
                 // Ensure all expected CsvClimb fields are mapped
                switch (normalizedKey) {
                    case 'name': mappedRow.name = String(row[key]); break;
                    case 'grade': mappedRow.grade = String(row[key]); break;
                    case 'type': mappedRow.type = String(row[key]) as ClimbTypeSpec; break;
                    case 'send_type': mappedRow.send_type = String(row[key]) as SendTypeSpec; break;
                    case 'date': mappedRow.date = String(row[key]); break;
                    case 'location': mappedRow.location = String(row[key]); break;
                    case 'attempts': mappedRow.attempts = Number(row[key]); break;
                    case 'rating': mappedRow.rating = Number(row[key]); break;
                    case 'notes': mappedRow.notes = String(row[key]); break;
                    case 'duration': mappedRow.duration = row[key]; break; // Keep as is, transform will handle string/number
                    case 'elevation_gain': mappedRow.elevation_gain = Number(row[key]); break;
                    case 'color': mappedRow.color = String(row[key]); break;
                    case 'gym': mappedRow.gym = String(row[key]); break;
                    case 'country': mappedRow.country = String(row[key]); break;
                    case 'skills': mappedRow.skills = String(row[key]); break;
                    case 'stiffness': mappedRow.stiffness = String(row[key]); break;
                    case 'physical_skills': mappedRow.physical_skills = String(row[key]); break;
                    case 'technical_skills': mappedRow.technical_skills = String(row[key]); break;
                }
              }
            }

            csvClimbRecord = {
              name: mappedRow.name || '', grade: mappedRow.grade || '',
              type: mappedRow.type || '' as ClimbTypeSpec, send_type: mappedRow.send_type || '' as SendTypeSpec,
              date: mappedRow.date || '', location: mappedRow.location || '',
              attempts: mappedRow.attempts, rating: mappedRow.rating, notes: mappedRow.notes,
              duration: mappedRow.duration, elevation_gain: mappedRow.elevation_gain,
              color: mappedRow.color, gym: mappedRow.gym, country: mappedRow.country,
              skills: mappedRow.skills, stiffness: mappedRow.stiffness,
              physical_skills: mappedRow.physical_skills, technical_skills: mappedRow.technical_skills,
            };

          } catch (mappingError: any) {
            const errorMessage = `Row ${rowIndex}: Error mapping CSV row data: ${mappingError.message}`;
            console.error(`[importClimbsFromCsv] ${errorMessage}`, row, mappingError.stack);
            importErrors.push(errorMessage);
            errorCount++;
            continue;
          }

          const validationErrors = validateClimbRecord(csvClimbRecord);
          if (validationErrors.length > 0) {
            const message = `Row ${rowIndex} (Climb: "${csvClimbRecord.name || 'N/A'}"): Validation failed - ${validationErrors.join(', ')}`;
            console.error(`[importClimbsFromCsv] ${message}`, csvClimbRecord);
            importErrors.push(message);
            errorCount++;
            continue;
          }

          const dbClimbData = transformCsvClimbToDbClimb(csvClimbRecord, userId, rowIndex);
          if (!dbClimbData) {
            // Error already logged by transformCsvClimbToDbClimb
            importErrors.push(`Row ${rowIndex} (Climb: "${csvClimbRecord.name || 'N/A'}"): Transformation to database format failed.`);
            errorCount++;
            continue;
          }

          const duplicateCheckPayload = { ...dbClimbData, user_id: userId } as Partial<Climb> & { user_id: string };
          try {
            const duplicate = await checkDuplicateClimb(duplicateCheckPayload);
            if (duplicate) {
              const message = `Row ${rowIndex}: Duplicate climb already exists (ID: ${duplicate.id}) for climb named "${dbClimbData.name}".`;
              console.warn(`[importClimbsFromCsv] ${message}`); // Warn for duplicates as they aren't strictly errors but are skipped.
              importErrors.push(message);
              errorCount++; // Counting duplicates as errors for the purpose of import summary
              continue;
            }
          } catch (dupError: any) {
              const message = `Row ${rowIndex} (Climb: "${dbClimbData.name}"): Error during duplicate check: ${dupError.message}`;
              console.error(`[importClimbsFromCsv] ${message}`, dupError.stack);
              importErrors.push(message);
              errorCount++;
              continue;
          }

          try {
            const { error: insertError } = await supabase.from('climbs').insert([dbClimbData]);
            if (insertError) {
              const message = `Row ${rowIndex} (Climb: "${dbClimbData.name}"): Error inserting climb - ${insertError.message}`;
              console.error(`[importClimbsFromCsv] ${message}`, dbClimbData);
              importErrors.push(message);
              errorCount++;
            } else {
              successCount++;
            }
          } catch (insertCatchError: any) {
            const message = `Row ${rowIndex} (Climb: "${dbClimbData.name}"): Unexpected error during database insertion: ${insertCatchError.message}`;
            console.error(`[importClimbsFromCsv] ${message}`, insertCatchError.stack);
            importErrors.push(message);
            errorCount++;
          }
        }
        resolve({ successCount, errorCount, errors: importErrors });
      },
      error: (parseError: any) => { // This callback is for critical parsing errors by Papaparse
        const errorMessage = `Critical CSV Parsing Error: ${parseError.message}`;
        console.error(`[importClimbsFromCsv] ${errorMessage}`, parseError);
        importErrors.push(errorMessage);
        // If PapaParse has a critical error, it might not have processed any rows.
        // results.data might be undefined or empty.
        // We'll count this as at least one major error.
        // If no rows were processed, errorCount should reflect that nothing was successful.
        resolve({ successCount: 0, errorCount: (rows && rows.length > 0) ? rows.length : 1, errors: importErrors });
      }
    });
  });
}

// Example usage (placeholder)
/*
async function testImport() {
  const userId = "USER_ID_HERE"; // Replace with actual user ID
  const csvData = \`name,grade,type,send_type,date,location,attempts,rating,notes
Awesome Climb,5.10a,sport,send,2024-01-15,Red River Gorge,1,4,Great route!
Another One,V5,boulder,flash,2024-01-16,Hueco Tanks,,5,Super fun
Test Climb Bad Date,5.9,trad,attempt,2024-13-01,Local Crag,,,,
Test Climb Dup,5.10a,sport,send,2024-01-15,Red River Gorge,1,4,This is a duplicate
Empty Name,,5.10a,sport,send,2024-01-15,Red River Gorge,1,4,This is a duplicate
Malformed Row,,,,,,,,,,,,,,,,,,
\`;

  console.log("Starting CSV Import Test...");
  const result = await importClimbsFromCsv(csvData, userId);
  console.log("Import Results:", result);
  if (result.errors.length > 0) {
    console.warn("Detailed errors from import:");
    result.errors.forEach(err => console.warn(err));
  }
}

// testImport().catch(console.error);
*/
