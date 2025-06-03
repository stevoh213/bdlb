/**
 * @file Service for handling climb import logic, including CSV parsing and duplicate detection.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Climb } from '@/types/climbing';
import { CsvClimb, ClimbTypeSpec, SendTypeSpec } from '../lib/importSpec'; // Relative path
import { validateClimbRecord } from '../lib/importValidation'; // Relative path
import { normalizeGrade, GradeSystem } from '../lib/gradeConversion'; // Added for grade normalization
import Papa from 'papaparse';

/**
 * Checks if a climb already exists in the database for the current user.
 */
export async function checkDuplicateClimb( /* ... existing code ... */
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
      .eq('user_id', climb.user_id).eq('name', climb.name).eq('grade', climb.grade).eq('date', climb.date).eq('location', climb.location)
      .maybeSingle();
    if (error && status !== 406) {
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
 * Grade normalization should happen *before* this, or this function needs grade system info.
 * For now, normalization will be done in processParsedData before calling this.
 */
function transformCsvClimbToDbClimb(
    csvClimb: CsvClimb, // Expects grade to be already normalized if needed
    userId: string,
    rowIndex: number
): Partial<Climb> | null {
  try {
    const dbClimb: Partial<Climb> = { /* ... existing CsvClimb to Climb mapping ... */
      user_id: userId, name: csvClimb.name, grade: csvClimb.grade, type: csvClimb.type,
      send_type: csvClimb.send_type, date: csvClimb.date, location: csvClimb.location,
      attempts: csvClimb.attempts, rating: csvClimb.rating, notes: csvClimb.notes,
      color: csvClimb.color, gym: csvClimb.gym, country: csvClimb.country,
    };
    // Duration parsing
    if (csvClimb.duration !== undefined) {
      if (typeof csvClimb.duration === 'string') {
        const parts = csvClimb.duration.split(':');
        if (parts.length === 3) dbClimb.duration = parseInt(parts[0],10)*3600 + parseInt(parts[1],10)*60 + parseInt(parts[2],10);
        else if (!isNaN(Number(csvClimb.duration))) dbClimb.duration = Number(csvClimb.duration);
        else console.warn(`[transformCsvClimbToDbClimb] Row ${rowIndex}: Could not parse duration string: ${csvClimb.duration}`);
      } else if (typeof csvClimb.duration === 'number') dbClimb.duration = csvClimb.duration;
    }
    if (csvClimb.elevation_gain !== undefined) dbClimb.elevation_gain = csvClimb.elevation_gain;
    // Skills array conversion
    if (csvClimb.skills) dbClimb.skills = Array.isArray(csvClimb.skills) ? csvClimb.skills : csvClimb.skills.split(',').map(s => s.trim()).filter(s => s !== '');
    if (csvClimb.physical_skills) dbClimb.physical_skills = Array.isArray(csvClimb.physical_skills) ? csvClimb.physical_skills : csvClimb.physical_skills.split(',').map(s => s.trim()).filter(s => s !== '');
    if (csvClimb.technical_skills) dbClimb.technical_skills = Array.isArray(csvClimb.technical_skills) ? csvClimb.technical_skills : csvClimb.technical_skills.split(',').map(s => s.trim()).filter(s => s !== '');
    // Stiffness
    if (csvClimb.stiffness !== undefined) {
      const stiffnessNum = Number(csvClimb.stiffness);
      if (!isNaN(stiffnessNum)) dbClimb.stiffness = stiffnessNum;
      else console.warn(`[transformCsvClimbToDbClimb] Row ${rowIndex}: Stiffness value "${csvClimb.stiffness}" is not a valid number and will be ignored.`);
    }
    return dbClimb;
  } catch (error: any) {
    console.error(`[transformCsvClimbToDbClimb] Row ${rowIndex}: Error transforming CSV data for climb "${csvClimb.name}":`, error.message, error.stack);
    return null;
  }
}

export interface ImportParams {
  userId: string;
  csvString?: string;
  preParsedData?: CsvClimb[];
  sourceGradeSystem?: GradeSystem; // From selected template
  defaultClimbType?: 'boulder' | 'route'; // From selected template
  targetGradeSystem?: GradeSystem; // User's preferred system, e.g., YDS or French (from settings)
}

/**
 * Processes an array of CsvClimb objects for import.
 */
async function processParsedData(
  parsedClimbs: CsvClimb[],
  userId: string,
  sourceGradeSystem?: GradeSystem,
  defaultClimbType?: 'boulder' | 'route',
  targetGradeSystem?: GradeSystem // Target for normalization, e.g. user's preferred system
): Promise<{ successCount: number; errorCount: number; errors: string[]; }> {
  let successCount = 0;
  let errorCount = 0;
  const importErrors: string[] = [];

  for (let i = 0; i < parsedClimbs.length; i++) {
    let csvClimbRecord = { ...parsedClimbs[i] }; // Clone to modify grade
    const rowIndex = i + 1;

    // **Grade Normalization Step**
    if (csvClimbRecord.grade) {
      const isBoulder = defaultClimbType === 'boulder' || csvClimbRecord.type === ClimbTypeSpec.BOULDER;
      const normalized = normalizeGrade(
        csvClimbRecord.grade,
        sourceGradeSystem, // System from the import template
        targetGradeSystem,  // Target system (e.g., user's preferred, or app default like French/Font)
        isBoulder
      );
      if (normalized !== csvClimbRecord.grade) {
        // console.log(`Grade normalized for row ${rowIndex}: "${csvClimbRecord.grade}" (${sourceGradeSystem || 'detected'}) -> "${normalized}" (${targetGradeSystem || (isBoulder ? 'Font' : 'French')})`);
        csvClimbRecord.grade = normalized;
      }
    }

    const validationErrors = validateClimbRecord(csvClimbRecord);
    if (validationErrors.length > 0) {
      const message = `Row ${rowIndex} (Climb: "${csvClimbRecord.name || 'N/A'}", Original Grade: "${parsedClimbs[i].grade}", Processed Grade: "${csvClimbRecord.grade}"): Validation failed - ${validationErrors.join(', ')}`;
      console.error(`[processParsedData] ${message}`, csvClimbRecord);
      importErrors.push(message);
      errorCount++;
      continue;
    }

    const dbClimbData = transformCsvClimbToDbClimb(csvClimbRecord, userId, rowIndex);
    if (!dbClimbData) {
      importErrors.push(`Row ${rowIndex} (Climb: "${csvClimbRecord.name || 'N/A'}"): Transformation to database format failed.`);
      errorCount++;
      continue;
    }

    // Duplicate check uses the (potentially normalized) grade from dbClimbData
    const duplicateCheckPayload = { ...dbClimbData, user_id: userId } as Partial<Climb> & { user_id: string };
    try {
      const duplicate = await checkDuplicateClimb(duplicateCheckPayload);
      if (duplicate) { /* ... existing duplicate handling ... */
        const message = `Row ${rowIndex}: Duplicate climb already exists (ID: ${duplicate.id}) for climb named "${dbClimbData.name}" with grade "${dbClimbData.grade}".`;
        console.warn(`[processParsedData] ${message}`);
        importErrors.push(message); errorCount++; continue;
      }
    } catch (dupError: any) { /* ... existing error handling ... */
      const message = `Row ${rowIndex} (Climb: "${dbClimbData.name}"): Error during duplicate check: ${dupError.message}`;
      console.error(`[processParsedData] ${message}`, dupError.stack);
      importErrors.push(message); errorCount++; continue;
    }

    try {
      const { error: insertError } = await supabase.from('climbs').insert([dbClimbData]);
      if (insertError) { /* ... existing error handling ... */
        const message = `Row ${rowIndex} (Climb: "${dbClimbData.name}"): Error inserting climb - ${insertError.message}`;
        console.error(`[processParsedData] ${message}`, dbClimbData);
        importErrors.push(message); errorCount++;
      } else {
        successCount++;
      }
    } catch (insertCatchError: any) { /* ... existing error handling ... */
      const message = `Row ${rowIndex} (Climb: "${dbClimbData.name}"): Unexpected error during database insertion: ${insertCatchError.message}`;
      console.error(`[processParsedData] ${message}`, insertCatchError.stack);
      importErrors.push(message); errorCount++;
    }
  }
  return { successCount, errorCount, errors: importErrors };
}


export async function importClimbsFromCsv(
  params: ImportParams
): Promise<{ successCount: number; errorCount: number; errors: string[]; }> {
  const { userId, csvString, preParsedData, sourceGradeSystem, defaultClimbType, targetGradeSystem } = params;

  if (!userId) { /* ... existing error handling ... */
    console.error("[importClimbsFromCsv] Error: userId is required.");
    return { successCount: 0, errorCount: 0, errors: ["User ID is required for import."] };
  }

  // Default target system for normalization if not provided by caller (e.g. user preference)
  // Let's make the app's internal "standard" French for routes and Font for boulders.
  const appTargetGradeSystem = targetGradeSystem; // If caller provides one, use it. Otherwise, normalizeGrade will use its own defaults.


  if (preParsedData) {
    // console.log("[importClimbsFromCsv] Processing pre-parsed data with grade system hints:", sourceGradeSystem, defaultClimbType);
    return processParsedData(preParsedData, userId, sourceGradeSystem, defaultClimbType, appTargetGradeSystem);
  }

  if (csvString) {
    // console.log("[importClimbsFromCsv] Processing CSV string with grade system hints:", sourceGradeSystem, defaultClimbType);
    // ... (Papa.parse logic remains largely the same) ...
    // The key is that CsvClimbArray produced by Papa.parse will then be passed to processParsedData
    // along with sourceGradeSystem, defaultClimbType, and appTargetGradeSystem.
    let parseErrorCount = 0;
    const parseErrorsMessages: string[] = [];

    return new Promise((resolve) => {
      Papa.parse<Record<string, any>>(csvString, { /* ... Papa.parse options ... */
        header: true, skipEmptyLines: true, dynamicTyping: true, // dynamicTyping for basic numbers
        complete: async (results) => {
          const { data: rows, errors: papaParseErrors } = results;
          if (papaParseErrors.length > 0) { /* ... error handling ... */
            papaParseErrors.forEach(err => { const msg = `CSV Parsing Error: ${err.message} (Code: ${err.code}, Row: ${err.row + 2})`; console.error(msg); parseErrorsMessages.push(msg); parseErrorCount++; });
          }
          const CsvClimbArray: CsvClimb[] = []; // Transform rows to CsvClimb[]
          for (let i = 0; i < rows.length; i++) { /* ... (row to CsvClimb mapping logic as before) ... */
            const row = rows[i]; const rowIndex = i+2;
            try {
                const mappedRow: Partial<CsvClimb> = {};
                for(const key in row){if(Object.prototype.hasOwnProperty.call(row,key)&&row[key]!==null&&row[key]!==undefined){const normKey=key.toLowerCase().replace(/\s+/g,'');switch(normKey){case 'name':mappedRow.name=String(row[key]);break;case 'grade':mappedRow.grade=String(row[key]);break;case 'type':mappedRow.type=String(row[key])as ClimbTypeSpec;break;case 'send_type':mappedRow.send_type=String(row[key])as SendTypeSpec;break;case 'date':mappedRow.date=String(row[key]);break;case 'location':mappedRow.location=String(row[key]);break;case 'attempts':mappedRow.attempts=Number(row[key]);break;case 'rating':mappedRow.rating=Number(row[key]);break;case 'notes':mappedRow.notes=String(row[key]);break;case 'duration':mappedRow.duration=row[key];break;case 'elevation_gain':mappedRow.elevation_gain=Number(row[key]);break;case 'color':mappedRow.color=String(row[key]);break;case 'gym':mappedRow.gym=String(row[key]);break;case 'country':mappedRow.country=String(row[key]);break;case 'skills':mappedRow.skills=String(row[key]);break;case 'stiffness':mappedRow.stiffness=String(row[key]);break;case 'physical_skills':mappedRow.physical_skills=String(row[key]);break;case 'technical_skills':mappedRow.technical_skills=String(row[key]);break;}}}
                CsvClimbArray.push({name:mappedRow.name||'',grade:mappedRow.grade||'',type:mappedRow.type||''as ClimbTypeSpec,send_type:mappedRow.send_type||''as SendTypeSpec,date:mappedRow.date||'',location:mappedRow.location||'',attempts:mappedRow.attempts,rating:mappedRow.rating,notes:mappedRow.notes,duration:mappedRow.duration,elevation_gain:mappedRow.elevation_gain,color:mappedRow.color,gym:mappedRow.gym,country:mappedRow.country,skills:mappedRow.skills,stiffness:mappedRow.stiffness,physical_skills:mappedRow.physical_skills,technical_skills:mappedRow.technical_skills,});
            } catch (mapErr:any) {const msg=`Row ${rowIndex}: Error mapping CSV row: ${mapErr.message}`; console.error(msg,row,mapErr.stack); parseErrorsMessages.push(msg); parseErrorCount++;}
          }
          if (parseErrorCount > 0 && CsvClimbArray.length === 0) {
            resolve({ successCount: 0, errorCount: parseErrorCount, errors: parseErrorsMessages }); return;
          }
          const processingResult = await processParsedData(CsvClimbArray, userId, sourceGradeSystem, defaultClimbType, appTargetGradeSystem);
          resolve({ successCount:processingResult.successCount, errorCount:processingResult.errorCount+parseErrorCount, errors:[...parseErrorsMessages,...processingResult.errors] });
        },
        error: (parseError: any) => { /* ... error handling ... */
          const msg = `Critical CSV Parsing Error: ${parseError.message}`; console.error(msg, parseError);
          resolve({ successCount: 0, errorCount: 1, errors: [msg] });
        }
      });
    });
  }

  console.error("[importClimbsFromCsv] Error: csvString or preParsedData must be provided.");
  return Promise.resolve({ successCount: 0, errorCount: 0, errors: ["Import data was not provided in the expected format."] });
}
