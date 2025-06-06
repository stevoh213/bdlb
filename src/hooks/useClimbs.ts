import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Climb } from "@/types/climbing";

export const useClimbs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: climbs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["climbs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("climbs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Climb[];
    },
    enabled: !!user,
  });

  const addClimbMutation = useMutation({
    mutationFn: async (
      climbData: Omit<Climb, "id" | "user_id" | "created_at" | "updated_at">,
    ) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("climbs")
        .insert({ ...climbData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["climbs"] });
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

  const updateClimbMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Climb>;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("climbs")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["climbs"] });
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
