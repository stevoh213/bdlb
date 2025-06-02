
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as climbingService from '@/services/climbingService';
import type { NewSessionData } from '@/services/climbingService';
import { ClimbingSession, Session } from '@/types/climbing';

export const useClimbingSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery<Session[], Error>({
    queryKey: ['climbing_sessions', user?.id],
    queryFn: async (): Promise<Session[]> => {
      if (!user) return [];
      try {
        const dbSessions: ClimbingSession[] = await climbingService.fetchSessions(user.id);
        return dbSessions.map((cs: ClimbingSession): Session => ({
          id: cs.id,
          location: cs.location,
          climbingType: cs.default_climb_type || 'sport', // Default to 'sport' or handle as error/log if undefined
          gradeSystem: cs.gradeSystem,
          notes: cs.notes,
          startTime: new Date(cs.date),
          endTime: cs.duration ? new Date(new Date(cs.date).getTime() + cs.duration * 60000) : undefined, // Assuming duration is in minutes
          climbs: [], // Initialize with empty climbs
          isActive: false, // Default value
          breaks: 0, // Default value
          totalBreakTime: 0, // Default value
          aiAnalysis: undefined, // Default value
        }));
      } catch (err) {
        throw err;
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

  return {
    sessions,
    isLoading,
    error,
    addSession: addSessionMutation.mutate,
    addSessionAsync: addSessionMutation.mutateAsync,
    isAddingSession: addSessionMutation.isPending,
  };
};