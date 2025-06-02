import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useClimbingSessions } from '@/hooks/useClimbingSessions'; // ClimbingSession is no longer exported from here
import { useClimbs } from '@/hooks/useClimbs'; // This fetches all user climbs
import { Climb, LocalClimb, Session } from '@/types/climbing'; // Using Session and LocalClimb from global types
// import { parseSessionDates } from '@/lib/utils'; // May not be needed if data from hooks is already parsed

// Types for dialog states
type EditingClimbState = LocalClimb | null;
type EditingSessionState = Session | null; // Using global Session type
type DeleteConfirmState = { type: 'session' | 'climb'; item: Session | LocalClimb } | null;

export const useSessionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Data fetching hooks
  const { sessions: rawSessions, isLoading: isLoadingSessions, addSession, /* updateSessionMutation, deleteSessionMutation */ } = useClimbingSessions();
  // TODO: Need updateSession and deleteSession from useClimbingSessions
  // For now, I'll mock them or assume they will be added to useClimbingSessions hook.
  // These would call the respective service functions.
  const { mutate: mockUpdateSession } = { mutate: (vars: { sessionId: string, updates: Partial<Session>}, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => { console.log('mockUpdateSession', vars); if(options && options.onSuccess) options.onSuccess(); } };
  const { mutate: mockDeleteSession } = { mutate: (sessionId: string, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => { console.log('mockDeleteSession', sessionId); if(options && options.onSuccess) options.onSuccess(); } };


  const { climbs: allUserClimbs, isLoading: isLoadingClimbs, addClimb, updateClimb, /* deleteClimbMutation */ } = useClimbs();
  // TODO: Need deleteClimb from useClimbs hook.
  const { mutate: mockDeleteClimb } = { mutate: (climbId: string, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => { console.log('mockDeleteClimb', climbId); if(options && options.onSuccess) options.onSuccess(); } };


  // UI State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [editingClimb, setEditingClimb] = useState<EditingClimbState>(null);
  const [editingSession, setEditingSession] = useState<EditingSessionState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [showAnalysisDrawer, setShowAnalysisDrawer] = useState(false); // For AIAnalysisDrawer trigger

  // Auto-select session from navigation state (if any)
  // This needs to be handled carefully with React Query's async data loading.
  // Perhaps better to do this in a useEffect within History.tsx once sessions are loaded.
  useState(() => {
    const { selectedSessionId: navSelectedSessionId } = location.state || {};
    if (navSelectedSessionId) {
      setSelectedSessionId(navSelectedSessionId);
    }
  });
  
  // Memoize processed sessions to prevent re-computation on every render
  // Assuming rawSessions from useClimbingSessions are already correctly typed (e.g. dates are Date objects)
  const sessions = useMemo(() => rawSessions /*.map(parseSessionDates) if dates were strings */, [rawSessions]);

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  const climbsForSelectedSession = useMemo((): LocalClimb[] => {
    if (!selectedSession) return [];
    const filteredClimbs: Climb[] = allUserClimbs.filter(climb => climb.session_id === selectedSession.id);
    return filteredClimbs.map((climb: Climb): LocalClimb => ({
      id: climb.id,
      name: climb.name,
      grade: climb.grade,
      tickType: climb.send_type === 'project' ? 'attempt' : climb.send_type,
      attempts: climb.attempts,
      timestamp: new Date(climb.date),
      sessionId: climb.session_id,
      notes: climb.notes,
      // Fields not in Climb will be undefined: height, timeOnWall, effort, physicalSkills, technicalSkills
      height: undefined, 
      timeOnWall: undefined,
      effort: undefined,
      physicalSkills: undefined,
      technicalSkills: undefined,
    }));
  }, [allUserClimbs, selectedSession]);


  // Handlers
  const handleSelectSession = useCallback((sessionId: string | null) => {
    setSelectedSessionId(sessionId);
    setShowAnalysisDrawer(false); // Reset drawer when session changes
  }, []);

  const handleOpenEditClimbDialog = useCallback((climb: LocalClimb) => setEditingClimb(climb), []);
  const handleCloseEditClimbDialog = useCallback(() => setEditingClimb(null), []);

  const handleOpenEditSessionDialog = useCallback((session: Session) => setEditingSession(session), []);
  const handleCloseEditSessionDialog = useCallback(() => setEditingSession(null), []);

  const handleOpenDeleteDialog = useCallback((item: Session | LocalClimb, type: 'session' | 'climb') => {
    setDeleteConfirm({ item, type });
  }, []);
  const handleCloseDeleteDialog = useCallback(() => setDeleteConfirm(null), []);
  
  const handleOpenAnalysisDrawer = useCallback(() => setShowAnalysisDrawer(true), []);
  const handleCloseAnalysisDrawer = useCallback(() => setShowAnalysisDrawer(false), []);


  const handleSaveClimb = useCallback((climbId: string, updates: Partial<LocalClimb>) => {
    // Assuming LocalClimb is compatible with updates for Climb
    updateClimb({ id: climbId, updates: updates as Partial<Climb> }, {
      onSuccess: () => {
        toast({ title: "Climb Updated", description: "Your climb has been successfully updated." });
        handleCloseEditClimbDialog();
      },
      onError: (error) => {
         toast({ title: "Error updating climb", description: error.message, variant: "destructive" });
      }
    });
  }, [updateClimb, toast]);

  const handleSaveSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    // Replace with actual updateSessionMutation when available in useClimbingSessions
    mockUpdateSession({ sessionId, updates }, {
      onSuccess: () => {
        toast({ title: "Session Updated", description: "Your session has been successfully updated." });
        handleCloseEditSessionDialog();
      },
      onError: (error: Error) => {
         toast({ title: "Error updating session", description: error.message, variant: "destructive" });
      }
    });
  }, [toast, mockUpdateSession]); // Add real updateSessionMutation dependency

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'session') {
      // Replace with actual deleteSessionMutation when available
      mockDeleteSession(deleteConfirm.item.id, {
        onSuccess: () => {
          toast({ title: "Session Deleted", description: "The session has been permanently deleted." });
          if (selectedSessionId === deleteConfirm.item.id) {
            handleSelectSession(null); // Deselect if the current session is deleted
          }
          handleCloseDeleteDialog();
        },
        onError: (error: Error) => {
          toast({ title: "Error deleting session", description: error.message, variant: "destructive" });
        }
      });
    } else if (deleteConfirm.type === 'climb') {
      // Replace with actual deleteClimbMutation when available
      mockDeleteClimb(deleteConfirm.item.id, {
         onSuccess: () => {
          toast({ title: "Climb Deleted", description: "The climb has been permanently deleted." });
          handleCloseDeleteDialog();
        },
        onError: (error: Error) => {
          toast({ title: "Error deleting climb", description: error.message, variant: "destructive" });
        }
      });
    }
  }, [deleteConfirm, toast, selectedSessionId, mockDeleteSession, mockDeleteClimb]); // Add real delete mutations

  const handleAnalysisSaved = useCallback((sessionId: string, analysis: Session['aiAnalysis']) => {
    // This implies that AI analysis is saved as part of the session update
    // This might need a specific service/mutation if it's a complex operation
    // For now, assume it's part of the general session update
    handleSaveSession(sessionId, { aiAnalysis: analysis });
    // Potentially close drawer or give other feedback
  }, [handleSaveSession]);
  
  // Resume session logic needs to be re-evaluated with React Query.
  // It involves deleting an ended session and creating a new "current" one,
  // which might be complex with RQ's caching and backend state.
  // This is probably out of scope for just refactoring History.tsx structure for now.
  const resumeEndedSession = (sessionId: string) => {
    const sessionToResume = sessions.find(session => session.id === sessionId);
    if (!sessionToResume) return;
    // This logic would ideally:
    // 1. Call a service function `resumeSession(sessionId)`
    // 2. Service function marks old session as non-resumable (or deletes), creates a new active session based on old one.
    // 3. RQ invalidates queries, navigates.
    console.warn("resumeEndedSession needs to be re-implemented with backend logic and React Query");
    toast({ title: "Resume Session", description: "This feature needs an update for the new data layer." });
    // navigate('/'); 
  };


  return {
    user, // For logout or user-specific UI elements
    sessions, // All sessions for the list
    selectedSession, // The currently selected session object
    climbsForSelectedSession, // Climbs filtered for the selected session
    isLoadingSessions,
    isLoadingClimbs,
    editingClimb,
    editingSession,
    deleteConfirm,
    showAnalysisDrawer,

    // Handlers
    handleSelectSession,
    handleOpenEditClimbDialog,
    handleCloseEditClimbDialog,
    handleOpenEditSessionDialog,
    handleCloseEditSessionDialog,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleSaveClimb,
    handleSaveSession,
    handleConfirmDelete,
    
    // AI Analysis Drawer
    handleOpenAnalysisDrawer,
    handleCloseAnalysisDrawer,
    handleAnalysisSaved, // For when analysis is generated/saved within the drawer/modal

    // Potentially other handlers like logout, exportCSV if they remain page-level concerns
    // resumeEndedSession, // Expose if needed, but with caution
  };
};
