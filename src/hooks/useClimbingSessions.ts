
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ClimbingSession {
  id: string;
  date: string;
  duration: number;
  location: string;
  location_type?: 'indoor' | 'outdoor';
  default_climb_type?: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useClimbingSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['climbing_sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('climbing_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as ClimbingSession[];
    },
    enabled: !!user,
  });

  const addSessionMutation = useMutation({
    mutationFn: async (sessionData: Omit<ClimbingSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('climbing_sessions')
        .insert({ ...sessionData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climbing_sessions'] });
      toast({
        title: "Session added!",
        description: "Your climbing session has been successfully logged.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    error,
    addSession: addSessionMutation.mutate,
    isAddingSession: addSessionMutation.isPending,
  };
};
