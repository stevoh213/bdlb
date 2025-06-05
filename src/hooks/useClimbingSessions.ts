import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mapDbSessionToLocalSession } from '@/lib/utils';
import type { NewSessionData, UpdateSessionData } from '@/services/climbingService';
import * as climbingService from '@/services/climbingService';
import { ClimbingSession, Session } from '@/types/climbing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useClimbingSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery<Session[], Error>({
    queryKey: ['climbing_sessions', user?.id],
    queryFn: async (): Promise<Session[]> => {
      if (!user) return [];
      const dbSessions: ClimbingSession[] = await climbingService.fetchSessions(user.id);
      return dbSessions.map(mapDbSessionToLocalSession);
    },
    enabled: !!user,
  });

  const addSessionMutation = useMutation<
    ClimbingSession,
    Error,
    NewSessionData
  >({
    mutationFn: async (sessionData: NewSessionData) => {
      if (!user) throw new Error('User not authenticated');
      return climbingService.addSession(sessionData, user.id);
    },
    onSuccess: (data) => {
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

  const updateSessionMutation = useMutation<
    ClimbingSession,
    Error,
    { sessionId: string; updates: UpdateSessionData }
  >({
    mutationFn: async ({ sessionId, updates }) => {
      console.log("[useClimbingSessions updateSessionMutation] Called with sessionId:", sessionId, "updates:", updates); // DEBUG
      try {
        const result = await climbingService.updateSession(sessionId, updates);
        console.log("[useClimbingSessions updateSessionMutation] climbingService.updateSession successful, result:", result); // DEBUG
        return result;
      } catch (error) {
        console.error("[useClimbingSessions updateSessionMutation] Error from climbingService.updateSession:", error); // DEBUG
        throw error; // Re-throw to be caught by TanStack Query's onError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climbing_sessions', user?.id] });
      toast({
        title: "Session updated!",
        description: "Your climbing session has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSessionMutation = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: async (sessionId: string) => {
      await climbingService.deleteSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climbing_sessions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['climbs', user?.id] });
      toast({
        title: "Session deleted!",
        description: "Your climbing session and all associated climbs have been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting session",
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
    addSessionAsync: addSessionMutation.mutateAsync,
    isAddingSession: addSessionMutation.isPending,
    updateSession: updateSessionMutation.mutate,
    updateSessionAsync: updateSessionMutation.mutateAsync,
    isUpdatingSession: updateSessionMutation.isPending,
    deleteSession: deleteSessionMutation.mutate,
    deleteSessionAsync: deleteSessionMutation.mutateAsync,
    isDeletingSession: deleteSessionMutation.isPending,
  };
};