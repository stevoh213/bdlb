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
 * Intelligently transform and clean climb record data
 */
function intelligentlyTransformRecord(record: CsvClimb): CsvClimb {
  const transformed = { ...record };
  
  // Clean and parse grade
  if (transformed.grade && typeof transformed.grade === 'string') {
    // Remove URLs, parentheses content, and extra whitespace
    transformed.grade = transformed.grade
      .replace(/\s*\([^)]*\)/g, '') // Remove anything in parentheses
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .trim();
    
    // Clean common grade variations
    transformed.grade = transformed.grade
      .replace(/^grade:?\s*/i, '') // Remove "Grade:" prefix
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
  
  // Transform climb type with fuzzy matching
  if (transformed.type && typeof transformed.type === 'string') {
    const typeStr = transformed.type.toLowerCase().trim();
    const typeMap: Record<string, ClimbTypeSpec> = {
      // Direct matches
      'sport': ClimbTypeSpec.SPORT,
      'trad': ClimbTypeSpec.TRAD,
      'boulder': ClimbTypeSpec.BOULDER,
      'bouldering': ClimbTypeSpec.BOULDER,
      'top rope': ClimbTypeSpec.TOP_ROPE,
      'toprope': ClimbTypeSpec.TOP_ROPE,
      'top-rope': ClimbTypeSpec.TOP_ROPE,
      'tr': ClimbTypeSpec.TOP_ROPE,
      'alpine': ClimbTypeSpec.ALPINE,
      // Common variations
      'lead': ClimbTypeSpec.SPORT, // Default lead to sport
      'sport lead': ClimbTypeSpec.SPORT,
      'trad lead': ClimbTypeSpec.TRAD,
      'sport climbing': ClimbTypeSpec.SPORT,
      'traditional': ClimbTypeSpec.TRAD,
      'traditional climbing': ClimbTypeSpec.TRAD,
      'bloc': ClimbTypeSpec.BOULDER, // French for boulder
      'blocs': ClimbTypeSpec.BOULDER,
      'highball': ClimbTypeSpec.BOULDER,
      'problem': ClimbTypeSpec.BOULDER,
      'mountaineering': ClimbTypeSpec.ALPINE,
      'multi-pitch': ClimbTypeSpec.TRAD, // Often trad
      'multipitch': ClimbTypeSpec.TRAD,
    };
    
    transformed.type = typeMap[typeStr] || transformed.type as ClimbTypeSpec;
  }
  
  // Transform send type with extensive mapping
  if (transformed.send_type && typeof transformed.send_type === 'string') {
    const sendStr = transformed.send_type.toLowerCase().trim();
    const sendMap: Record<string, SendTypeSpec> = {
      // Standard types
      'send': SendTypeSpec.SEND,
      'sent': SendTypeSpec.SEND,
      'attempt': SendTypeSpec.ATTEMPT,
      'attempted': SendTypeSpec.ATTEMPT,
      'flash': SendTypeSpec.FLASH,
      'flashed': SendTypeSpec.FLASH,
      'onsight': SendTypeSpec.ONSIGHT,
      'on-sight': SendTypeSpec.ONSIGHT,
      'on sight': SendTypeSpec.ONSIGHT,
      'onsighted': SendTypeSpec.ONSIGHT,
      'project': SendTypeSpec.PROJECT,
      'projecting': SendTypeSpec.PROJECT,
      'working': SendTypeSpec.PROJECT,
      // Common variations
      'redpoint': SendTypeSpec.SEND,
      'red point': SendTypeSpec.SEND,
      'pinkpoint': SendTypeSpec.SEND,
      'pink point': SendTypeSpec.SEND,
      'clean': SendTypeSpec.SEND,
      'complete': SendTypeSpec.SEND,
      'completed': SendTypeSpec.SEND,
      'success': SendTypeSpec.SEND,
      'successful': SendTypeSpec.SEND,
      'tick': SendTypeSpec.SEND,
      'ticked': SendTypeSpec.SEND,
      'led': SendTypeSpec.SEND,
      'lead': SendTypeSpec.SEND,
      'top rope': SendTypeSpec.SEND,
      'toprope': SendTypeSpec.SEND,
      'tr': SendTypeSpec.SEND,
      // Attempts/Falls
      'fell': SendTypeSpec.ATTEMPT,
      'fall': SendTypeSpec.ATTEMPT,
      'hung': SendTypeSpec.ATTEMPT,
      'hang': SendTypeSpec.ATTEMPT,
      'dogged': SendTypeSpec.ATTEMPT,
      'dog': SendTypeSpec.ATTEMPT,
      'incomplete': SendTypeSpec.ATTEMPT,
      'failed': SendTypeSpec.ATTEMPT,
      'fail': SendTypeSpec.ATTEMPT,
      'one hang': SendTypeSpec.ATTEMPT,
      'with falls': SendTypeSpec.ATTEMPT,
      'not clean': SendTypeSpec.ATTEMPT,
      // Beta flash variations
      'beta flash': SendTypeSpec.FLASH,
      'betaflash': SendTypeSpec.FLASH,
      'worked': SendTypeSpec.PROJECT,
    };
    
    transformed.send_type = sendMap[sendStr] || transformed.send_type as SendTypeSpec;
  }
  
  // Parse various date formats intelligently
  if (transformed.date && typeof transformed.date === 'string') {
    transformed.date = parseFlexibleDate(transformed.date);
  }
  
  // Parse skills from various formats
  if (transformed.skills && typeof transformed.skills === 'string') {
    transformed.skills = parseSkills(transformed.skills);
  }
  if (transformed.physical_skills && typeof transformed.physical_skills === 'string') {
    transformed.physical_skills = parseSkills(transformed.physical_skills);
  }
  if (transformed.technical_skills && typeof transformed.technical_skills === 'string') {
    transformed.technical_skills = parseSkills(transformed.technical_skills);
  }
  
  // Clean location - handle empty or whitespace-only strings
  if (transformed.location && typeof transformed.location === 'string') {
    transformed.location = transformed.location
      .replace(/\s+/g, ' ')
      .trim();
    
    // If location is empty after trimming, try to find it in other fields
    if (!transformed.location) {
      // Check if gym field has a value
      if (transformed.gym && typeof transformed.gym === 'string' && transformed.gym.trim()) {
        transformed.location = transformed.gym.trim();
      }
      // Check if country field has a value
      else if (transformed.country && typeof transformed.country === 'string' && transformed.country.trim()) {
        transformed.location = transformed.country.trim();
      }
    }
  } else if (!transformed.location) {
    // If no location field, check gym or country
    if (transformed.gym && typeof transformed.gym === 'string' && transformed.gym.trim()) {
      transformed.location = transformed.gym.trim();
    } else if (transformed.country && typeof transformed.country === 'string' && transformed.country.trim()) {
      transformed.location = transformed.country.trim();
    }
  }
  
  // If still no location, check if the name field contains location info
  if (!transformed.location && transformed.name) {
    // Common patterns: "Route Name at Location" or "Route Name - Location"
    const locationMatch = transformed.name.match(/(?:at|@|-)\s*(.+)$/i);
    if (locationMatch) {
      transformed.location = locationMatch[1].trim();
    }
  }
  
  // Parse rating if it's a string
  if (transformed.rating !== undefined && typeof transformed.rating === 'string') {
    // Handle star ratings like "3 stars", "***", "4/5"
    const ratingStr = transformed.rating.toLowerCase();
    if (ratingStr.includes('star')) {
      const match = ratingStr.match(/(\d+)/);
      if (match) transformed.rating = parseInt(match[1]);
    } else if (ratingStr.match(/^\*+$/)) {
      transformed.rating = ratingStr.length; // Count asterisks
    } else if (ratingStr.match(/^\d+\/\d+$/)) {
      const [num, denom] = ratingStr.split('/').map(Number);
      transformed.rating = Math.round((num / denom) * 5); // Convert to 5-star scale
    } else {
      const parsed = parseFloat(ratingStr);
      if (!isNaN(parsed)) transformed.rating = parsed;
    }
  }
  
  // Parse attempts flexibly
  if (transformed.attempts !== undefined && typeof transformed.attempts === 'string') {
    const attemptStr = transformed.attempts.toLowerCase();
    // Handle patterns like "3 tries", "2 attempts", "first go", "flash"
    if (attemptStr.includes('first') || attemptStr.includes('flash') || attemptStr.includes('onsight')) {
      transformed.attempts = 1;
    } else {
      const match = attemptStr.match(/(\d+)/);
      if (match) transformed.attempts = parseInt(match[1]);
    }
  }
  
  return transformed;
}

