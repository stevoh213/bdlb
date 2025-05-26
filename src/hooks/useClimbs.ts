
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Climb {
  id: string;
  name: string;
  grade: string;
  type: 'sport' | 'trad' | 'boulder' | 'toprope' | 'multipitch';
  send_type: 'send' | 'attempt' | 'flash' | 'onsight';
  date: string;
  location: string;
  attempts: number;
  rating?: number;
  notes?: string;
  duration?: number;
  elevation_gain?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useClimbs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: climbs = [], isLoading, error } = useQuery({
    queryKey: ['climbs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('climbs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Climb[];
    },
    enabled: !!user,
  });

  const addClimbMutation = useMutation({
    mutationFn: async (climbData: Omit<Climb, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('climbs')
        .insert([{ ...climbData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climbs'] });
      toast({
        title: "Climb added!",
        description: "Your climb has been successfully logged.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding climb",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClimbMutation = useMutation({
    mutationFn: async ({ id, ...climbData }: Partial<Climb> & { id: string }) => {
      const { data, error } = await supabase
        .from('climbs')
        .update(climbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climbs'] });
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

  const deleteClimbMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('climbs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climbs'] });
      toast({
        title: "Climb deleted!",
        description: "Your climb has been successfully deleted.",
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
    updateClimb: updateClimbMutation.mutate,
    deleteClimb: deleteClimbMutation.mutate,
    isAddingClimb: addClimbMutation.isPending,
    isUpdatingClimb: updateClimbMutation.isPending,
    isDeletingClimb: deleteClimbMutation.isPending,
  };
};
