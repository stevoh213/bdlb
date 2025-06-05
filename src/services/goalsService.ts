
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/climbing';
import { PostgrestError } from '@supabase/supabase-js';

export type NewGoalData = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateGoalData = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

const handleSupabaseError = (error: PostgrestError | null, context: string) => {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw error;
  }
};

export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  if (!userId) {
    console.warn("fetchGoals called without userId");
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    handleSupabaseError(error, 'fetchGoals');
    return data || [];
  } catch (error) {
    console.error('Error in fetchGoals:', error);
    throw error;
  }
};

export const addGoal = async (goalData: NewGoalData, userId: string): Promise<Goal> => {
  if (!userId) throw new Error('User not authenticated for addGoal');
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goalData, user_id: userId })
      .select()
      .single();

    handleSupabaseError(error, 'addGoal');
    if (!data) throw new Error("Failed to add goal, no data returned.");
    return data;
  } catch (error) {
    console.error('Error in addGoal:', error);
    throw error;
  }
};

export const updateGoal = async (goalId: string, updates: UpdateGoalData): Promise<Goal> => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    handleSupabaseError(error, 'updateGoal');
    if (!data) throw new Error("Failed to update goal, no data returned.");
    return data;
  } catch (error) {
    console.error('Error in updateGoal:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    handleSupabaseError(error, 'deleteGoal');
  } catch (error) {
    console.error('Error in deleteGoal:', error);
    throw error;
  }
};