/**
 * Parse flexible date formats
 */
function parseFlexibleDate(dateStr: string): string {
  const cleaned = dateStr.trim();
  
  // Already in correct format
  if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return cleaned;
  }
  
  // Common date formats to try
  const formats = [
    // MM/DD/YYYY, M/D/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['month', 'day', 'year'] },
    // DD/MM/YYYY, D/M/YYYY (European)
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['day', 'month', 'year'], isEuropean: true },
    // MM-DD-YYYY, M-D-YYYY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: ['month', 'day', 'year'] },
    // DD.MM.YYYY (European)
    { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, order: ['day', 'month', 'year'] },
    // YYYY/MM/DD
    { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, order: ['year', 'month', 'day'] },
    // Month DD, YYYY with time and timezone (e.g., "March 7, 2025 6:30 AM (MST) → 7:30 AM")
    { regex: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2}),?\s+(\d{4})\s+.*/i, order: ['month', 'day', 'year'], isNamed: true },
    // Month DD, YYYY (e.g., "January 15, 2023")
    { regex: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2}),?\s+(\d{4})$/i, order: ['month', 'day', 'year'], isNamed: true },
    // DD Month YYYY (e.g., "15 January 2023")
    { regex: /^(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*,?\s+(\d{4})$/i, order: ['day', 'month', 'year'], isNamed: true },
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format.regex);
    if (match) {
      let year = '', month = '', day = '';
      
      if (format.isNamed) {
        const monthNames: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        
        for (let i = 0; i < format.order.length; i++) {
          const part = format.order[i];
          const value = match[i + 1];
          if (part === 'month') {
            month = monthNames[value.substring(0, 3).toLowerCase()] || '01';
          } else if (part === 'day') {
            day = value.padStart(2, '0');
          } else if (part === 'year') {
            year = value;
          }
        }
      } else {
        for (let i = 0; i < format.order.length; i++) {
          const part = format.order[i];
          const value = match[i + 1].padStart(2, '0');
          if (part === 'year') year = match[i + 1];
          else if (part === 'month') month = value;
          else if (part === 'day') day = value;
        }
        
        // Validate day/month for ambiguous formats
        if (!format.isEuropean && parseInt(day) > 12 && parseInt(month) <= 12) {
          // Swap if day > 12 and month <= 12 (likely European format)
          [day, month] = [month, day];
        }
      }
      
      return `${year}-${month}-${day}`;
    }
  }
  
  // Try more aggressive parsing for complex formats
  // Handle formats with time and timezone info
  const complexDateMatch = cleaned.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (complexDateMatch) {
    const monthNames: Record<string, string> = {
      jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
      apr: '04', april: '04', may: '05', jun: '06', june: '06',
      jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09',
      oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12'
    };
    
    const monthStr = complexDateMatch[1].toLowerCase();
    const day = complexDateMatch[2].padStart(2, '0');
    const year = complexDateMatch[3];
    
    const month = monthNames[monthStr] || monthNames[monthStr.substring(0, 3)];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  
  // Try parsing with Date object as last resort
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
    const day = parsed.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return cleaned; // Return original if no format matches
}

