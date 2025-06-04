
import { supabase } from '@/integrations/supabase/client';
import { CSVRecord } from '@/types/csv';
import { Climb } from '@/types/climbing';
import { CsvClimb, ClimbTypeSpec, SendTypeSpec } from '@/lib/importSpec';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  id: string;
  location: string;
  date: string;
  duration: number;
  notes?: string;
  gradeSystem?: string;
  climbingType?: string;
}

interface ClimbData {
  name: string;
  grade: string;
  type: string;
  send_type: string;
  attempts: number;
  date: string;
  location: string;
  notes?: string;
}

const parseCSVData = (csvData: CSVRecord[]): { sessions: SessionData[]; climbs: ClimbData[] } => {
  const sessions: SessionData[] = [];
  const climbs: ClimbData[] = [];

  csvData.forEach((record) => {
    // Extract session data
    const sessionId = uuidv4();
    const session: SessionData = {
      id: sessionId,
      location: record.location,
      date: record.date,
      duration: parseFloat(record.duration || '60') || 60, // Default duration
      notes: record.session_notes,
      gradeSystem: record.grade_system,
      climbingType: record.climbing_type,
    };
    sessions.push(session);

    // Extract climb data
    const climb: ClimbData = {
      name: record.climb_name,
      grade: record.climb_grade,
      type: record.climb_type,
      send_type: record.send_type,
      attempts: parseInt(record.attempts) || 1,
      date: record.date,
      location: record.location,
      notes: record.climb_notes,
    };
    climbs.push(climb);
  });

  return { sessions, climbs };
};

const uploadDataToSupabase = async (csvData: CSVRecord[], userId: string) => {
  try {
    const { sessions, climbs } = parseCSVData(csvData);

    // First, insert the sessions and collect their IDs
    const sessionIds: string[] = [];
    for (const session of sessions) {
      const { data, error } = await supabase
        .from('climbing_sessions')
        .insert([
          {
            id: session.id,
            user_id: userId,
            date: session.date,
            duration: session.duration,
            location: session.location,
            notes: session.notes,
            gradeSystem: session.gradeSystem,
            default_climb_type: mapClimbType(session.climbingType),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting session:', error);
        throw error;
      }
      sessionIds.push(data.id);
    }

    // Then, insert the climbs, referencing the session IDs
    const climbsToInsert = climbs.map((climb, index) => ({
      name: climb.name,
      grade: climb.grade,
      type: mapClimbType(climb.type),
      send_type: mapSendType(climb.send_type),
      attempts: climb.attempts,
      date: climb.date,
      location: climb.location,
      notes: climb.notes,
      user_id: userId,
      session_id: sessionIds[index % sessionIds.length], // Assign session ID
    }));

    // Use insertClimbsBatch to handle batch insertion
    await insertClimbsBatch(climbsToInsert, userId);

  } catch (error) {
    console.error('Error uploading data to Supabase:', error);
    throw error;
  }
};

const mapClimbType = (type: string | undefined): 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine' => {
  if (!type) return 'sport';
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('boulder')) return 'boulder';
  if (normalizedType.includes('trad')) return 'trad';
  if (normalizedType.includes('top') || normalizedType.includes('rope')) return 'top rope';
  if (normalizedType.includes('alpine')) return 'alpine';
  return 'sport';
};

const mapSendType = (sendType: string | undefined): 'send' | 'attempt' | 'flash' | 'onsight' | 'project' => {
  if (!sendType) return 'attempt';
  const normalizedSendType = sendType.toLowerCase();
  if (normalizedSendType.includes('flash')) return 'flash';
  if (normalizedSendType.includes('onsight')) return 'onsight';
  if (normalizedSendType.includes('send')) return 'send';
  if (normalizedSendType.includes('project')) return 'project';
  return 'attempt';
};

const transformCSVToClimbData = (csvData: CSVRecord[], userId: string): Omit<Climb, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] => {
  return csvData.map(record => {
    return {
      name: record.climb_name || 'Unknown Climb',
      grade: record.climb_grade || 'Unknown',
      type: mapClimbType(record.climb_type),
      send_type: mapSendType(record.send_type),
      date: record.date || new Date().toISOString(),
      location: record.location || 'Unknown Location',
      attempts: parseInt(record.attempts) || 1,
      notes: record.climb_notes,
      session_id: 'default-session-id', // Will be replaced with actual session ID
    };
  });
};

const insertClimbsBatch = async (climbsToInsert: any[], userId: string): Promise<void> => {
  if (climbsToInsert.length === 0) return;

  // Ensure all required fields are present and properly typed
  const validClimbs = climbsToInsert.filter(climb => 
    climb.name && 
    climb.grade && 
    climb.location && 
    climb.send_type && 
    climb.type &&
    climb.session_id
  );

  if (validClimbs.length === 0) {
    throw new Error('No valid climbs to insert');
  }

  const { error } = await supabase
    .from('climbs')
    .insert(validClimbs);

  if (error) {
    console.error('Error inserting climbs batch:', error);
    throw error;
  }
};

// New function for importing climbs from CSV data
export const importClimbsFromCsv = async ({ userId, preParsedData }: { userId: string; preParsedData: CsvClimb[] }) => {
  try {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const climbData of preParsedData) {
      try {
        // Create a session for each climb (or group them as needed)
        const sessionData = {
          user_id: userId,
          date: climbData.date,
          location: climbData.location,
          duration: typeof climbData.duration === 'string' ? parseInt(climbData.duration) || 60 : climbData.duration || 60,
          notes: `Imported climb session for ${climbData.name}`,
          default_climb_type: mapClimbType(climbData.type),
        };

        const { data: session, error: sessionError } = await supabase
          .from('climbing_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (sessionError) {
          throw sessionError;
        }

        // Insert the climb
        const climbInsertData = {
          user_id: userId,
          session_id: session.id,
          name: climbData.name,
          grade: climbData.grade,
          type: mapClimbType(climbData.type),
          send_type: mapSendType(climbData.send_type),
          attempts: climbData.attempts || 1,
          date: climbData.date,
          location: climbData.location,
          notes: climbData.notes,
        };

        const { error: climbError } = await supabase
          .from('climbs')
          .insert(climbInsertData);

        if (climbError) {
          throw climbError;
        }

        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`Error importing climb "${climbData.name}": ${error.message}`);
      }
    }

    return {
      successCount,
      errorCount,
      errors,
    };
  } catch (error: any) {
    console.error('Error in importClimbsFromCsv:', error);
    throw error;
  }
};

// Check for duplicate climb function
export const checkDuplicateClimb = async (climbData: any, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('climbs')
      .select('id')
      .eq('user_id', userId)
      .eq('name', climbData.name)
      .eq('grade', climbData.grade)
      .eq('date', climbData.date)
      .eq('location', climbData.location);

    if (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }

    return (data && data.length > 0);
  } catch (error) {
    console.error('Error in checkDuplicateClimb:', error);
    return false;
  }
};

export { uploadDataToSupabase, transformCSVToClimbData, insertClimbsBatch };
