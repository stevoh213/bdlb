
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { supabase } from '@/integrations/supabase/client'; // Replaced by climbingService
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as climbingService from '@/services/climbingService'; // Import the service
import type { NewSessionData } from '@/services/climbingService'; // Import type for addSession

// This interface might be better placed in a dedicated types file (e.g., src/types/climbing.ts)
// if it's used by the service layer as well, to avoid circular dependencies or misplacements.
// For now, keeping it here as the service imports it from here.
export interface ClimbingSession {
  id: string;
  date: string;
  duration: number; // Assuming duration is stored in a consistent unit, e.g., minutes or seconds
  location: string;
  location_type?: 'indoor' | 'outdoor';
  // default_climb_type is not standard, perhaps 'climbing_type' or similar from SessionForm?
  // For now, keeping as is from original file.
  default_climb_type?: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Fields from SessionForm that might be part of a session object:
  gradeSystem?: string; // From SessionForm
  // Consider if 'climbs', 'isActive', 'breaks', 'totalBreakTime' from Session type in SessionForm.tsx are relevant here.
}


export const useClimbingSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery<ClimbingSession[], Error>({
    queryKey: ['climbing_sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Use the service layer function
      return climbingService.fetchSessions(user.id);
    },
    enabled: !!user,
  });

  const addSessionMutation = useMutation<
    ClimbingSession, // Type of data returned by mutationFn
    Error, // Type of error
    NewSessionData // Type of variables passed to mutationFn
  >({
    mutationFn: async (sessionData: NewSessionData) => {
      if (!user) throw new Error('User not authenticated');
      // Use the service layer function
      return climbingService.addSession(sessionData, user.id);
    },
    onSuccess: (data) => { // data is the newly created session from the service
      queryClient.invalidateQueries({ queryKey: ['climbing_sessions', user?.id] });
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
