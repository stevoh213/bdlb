
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { NewGoalData, UpdateGoalData } from '@/services/goalsService';
import * as goalsService from '@/services/goalsService';
import { Goal } from '@/types/climbing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface UpdateGoalVariables {
  id: string;
  updates: UpdateGoalData;
}

export const useGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading, error } = useQuery<Goal[], Error>({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return goalsService.fetchGoals(user.id);
    },
    enabled: !!user,
  });

  const addGoalMutation = useMutation<
    Goal,
    Error,
    NewGoalData
  >({
    mutationFn: async (goalData: NewGoalData) => {
      if (!user) throw new Error('User not authenticated');
      return goalsService.addGoal(goalData, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast({
        title: "Goal created!",
        description: "Your climbing goal has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation<
    Goal,
    Error,
    UpdateGoalVariables
  >({
    mutationFn: async ({ id, updates }: UpdateGoalVariables) => {
      return goalsService.updateGoal(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast({
        title: "Goal updated!",
        description: "Your goal has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: async (goalId: string) => {
      return goalsService.deleteGoal(goalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast({
        title: "Goal deleted!",
        description: "Your goal has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    goals,
    isLoading,
    error,
    addGoal: addGoalMutation.mutate,
    addGoalAsync: addGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    deleteGoalAsync: deleteGoalMutation.mutateAsync,
    isAddingGoal: addGoalMutation.isPending,
    isUpdatingGoal: updateGoalMutation.isPending,
    isDeletingGoal: deleteGoalMutation.isPending,
  };
};
