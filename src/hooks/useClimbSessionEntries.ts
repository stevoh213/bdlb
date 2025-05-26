
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClimbSessionEntry {
  id: string;
  session_id: string;
  climb_id: string;
}

export const useClimbSessionEntries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['climb_session_entries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('climb_session_entries')
        .select(`
          *,
          climbing_sessions!inner(user_id)
        `)
        .eq('climbing_sessions.user_id', user.id);

      if (error) throw error;
      return data as ClimbSessionEntry[];
    },
    enabled: !!user,
  });

  const getClimbsBySession = (sessionId: string) => {
    return entries.filter(entry => entry.session_id === sessionId);
  };

  return {
    entries,
    isLoading,
    error,
    getClimbsBySession,
  };
};
