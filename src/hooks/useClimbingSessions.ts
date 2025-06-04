import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as climbingService from '@/services/climbingService';
import type { NewSessionData, UpdateSessionData } from '@/services/climbingService';
import { ClimbingSession, Session } from '@/types/climbing';

export const useClimbingSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery<Session[], Error>({
    queryKey: ['climbing_sessions', user?.id],
    queryFn: async (): Promise<Session[]> => {
      if (!user) {
        console.log('No user found, returning empty sessions array');
        return [];
      }
      
      console.log('Fetching sessions for user:', user.id);
      
      try {
        const dbSessions: ClimbingSession[] = await climbingService.fetchSessions(user.id);
        console.log('Fetched sessions from DB:', dbSessions);
        
        return dbSessions.map((cs: ClimbingSession): Session => ({
          id: cs.id,
          location: cs.location,
          climbingType: cs.default_climb_type || 'sport',
          gradeSystem: cs.gradeSystem,
          notes: cs.notes,
          startTime: new Date(cs.date),
          endTime: cs.duration ? new Date(new Date(cs.date).getTime() + cs.duration * 60000) : undefined,
          climbs: [],
          isActive: false,
          breaks: 0,
          totalBreakTime: 0,
          aiAnalysis: undefined,
        }));
      } catch (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }
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
      return climbingService.updateSession(sessionId, updates);
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
