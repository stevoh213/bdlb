
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { NewClimbData, UpdateClimbData } from '@/services/climbingService';
import * as climbingService from '@/services/climbingService';
import { Climb } from '@/types/climbing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Props for addClimb - requires sessionId
export interface AddClimbVariables extends NewClimbData {
  sessionId: string; 
}

// Props for updateClimb - requires climbId and the updates
interface UpdateClimbVariables {
  id: string;
  updates: UpdateClimbData;
}

export const useSessionClimbs = (sessionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: climbs = [], isLoading, error } = useQuery<Climb[], Error>({
    queryKey: ['session_climbs', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      return climbingService.fetchClimbsBySessionId(sessionId);
    },
    enabled: !!sessionId,
  });

  const addClimbMutation = useMutation<
    Climb,
    Error,
    AddClimbVariables 
  >({
    mutationFn: async ({ sessionId, ...climbData }: AddClimbVariables) => {
      console.log("[useSessionClimbs AddClimbMutation] MutationFn called. User:", JSON.parse(JSON.stringify(user)), "SessionID:", sessionId, "ClimbData:", JSON.parse(JSON.stringify(climbData)));
      if (!user) {
        console.error("[useSessionClimbs AddClimbMutation] User not authenticated.");
        throw new Error('User not authenticated');
      }
      if (!sessionId) {
        console.error("[useSessionClimbs AddClimbMutation] Session ID is required.");
        throw new Error('Session ID is required to add a climb.');
      }
      try {
        const result = await climbingService.addClimb(climbData, sessionId, user.id);
        console.log("[useSessionClimbs AddClimbMutation] Result from climbingService.addClimb:", JSON.parse(JSON.stringify(result)));
        return result;
      } catch (serviceError) {
        console.error("[useSessionClimbs AddClimbMutation] Error from climbingService.addClimb:", serviceError);
        throw serviceError;
      }
    },
    onSuccess: (data, variables, context) => {
      console.log("[useSessionClimbs AddClimbMutation] onSuccess triggered. Data:", JSON.parse(JSON.stringify(data)), "Variables:", JSON.parse(JSON.stringify(variables)));
      queryClient.invalidateQueries({ queryKey: ['session_climbs', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['climbs', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['climbing_sessions', user?.id] }); 
      toast({
        title: "Climb logged!",
        description: "Your climb has been successfully recorded.",
      });
    },
    onError: (error, variables, context) => {
      console.error("[useSessionClimbs AddClimbMutation] onError triggered. Error:", error, "Variables:", JSON.parse(JSON.stringify(variables)));
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
      return climbingService.updateClimb(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session_climbs', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['climbs', user?.id] });
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

  const deleteClimbMutation = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: async (climbId: string) => {
      if (!user) throw new Error('User not authenticated');
      return climbingService.deleteClimb(climbId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session_climbs', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['climbs', user?.id] });
      toast({
        title: "Climb deleted!",
        description: "Your climb has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting climb",
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
    addClimbAsync: addClimbMutation.mutateAsync,
    updateClimb: updateClimbMutation.mutate,
    deleteClimb: deleteClimbMutation.mutate,
    deleteClimbAsync: deleteClimbMutation.mutateAsync,
    isAddingClimb: addClimbMutation.isPending,
    isUpdatingClimb: updateClimbMutation.isPending,
    isDeletingClimb: deleteClimbMutation.isPending,
  };
};