/**
 * Parse skills from various formats
 */
function parseSkills(skillStr: string): string {
  // Common delimiters: comma, semicolon, pipe, slash
  const skills = skillStr
    .split(/[,;|\/]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      // Normalize common skill terms
      const normalized = s.toLowerCase();
      const skillMap: Record<string, string> = {
        'crimp': 'crimpy',
        'crimps': 'crimpy',
        'crimping': 'crimpy',
        'dyno': 'dynamic',
        'dynos': 'dynamic',
        'slab': 'slabby',
        'overhang': 'overhanging',
        'roof': 'roofs',
        'stem': 'stemming',
        'mantle': 'mantles',
        'mantel': 'mantles',
        'jam': 'jamming',
        'crack': 'cracks',
        'tech': 'technical',
        'techy': 'technical',
        'balance': 'balancy',
        'pump': 'pumpy',
        'enduro': 'endurance',
        'power': 'powerful',
        'delicate': 'delicate',
        'heel': 'heel hooks',
        'toe': 'toe hooks',
      };
      
      return skillMap[normalized] || s;
    });
  
  return skills.join(', ');
}

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
    
    // Preprocess the record with intelligent transformations
    csvClimbRecord = intelligentlyTransformRecord(csvClimbRecord);
    
    // Debug logging for problematic records
    if (!csvClimbRecord.location || !csvClimbRecord.location.trim() || 
        !csvClimbRecord.date || !csvClimbRecord.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log(`Row ${rowIndex} transformation result:`, {
        location: csvClimbRecord.location,
        date: csvClimbRecord.date,
        originalDate: parsedClimbs[i].date,
        gym: csvClimbRecord.gym,
        country: csvClimbRecord.country
      });
    }

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
