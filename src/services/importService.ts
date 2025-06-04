import { supabase } from '@/integrations/supabase/client';
import { CSVRecord } from '@/types/csv';
import { Climb } from '@/types/climbing';
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
      duration: parseFloat(record.duration) || 60, // Default duration
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
            default_climb_type: session.climbingType,
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
      ...climb,
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
      session_id: record.session_id || 'no-session-id', // Ensure session_id is handled
    };
  });
};

const insertClimbsBatch = async (climbsToInsert: Partial<Climb>[], userId: string): Promise<void> => {
  if (climbsToInsert.length === 0) return;

  // Ensure all required fields are present
  const validClimbs = climbsToInsert.filter(climb => 
    climb.name && 
    climb.grade && 
    climb.location && 
    climb.send_type && 
    climb.type &&
    climb.session_id
  ) as Array<Required<Pick<Climb, 'name' | 'grade' | 'location' | 'send_type' | 'type' | 'session_id'>> & Partial<Climb>>;

  if (validClimbs.length === 0) {
    throw new Error('No valid climbs to insert');
  }

  // Add user_id to all climbs
  const climbsWithUserId = validClimbs.map(climb => ({
    ...climb,
    user_id: userId,
  }));

  const { error } = await supabase
    .from('climbs')
    .insert(climbsWithUserId);

  if (error) {
    console.error('Error inserting climbs batch:', error);
    throw error;
  }
};

export { uploadDataToSupabase, transformCSVToClimbData, insertClimbsBatch };
