
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SessionAnalysis from "@/components/SessionAnalysis";
import HistorySessionListView from "@/components/HistorySessionListView";
import HistorySessionDetailsView from "@/components/HistorySessionDetailsView";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { exportToCSV } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const History = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    sessions,
    selectedSession,
    climbsForSelectedSession,
    isLoadingSessions,
    editingClimb,
    editingSession,
    deleteConfirm,
    showAnalysisDrawer,

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
    
    handleOpenAnalysisDrawer,
    handleCloseAnalysisDrawer,
    handleAnalysisSaved,
  } = useSessionHistory();

  const { resumeEndedSession } = useSessionManagement();
  const { toast } = useToast();
  const { signOut } = useAuth();

  // Handle auto-opening session from navigation state
  useEffect(() => {
    const state = location.state as { selectedSessionId?: string; autoOpen?: boolean } | undefined;
    if (state?.selectedSessionId && state?.autoOpen) {
      handleSelectSession(state.selectedSessionId);
      // Clear the navigation state to prevent re-opening on page refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, handleSelectSession, navigate, location.pathname]);

  const handleExportData = () => {
    if (sessions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "You don't have any sessions to export yet.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert sessions to format expected by exportToCSV - fix the type issues
    const exportData = sessions.map(s => ({
      id: s.id,
      location: s.location,
      climbingType: s.climbingType,
      startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime, 
      endTime: s.endTime ? (s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime) : '',
      climbs: s.climbs?.map(c => ({
        ...c, 
        timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString() : c.timestamp
      })) || [],
      isActive: s.isActive,
      breaks: s.breaks,
      totalBreakTime: s.totalBreakTime,
      notes: s.notes,
      gradeSystem: s.gradeSystem,
      aiAnalysis: s.aiAnalysis ? {
        ...s.aiAnalysis,
        generatedAt: s.aiAnalysis.generatedAt instanceof Date ? s.aiAnalysis.generatedAt.toISOString() : (s.aiAnalysis.generatedAt || ''),
      } : undefined,
    }));
    
    exportToCSV(exportData);
    toast({
      title: "Export Complete",
      description: `Exported ${sessions.length} sessions to CSV`
    });
  };

  const performLogout = () => {
    signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  const handleResumeSession = (sessionId: string) => {
    resumeEndedSession(sessionId);
    navigate('/'); // Navigate back to the main page where the session can be managed
  };

  // Show session analysis in full screen if showAnalysisDrawer is true and we have a selected session
  if (selectedSession && showAnalysisDrawer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
        <SessionAnalysis
          session={selectedSession}
          onClose={handleCloseAnalysisDrawer}
          onAnalysisSaved={handleAnalysisSaved}
          autoStart={false}
        />
      </div>
    );
  }

  if (selectedSession && !showAnalysisDrawer) {
    return (
      <HistorySessionDetailsView
        session={selectedSession}
        climbs={climbsForSelectedSession}
        currentUser={user}
        editingClimb={editingClimb}
        editingSession={editingSession}
        deleteConfirm={deleteConfirm}
        onClose={() => handleSelectSession(null)}
        onEditSession={handleOpenEditSessionDialog}
        onDeleteSession={(session) => handleOpenDeleteDialog(session, 'session')}
        onResumeSession={handleResumeSession}
        onShowAnalysisDrawer={handleOpenAnalysisDrawer}
        onEditClimb={handleOpenEditClimbDialog}
        onDeleteClimb={(climb) => handleOpenDeleteDialog(climb, 'climb')}
        onLogout={performLogout}
        onCloseEditClimb={handleCloseEditClimbDialog}
        onCloseEditSession={handleCloseEditSessionDialog}
        onCloseDeleteDialog={handleCloseDeleteDialog}
        onSaveClimb={handleSaveClimb}
        onSaveSession={handleSaveSession}
        onConfirmDelete={handleConfirmDelete}
        onOpenDeleteDialog={handleOpenDeleteDialog}
      />
    );
  }

  // Default view: List of sessions
  return (
    <HistorySessionListView
      sessions={sessions}
      isLoadingSessions={isLoadingSessions}
      editingClimb={editingClimb}
      editingSession={editingSession}
      deleteConfirm={deleteConfirm}
      onSelectSession={handleSelectSession}
      onExportData={handleExportData}
      onCloseEditClimb={handleCloseEditClimbDialog}
      onCloseEditSession={handleCloseEditSessionDialog}
      onCloseDeleteDialog={handleCloseDeleteDialog}
      onSaveClimb={handleSaveClimb}
      onSaveSession={handleSaveSession}
      onConfirmDelete={handleConfirmDelete}
      onOpenDeleteDialog={handleOpenDeleteDialog}
    />
  );
};

export default History;
