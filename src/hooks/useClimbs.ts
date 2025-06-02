

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Climb } from '@/types/climbing';
import * as climbingService from '@/services/climbingService';
import type { NewClimbData, UpdateClimbData } from '@/services/climbingService';

// Props for addClimb - requires sessionId
interface AddClimbVariables extends NewClimbData {
  sessionId: string; 
}

// Props for updateClimb - requires climbId and the updates
interface UpdateClimbVariables {
  id: string;
  updates: UpdateClimbData;
}

export const useClimbs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: climbs = [], isLoading, error } = useQuery<Climb[], Error>({
    queryKey: ['climbs', user?.id],
    queryFn: async () => {
      if (!user) return [];
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
      return climbingService.addClimb(climbData, sessionId, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['climbs', user?.id] });
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
      return climbingService.updateClimb(id, updates);
    },
    onSuccess: (data) => {
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

