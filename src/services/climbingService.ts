import { supabase } from '@/integrations/supabase/client';
import { Climb, ClimbingSession } from '@/types/climbing';
import { PostgrestError } from '@supabase/supabase-js';

// Define more specific input types for add/update if they differ significantly from the fetched types
export type NewSessionData = Omit<ClimbingSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateSessionData = Partial<Omit<ClimbingSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// For climbs, ClimbLog is often used as the input type for new climbs.
// The task refers to ClimbData, which I'll take to mean Partial<Climb> for updates and something like ClimbLog for additions.
export type NewClimbData = Omit<Climb, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'session_id' | 'rating' | 'duration' | 'elevation_gain' | 'color' | 'gym' | 'country' | 'skills' | 'stiffness'>; // session_id will be passed as a separate param
export type UpdateClimbData = Partial<Omit<Climb, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'session_id'>>;

const handleSupabaseError = (error: PostgrestError | null, context: string) => {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw error; // Re-throw the error to be caught by react-query or the caller
  }
};

// === Session Functions ===

export const fetchSessions = async (userId: string): Promise<ClimbingSession[]> => {
  if (!userId) {
    console.warn("fetchSessions called without userId");
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('climbing_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    handleSupabaseError(error, 'fetchSessions');
    return (data || []).map(session => ({
      ...session,
      location_type: session.location_type as 'indoor' | 'outdoor' | undefined,
      default_climb_type: session.default_climb_type as 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine' | undefined
    }));
  } catch (error) {
    console.error('Error in fetchSessions:', error);
    throw error;
  }
};

export const addSession = async (sessionData: NewSessionData, userId: string): Promise<ClimbingSession> => {
  if (!userId) throw new Error('User not authenticated for addSession');
  try {
    const { data, error } = await supabase
      .from('climbing_sessions')
      .insert({ ...sessionData, user_id: userId })
      .select()
      .single();

    handleSupabaseError(error, 'addSession');
    if (!data) throw new Error("Failed to add session, no data returned.");
    return {
      ...data,
      location_type: data.location_type as 'indoor' | 'outdoor' | undefined,
      default_climb_type: data.default_climb_type as 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine' | undefined
    };
  } catch (error) {
    console.error('Error in addSession:', error);
    throw error;
  }
};

export const updateSession = async (sessionId: string, updates: UpdateSessionData): Promise<ClimbingSession> => {
  console.log("[climbingService.updateSession] Called with sessionId:", sessionId, "updates:", JSON.stringify(updates)); // DEBUG
  try {
    console.log("[climbingService.updateSession] Attempting Supabase update..."); // DEBUG
    const { data, error } = await supabase
      .from('climbing_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    console.log("[climbingService.updateSession] Supabase update call returned. Data:", data ? JSON.stringify(data) : null, "Error:", error ? JSON.stringify(error) : null); // DEBUG

    handleSupabaseError(error, 'updateSession');
    if (!data) {
      console.error("[climbingService.updateSession] No data returned from Supabase after update."); // DEBUG
      throw new Error("Failed to update session, no data returned.");
    }
    console.log("[climbingService.updateSession] Update successful, returning data."); // DEBUG
    return {
      ...data,
      location_type: data.location_type as 'indoor' | 'outdoor' | undefined,
      default_climb_type: data.default_climb_type as 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine' | undefined
    };
  } catch (error) {
    console.error('[climbingService.updateSession] Error caught in service catch block:', error); // DEBUG
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('climbing_sessions')
      .delete()
      .eq('id', sessionId);

    handleSupabaseError(error, 'deleteSession');
  } catch (error) {
    console.error('Error in deleteSession:', error);
    throw error;
  }
};

export const deleteSessionsByUserId = async (userId: string): Promise<void> => {
  // This is a potentially dangerous operation, ensure it's really needed.
  // Supabase RLS should prevent users from deleting others' data if configured correctly.
  try {
    const { error } = await supabase
      .from('climbing_sessions')
      .delete()
      .eq('user_id', userId);

    handleSupabaseError(error, 'deleteSessionsByUserId');
  } catch (error) {
    console.error('Error in deleteSessionsByUserId:', error);
    throw error;
  }
};

// === Climb Functions ===

// As per subtask: Fetches climbs for a GIVEN SESSION ID.
export const fetchClimbsBySessionId = async (sessionId: string): Promise<Climb[]> => {
   if (!sessionId) {
    console.warn("fetchClimbsBySessionId called without sessionId");
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('climbs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }); // Or by date, or another field

    handleSupabaseError(error, 'fetchClimbsBySessionId');
    return (data || []).map(climb => ({
      ...climb,
      type: climb.type as 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine',
      send_type: climb.send_type as 'send' | 'attempt' | 'flash' | 'onsight' | 'project',
      physical_skills: climb.physical_skills || [],
      technical_skills: climb.technical_skills || [],
      effort: climb.effort || undefined,
      height: climb.height || undefined,
      time_on_wall: climb.time_on_wall || undefined
    }));
  } catch (error) {
    console.error('Error in fetchClimbsBySessionId:', error);
    throw error;
  }
};

// To maintain current functionality of useClimbs.ts (fetch all climbs by user_id)
export const fetchAllUserClimbs = async (userId: string): Promise<Climb[]> => {
  if (!userId) {
    console.warn("fetchAllUserClimbs called without userId");
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('climbs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }); // Matching original hook

    handleSupabaseError(error, 'fetchAllUserClimbs');
    return (data || []).map(climb => ({
      ...climb,
      type: climb.type as 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine',
      send_type: climb.send_type as 'send' | 'attempt' | 'flash' | 'onsight' | 'project',
      physical_skills: climb.physical_skills || [],
      technical_skills: climb.technical_skills || [],
      effort: climb.effort || undefined,
      height: climb.height || undefined,
      time_on_wall: climb.time_on_wall || undefined
    }));
  } catch (error) {
    console.error('Error in fetchAllUserClimbs:', error);
    throw error;
  }
};

export const addClimb = async (climbData: NewClimbData, sessionId: string, userId: string): Promise<Climb> => {
  console.log("[climbingService.addClimb] Called with ClimbData:", JSON.parse(JSON.stringify(climbData)), "SessionID:", sessionId, "UserID:", userId);
  if (!userId) {
    console.error("[climbingService.addClimb] User not authenticated.");
    throw new Error('User not authenticated for addClimb');
  }
  if (!sessionId) {
    console.error("[climbingService.addClimb] Session ID is required.");
    throw new Error('Session ID is required for addClimb');
  }
  try {
    const payload = { ...climbData, session_id: sessionId, user_id: userId };
    console.log("[climbingService.addClimb] Payload for Supabase insert:", JSON.parse(JSON.stringify(payload)));
    console.log("[climbingService.addClimb] Attempting Supabase insert..."); // DEBUG: Log before await
    
    const { data, error } = await supabase
      .from('climbs')
      .insert(payload)
      .select()
      .single();

    // This log will only be reached if the await supabase call completes successfully or with a Supabase-specific error structure.
    console.log("[climbingService.addClimb] Supabase response received. Data:", data ? JSON.parse(JSON.stringify(data)) : null, "Error:", error ? JSON.parse(JSON.stringify(error)) : null); // DEBUG: Improved logging for potentially null data/error

    handleSupabaseError(error, 'addClimb'); // This function should log if error is a PostgrestError
    
    if (error) {
        // Log again here if handleSupabaseError didn't throw but there was still an error object
        console.error("[climbingService.addClimb] Supabase returned an error object that was handled or passed by handleSupabaseError:", JSON.parse(JSON.stringify(error)));
        // Depending on handleSupabaseError, an error might have already been thrown.
        // If not, and `error` is present, we should probably throw it. 
        // However, handleSupabaseError is expected to throw for critical DB errors.
    }

    if (!data) {
      console.error("[climbingService.addClimb] Failed to add climb, no data returned from Supabase. This is after error check.");
      throw new Error("Failed to add climb, no data returned from Supabase after error handling.");
    }
    
    const resultClimb: Climb = {
      ...data,
      type: data.type as Climb['type'], 
      send_type: data.send_type as Climb['send_type'], 
      date: data.date || new Date().toISOString(), 
      name: data.name || "Unnamed Climb",
      grade: data.grade || "Unknown Grade",
      attempts: data.attempts === undefined || data.attempts === null ? 1 : data.attempts,
      physical_skills: data.physical_skills || [],
      technical_skills: data.technical_skills || [],
    } as Climb; 
    console.log("[climbingService.addClimb] Processed result to be returned:", JSON.parse(JSON.stringify(resultClimb)));
    return resultClimb;
  } catch (errorCaught) { // Changed variable name to avoid conflict with supabase 'error' variable
    console.error('[climbingService.addClimb] Error caught in service catch block:', errorCaught); // DEBUG
    // Make sure to re-throw so the mutation knows it failed
    throw errorCaught; 
  }
};

export const updateClimb = async (climbId: string, updates: UpdateClimbData): Promise<Climb> => {
  try {
    const { data, error } = await supabase
      .from('climbs')
      .update(updates)
      .eq('id', climbId)
      .select()
      .single();

    handleSupabaseError(error, 'updateClimb');
    if (!data) throw new Error("Failed to update climb, no data returned.");
    return {
      ...data,
      type: data.type as 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine',
      send_type: data.send_type as 'send' | 'attempt' | 'flash' | 'onsight' | 'project',
      physical_skills: data.physical_skills || [],
      technical_skills: data.technical_skills || [],
      effort: data.effort || undefined,
      height: data.height || undefined,
      time_on_wall: data.time_on_wall || undefined
    };
  } catch (error) {
    console.error('Error in updateClimb:', error);
    throw error;
  }
};

export const deleteClimb = async (climbId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('climbs')
      .delete()
      .eq('id', climbId);

    handleSupabaseError(error, 'deleteClimb');
  } catch (error) {
    console.error('Error in deleteClimb:', error);
    throw error;
  }
};

export const deleteClimbsBySessionId = async (sessionId: string, userId: string): Promise<void> => {
  // userId for security check, ensuring user owns the session indirectly
  if (!userId) throw new Error('User not authenticated for deleteClimbsBySessionId');
  try {
    // First, verify the session belongs to the user to prevent deleting climbs from unauthorized sessions.
    // This is an extra check, RLS on 'climbs' table using user_id is the primary defense.
    const { data: sessionData, error: sessionError } = await supabase
      .from('climbing_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    handleSupabaseError(sessionError, 'deleteClimbsBySessionId (session check)');
    if (!sessionData) throw new Error("Session not found or user not authorized to delete climbs for this session.");

    // If session check passes, delete the climbs.
    const { error: deleteError } = await supabase
      .from('climbs')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId); // Ensure RLS is effective by including user_id in where clause

    handleSupabaseError(deleteError, 'deleteClimbsBySessionId (delete climbs)');
  } catch (error) {
    console.error('Error in deleteClimbsBySessionId:', error);
    throw error;
  }
};
