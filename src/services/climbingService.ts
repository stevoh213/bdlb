import { supabase } from '@/integrations/supabase/client';
import { ClimbingSession } from '@/hooks/useClimbingSessions'; // Assuming this is where the type is best sourced for now
import { Climb, ClimbLog } from '@/types/climbing'; // Climb is used by useClimbs, ClimbLog might be the input type for addClimb

// Define more specific input types for add/update if they differ significantly from the fetched types
export type NewSessionData = Omit<ClimbingSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateSessionData = Partial<Omit<ClimbingSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// For climbs, ClimbLog is often used as the input type for new climbs.
// The task refers to ClimbData, which I'll take to mean Partial<Climb> for updates and something like ClimbLog for additions.
export type NewClimbData = Omit<Climb, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'session_id'>; // session_id will be passed as a separate param
export type UpdateClimbData = Partial<Omit<Climb, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'session_id'>>;


const handleSupabaseError = (error: any, context: string) => {
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
    return data || [];
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
    return data;
  } catch (error) {
    console.error('Error in addSession:', error);
    throw error;
  }
};

export const updateSession = async (sessionId: string, updates: UpdateSessionData): Promise<ClimbingSession> => {
  try {
    const { data, error } = await supabase
      .from('climbing_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    handleSupabaseError(error, 'updateSession');
    if (!data) throw new Error("Failed to update session, no data returned.");
    return data;
  } catch (error) {
    console.error('Error in updateSession:', error);
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
    return data || [];
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
    return data || [];
  } catch (error) {
    console.error('Error in fetchAllUserClimbs:', error);
    throw error;
  }
};


export const addClimb = async (climbData: NewClimbData, sessionId: string, userId: string): Promise<Climb> => {
  if (!userId) throw new Error('User not authenticated for addClimb');
  if (!sessionId) throw new Error('Session ID is required for addClimb');
  try {
    const { data, error } = await supabase
      .from('climbs')
      .insert({ ...climbData, session_id: sessionId, user_id: userId })
      .select()
      .single();

    handleSupabaseError(error, 'addClimb');
    if (!data) throw new Error("Failed to add climb, no data returned.");
    return data;
  } catch (error) {
    console.error('Error in addClimb:', error);
    throw error;
  }
};

export const updateClimb = async (climbId: string, updates: UpdateClimbData, userId: string): Promise<Climb> => {
  // userId is included to ensure users can only update their own climbs, assuming RLS is also in place.
  if (!userId) throw new Error('User not authenticated for updateClimb');
  try {
    const { data, error } = await supabase
      .from('climbs')
      .update(updates)
      .eq('id', climbId)
      .eq('user_id', userId) // Important for security
      .select()
      .single();

    handleSupabaseError(error, 'updateClimb');
    if (!data) throw new Error("Failed to update climb, no data returned.");
    return data;
  } catch (error) {
    console.error('Error in updateClimb:', error);
    throw error;
  }
};

export const deleteClimb = async (climbId: string, userId: string): Promise<void> => {
  // userId for security check
  if (!userId) throw new Error('User not authenticated for deleteClimb');
  try {
    const { error } = await supabase
      .from('climbs')
      .delete()
      .eq('id', climbId)
      .eq('user_id', userId); // Important for security

    handleSupabaseError(error, 'deleteClimb');
  } catch (error)
  {
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
