

import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useClimbingSessions } from '@/hooks/useClimbingSessions';
import { useClimbs } from '@/hooks/useClimbs';
import { Climb, LocalClimb, Session } from '@/types/climbing';

// Types for dialog states
type EditingClimbState = LocalClimb | null;
type EditingSessionState = Session | null;
type DeleteConfirmState = { type: 'session' | 'climb'; item: Session | LocalClimb } | null;

export const useSessionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Data fetching hooks
  const { sessions: rawSessions, isLoading: isLoadingSessions, addSession } = useClimbingSessions();
  const { climbs: allUserClimbs, isLoading: isLoadingClimbs, addClimb, updateClimb } = useClimbs();

  // Mock mutations for now - these should be replaced with real implementations
  const mockUpdateSession = (vars: { sessionId: string, updates: Partial<Session>}, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
    console.log('mockUpdateSession', vars);
    if(options && options.onSuccess) options.onSuccess();
  };
  
  const mockDeleteSession = (sessionId: string, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
    console.log('mockDeleteSession', sessionId);
    if(options && options.onSuccess) options.onSuccess();
  };

  const mockDeleteClimb = (climbId: string, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
    console.log('mockDeleteClimb', climbId);
    if(options && options.onSuccess) options.onSuccess();
  };

  // UI State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [editingClimb, setEditingClimb] = useState<EditingClimbState>(null);
  const [editingSession, setEditingSession] = useState<EditingSessionState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [showAnalysisDrawer, setShowAnalysisDrawer] = useState(false);

  // Memoize processed sessions to prevent re-computation on every render
  const sessions = useMemo(() => rawSessions, [rawSessions]);

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
    setShowAnalysisDrawer(false);
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
    updateClimb({ id: climbId, updates: updates as Partial<Climb> });
    toast({ title: "Climb Updated", description: "Your climb has been successfully updated." });
    handleCloseEditClimbDialog();
  }, [updateClimb, toast, handleCloseEditClimbDialog]);

  const handleSaveSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    mockUpdateSession({ sessionId, updates }, {
      onSuccess: () => {
        toast({ title: "Session Updated", description: "Your session has been successfully updated." });
        handleCloseEditSessionDialog();
      },
      onError: (error: Error) => {
         toast({ title: "Error updating session", description: error.message, variant: "destructive" });
      }
    });
  }, [toast, handleCloseEditSessionDialog]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'session') {
      mockDeleteSession(deleteConfirm.item.id, {
        onSuccess: () => {
          toast({ title: "Session Deleted", description: "The session has been permanently deleted." });
          if (selectedSessionId === deleteConfirm.item.id) {
            handleSelectSession(null);
          }
          handleCloseDeleteDialog();
        },
        onError: (error: Error) => {
          toast({ title: "Error deleting session", description: error.message, variant: "destructive" });
        }
      });
    } else if (deleteConfirm.type === 'climb') {
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
  }, [deleteConfirm, toast, selectedSessionId, handleSelectSession, handleCloseDeleteDialog]);

  const handleAnalysisSaved = useCallback((sessionId: string, analysis: Session['aiAnalysis']) => {
    handleSaveSession(sessionId, { aiAnalysis: analysis });
  }, [handleSaveSession]);
  
  const resumeEndedSession = (sessionId: string) => {
    const sessionToResume = sessions.find(session => session.id === sessionId);
    if (!sessionToResume) return;
    console.warn("resumeEndedSession needs to be re-implemented with backend logic and React Query");
    toast({ title: "Resume Session", description: "This feature needs an update for the new data layer." });
  };

  return {
    user,
    sessions,
    selectedSession,
    climbsForSelectedSession,
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
    handleAnalysisSaved,
  };
};

