import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useClimbingSessions } from '@/hooks/useClimbingSessions';
import { useClimbs } from '@/hooks/useClimbs';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { supabase } from '@/integrations/supabase/client';
import { mapDbClimbToLocalClimb, mapLocalSessionUpdatesToDbFormat } from '@/lib/utils';
import { Climb, LocalClimb, Session } from '@/types/climbing';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Types for dialog states
type EditingClimbState = LocalClimb | null;
type EditingSessionState = Session | null;
type DeleteConfirmState = { type: 'session' | 'climb'; item: Session | LocalClimb } | null;

export const useSessionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { resumeEndedSession: resumeFromSessionManagement } = useSessionManagement();

  // Data fetching hooks
  const { 
    sessions: rawSessions, 
    isLoading: isLoadingSessions, 
    updateSession,
    deleteSession 
  } = useClimbingSessions();
  const { 
    climbs: allUserClimbs, 
    isLoading: isLoadingClimbs, 
    updateClimb,
    deleteClimb 
  } = useClimbs();

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
    return filteredClimbs.map(mapDbClimbToLocalClimb);
  }, [allUserClimbs, selectedSession, mapDbClimbToLocalClimb]);

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

  const handleSaveSession = useCallback((sessionId: string, localUpdates: Partial<Session>) => {
    const dbFormattedUpdates = mapLocalSessionUpdatesToDbFormat(localUpdates);
    updateSession({ 
      sessionId, 
      updates: dbFormattedUpdates
    });
    toast({ title: "Session Updated", description: "Session details have been saved." });
    handleCloseEditSessionDialog();
  }, [updateSession, handleCloseEditSessionDialog, mapLocalSessionUpdatesToDbFormat, toast]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'session') {
      deleteSession(deleteConfirm.item.id);
      if (selectedSessionId === deleteConfirm.item.id) {
        handleSelectSession(null);
      }
      handleCloseDeleteDialog();
    } else if (deleteConfirm.type === 'climb') {
      deleteClimb(deleteConfirm.item.id);
      handleCloseDeleteDialog();
    }
  }, [deleteConfirm, deleteSession, deleteClimb, selectedSessionId, handleSelectSession, handleCloseDeleteDialog]);

  const handleAnalysisSaved = useCallback((sessionId: string, analysis: Session['aiAnalysis']) => {
    handleSaveSession(sessionId, { aiAnalysis: analysis });
  }, [handleSaveSession]);
  
  const resumeEndedSession = useCallback((sessionId: string) => {
    resumeFromSessionManagement(sessionId);
  }, [resumeFromSessionManagement]);

  // Additional handlers needed by History.tsx
  const handleBackFromDetails = useCallback(() => {
    handleSelectSession(null);
  }, [handleSelectSession]);

  const handleResumeSession = useCallback((sessionId: string) => {
    resumeEndedSession(sessionId);

    // TEMPORARY DEBUGGING:
    setTimeout(() => { // Use setTimeout to allow effect in useSessionManagement to hopefully run
      const storedSession = localStorage.getItem('currentSession');
      console.log("localStorage currentSession after resume, before navigate:", storedSession);
      if (storedSession) {
        try {
          console.log("Parsed localStorage currentSession:", JSON.parse(storedSession));
        } catch (e) {
          console.error("Error parsing stored session for debug:", e);
        }
      }
      navigate('/');
    }, 100); // Small delay
  }, [resumeEndedSession, navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged out successfully" });
      // Navigation will be handled by auth state change
    } catch (error) {
      console.error('Logout error:', error);
      toast({ 
        title: "Logout failed", 
        description: "Please try again", 
        variant: "destructive" 
      });
    }
  }, [toast]);

  return {
    // Rename user to currentUser for History.tsx compatibility
    currentUser: user,
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

    // Handlers with aliases for History.tsx compatibility
    handleSelectSession,
    handleBackFromDetails,
    
    // Edit handlers (both original and alias names)
    handleOpenEditClimbDialog,
    handleEditClimb: handleOpenEditClimbDialog,
    handleCloseEditClimbDialog,
    handleCloseEditClimb: handleCloseEditClimbDialog,
    
    handleOpenEditSessionDialog,
    handleEditSession: handleOpenEditSessionDialog,
    handleCloseEditSessionDialog,
    handleCloseEditSession: handleCloseEditSessionDialog,
    
    // Delete handlers
    handleOpenDeleteDialog,
    handleDeleteSession: (session: Session) => handleOpenDeleteDialog(session, 'session'),
    handleDeleteClimb: (climb: LocalClimb) => handleOpenDeleteDialog(climb, 'climb'),
    handleCloseDeleteDialog,
    
    // Save handlers
    handleSaveClimb,
    handleSaveSession,
    handleConfirmDelete,
    
    // Additional handlers
    handleResumeSession,
    handleLogout,
    
    // AI Analysis Drawer (both original and alias names)
    handleOpenAnalysisDrawer,
    handleShowAnalysisDrawer: handleOpenAnalysisDrawer,
    handleCloseAnalysisDrawer,
    handleAnalysisSaved,
  };
};

