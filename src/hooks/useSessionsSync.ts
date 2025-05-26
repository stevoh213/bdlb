
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types/climbing';

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
      return data;
    },
    enabled: !!user,
  });

  const addSessionMutation = useMutation({
    mutationFn: async (session: Session) => {
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

      const { data, error } = await supabase
        .from('climbing_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Session saved!",
        description: "Your session has been successfully saved to the database.",
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
    addSession: addSessionMutation.mutate,
    isAddingSession: addSessionMutation.isPending,
  };
};
