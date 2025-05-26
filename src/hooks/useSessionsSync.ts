
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types/climbing';

export interface SupabaseSession {
  id: string;
  date: string;
  location: string;
  duration: number;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  location_type?: 'indoor' | 'outdoor';
  default_climb_type?: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';
}

export const useSessionsSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('climbing_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupabaseSession[];
    },
    enabled: !!user,
  });

  const addSessionMutation = useMutation({
    mutationFn: async ({ session, climbIds }: { session: Session; climbIds: string[] }) => {
      if (!user) throw new Error('User not authenticated');

      const sessionData = {
        date: session.startTime.toISOString().split('T')[0],
        duration: session.endTime ? 
          Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60) : 0,
        location: session.location,
        location_type: 'indoor' as const, // Default, could be parameterized
        default_climb_type: session.climbingType,
        notes: session.notes,
        user_id: user.id,
      };

      // Insert the session
      const { data: sessionResult, error: sessionError } = await supabase
        .from('climbing_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create climb-session associations
      if (climbIds.length > 0) {
        const entries = climbIds.map(climbId => ({
          session_id: sessionResult.id,
          climb_id: climbId
        }));

        const { error: entriesError } = await supabase
          .from('climb_session_entries')
          .insert(entries);

        if (entriesError) throw entriesError;
      }

      return sessionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['climb_session_entries'] });
      toast({
        title: "Session saved!",
        description: "Your session and climb associations have been successfully saved to the database.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    error,
    addSession: (session: Session, climbIds: string[] = []) => addSessionMutation.mutate({ session, climbIds }),
    isAddingSession: addSessionMutation.isPending,
  };
};
