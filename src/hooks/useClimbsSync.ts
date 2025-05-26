
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LocalClimb } from '@/types/climbing';

export interface SupabaseClimb {
  id: string;
  name: string;
  grade: string;
  type: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';
  send_type: 'send' | 'attempt' | 'flash' | 'onsight' | 'project';
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

export const useClimbsSync = () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupabaseClimb[];
    },
    enabled: !!user,
  });

  const addClimbMutation = useMutation({
    mutationFn: async (climb: Omit<LocalClimb, 'id' | 'timestamp' | 'sessionId'>) => {
      if (!user) throw new Error('User not authenticated');

      const climbData = {
        name: climb.name,
        grade: climb.grade,
        type: 'sport' as const, // Default type, could be parameterized
        send_type: climb.tickType === 'send' ? 'send' as const : 
                   climb.tickType === 'attempt' ? 'attempt' as const :
                   climb.tickType === 'flash' ? 'flash' as const :
                   'onsight' as const,
        date: new Date().toISOString().split('T')[0],
        location: 'Unknown', // Default location, could be from session
        attempts: 1,
        rating: climb.effort,
        notes: climb.notes,
        duration: climb.timeOnWall,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('climbs')
        .insert(climbData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climbs'] });
      toast({
        title: "Climb saved!",
        description: "Your climb has been successfully saved to the database.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving climb",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClimbMutation = useMutation({
    mutationFn: async ({ id, climb }: { id: string; climb: Partial<SupabaseClimb> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('climbs')
        .update(climb)
        .eq('id', id)
        .eq('user_id', user.id)
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
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('climbs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

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
