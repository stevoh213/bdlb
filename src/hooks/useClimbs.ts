
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { supabase } from '@/integrations/supabase/client'; // Replaced by climbingService
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Climb } from '@/types/climbing';
import * as climbingService from '@/services/climbingService'; // Import the service
import type { NewClimbData, UpdateClimbData } from '@/services/climbingService'; // Import types

// Props for addClimb - requires sessionId
interface AddClimbVariables extends NewClimbData {
  sessionId: string; 
}

// Props for updateClimb - requires climbId and the updates
interface UpdateClimbVariables {
  id: string;
  updates: UpdateClimbData;
}


export const useClimbs = (/* Optional sessionId for fetching climbs for a specific session */) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // This query fetches ALL climbs for the user. 
  // If fetching climbs for a specific session is needed, a different queryKey and queryFn would be used,
  // potentially passing sessionId as a parameter to useClimbs.
  const { data: climbs = [], isLoading, error } = useQuery<Climb[], Error>({
    queryKey: ['climbs', user?.id], // Global climbs for the user
    queryFn: async () => {
      if (!user) return [];
      // Uses fetchAllUserClimbs to maintain original behavior
      return climbingService.fetchAllUserClimbs(user.id);
    },
    enabled: !!user,
  });

  const addClimbMutation = useMutation<
    Climb,
    Error,
    AddClimbVariables 
  >({
    mutationFn: async ({ sessionId, ...climbData }: AddClimbVariables) => {
      if (!user) throw new Error('User not authenticated');
      if (!sessionId) throw new Error('Session ID is required to add a climb.');
      // Use the service layer function
      return climbingService.addClimb(climbData, sessionId, user.id);
    },
    onSuccess: (data) => { // data is the newly added climb
      // Invalidate all user climbs. If climbs were per-session, this would be more specific.
      queryClient.invalidateQueries({ queryKey: ['climbs', user?.id] });
      // If you also have queries for specific sessions, invalidate them too:
      // queryClient.invalidateQueries({ queryKey: ['climbs_for_session', data.session_id] });
      toast({
        title: "Climb logged!",
        description: "Your climb has been successfully recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error logging climb",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClimbMutation = useMutation<
    Climb,
    Error,
    UpdateClimbVariables
  >({
    mutationFn: async ({ id, updates }: UpdateClimbVariables) => {
      if (!user) throw new Error('User not authenticated');
      // Use the service layer function
      return climbingService.updateClimb(id, updates, user.id);
    },
    onSuccess: (data) => { // data is the updated climb
      queryClient.invalidateQueries({ queryKey: ['climbs', user?.id] });
      // If you also have queries for specific sessions, invalidate them too:
      // queryClient.invalidateQueries({ queryKey: ['climbs_for_session', data.session_id] });
      toast({
        title: "Climb updated!",
        description: "Your climb has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating climb",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    climbs,
    isLoading,
    error,
    addClimb: addClimbMutation.mutate,
    updateClimb: updateClimbMutation.mutate,
    isAddingClimb: addClimbMutation.isPending,
    isUpdatingClimb: updateClimbMutation.isPending,
  };
};
