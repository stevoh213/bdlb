// import { useState, useEffect } from "react"; // Replaced by useSessionHistory
import { Card, CardContent } from "@/components/ui/card"; // Keep Card for "No Sessions"
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Download } from "lucide-react"; // Keep some icons for page-level controls
import { Link } from "react-router-dom"; // useNavigate is now in the hook

// Components used by History.tsx directly
import EditClimbDialog from "@/components/EditClimbDialog";
import EditSessionDialog from "@/components/EditSessionDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SessionAnalysis from "@/components/SessionAnalysis"; // This is a full-page component, not a dialog here.
import AIAnalysisDrawer from "@/components/AIAnalysisDrawer"; // The actual Drawer component

// Custom hook and new sub-components
import { useSessionHistory } from "@/hooks/useSessionHistory";
import SessionList from "@/components/SessionList";
import SessionDetails from "@/components/SessionDetails";

// Types (Session and LocalClimb might come from useSessionHistory or be imported if needed for props)
import { Session, LocalClimb } from "@/types/climbing"; // Global types

// Utilities
import { exportToCSV } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // For signOut and user on page level

const History = () => {
  const {
    user, // From useSessionHistory, originally from useAuth
    sessions,
    selectedSession,
    climbsForSelectedSession,
    isLoadingSessions, // TODO: Add loading indicators in JSX
    isLoadingClimbs,   // TODO: Add loading indicators in JSX
    editingClimb,
    editingSession,
    deleteConfirm,
    showAnalysisDrawer, // This controls the AIAnalysisDrawer visibility

    handleSelectSession,
    handleOpenEditClimbDialog, // Renamed from handleEditClimb for clarity
    handleCloseEditClimbDialog,
    handleOpenEditSessionDialog, // Renamed from handleEditSession
    handleCloseEditSessionDialog,
    handleOpenDeleteDialog, // Replaces direct setDeleteConfirm
    handleCloseDeleteDialog,
    handleSaveClimb,
    handleSaveSession,
    handleConfirmDelete,
    
    handleOpenAnalysisDrawer, // To open the AIAnalysisDrawer
    handleCloseAnalysisDrawer,
    handleAnalysisSaved, // To save analysis from drawer/modal
    // resumeEndedSession, // Available if needed, but with caveats
  } = useSessionHistory();

  const { toast } = useToast();
  const { signOut } = useAuth(); // Direct useAuth for signOut as it's a page-level action

  const handleExportData = () => {
    if (sessions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "You don't have any sessions to export yet.",
        variant: "destructive"
      });
      return;
    }
    exportToCSV(sessions.map(s => ({ // Ensure exportToCSV can handle the Session type from useClimbingSessions
        ...s,
        // Convert Date objects to string if exportToCSV expects strings
        startTime: s.startTime.toISOString(), 
        endTime: s.endTime ? s.endTime.toISOString() : '',
        climbs: s.climbs?.map(c => ({...c, timestamp: c.timestamp.toISOString() })) || [],
        aiAnalysis: s.aiAnalysis ? {
            ...s.aiAnalysis,
            generatedAt: s.aiAnalysis.generatedAt ? s.aiAnalysis.generatedAt.toISOString() : '',
        } : undefined,
    })));
    toast({
      title: "Export Complete",
      description: `Exported ${sessions.length} sessions to CSV`
    });
  };

  const performLogout = () => {
    signOut(); // From useAuth directly
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
    // Navigation to login page usually handled by AuthProvider/router
  };


  // Main conditional rendering logic
  // If a full-page analysis view is triggered (original logic for showAnalysis)
  // This needs to be reconciled with showAnalysisDrawer.
  // For now, assuming SessionAnalysis is a modal/view triggered by a different mechanism if needed,
  // or AIAnalysisDrawer is the primary way to show AI analysis.
  // Let's assume original 'showAnalysis' state is now covered by 'selectedSession.aiAnalysis' and drawer.

  if (selectedSession && !showAnalysisDrawer) { // If a session is selected, show its details
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
        <SessionDetails
          session={selectedSession}
          climbs={climbsForSelectedSession}
          onClose={() => handleSelectSession(null)}
          onEditSession={handleOpenEditSessionDialog}
          onDeleteSession={(session) => handleOpenDeleteDialog(session, 'session')}
          // onResumeSession={resumeEndedSession} // Expose if fully implemented in hook
          onResumeSession={() => toast({ title: "Resume Session", description: "This feature is under review."})}
          onShowAnalysisDrawer={handleOpenAnalysisDrawer}
          onEditClimb={handleOpenEditClimbDialog}
          onDeleteClimb={(climb) => handleOpenDeleteDialog(climb, 'climb')}
          currentUser={user}
          onLogout={performLogout}
        />
        {/* Dialogs rendered here, controlled by state from useSessionHistory */}
        {editingClimb && (
          <EditClimbDialog 
            climb={editingClimb} 
            open={true} 
            onOpenChange={(open) => !open && handleCloseEditClimbDialog()} 
            onSave={handleSaveClimb} 
          />
        )}
        {editingSession && (
          <EditSessionDialog 
            session={editingSession} 
            open={true} 
            onOpenChange={(open) => !open && handleCloseEditSessionDialog()} 
            onSave={handleSaveSession} 
          />
        )}
        {deleteConfirm && (
          <DeleteConfirmDialog 
            open={true} 
            onOpenChange={(open) => !open && handleCloseDeleteDialog()} 
            onConfirm={handleConfirmDelete} 
            title={deleteConfirm.type === 'session' ? 'Delete Session' : 'Delete Climb'} 
            description={deleteConfirm.type === 'session' ? 'Are you sure you want to delete this entire climbing session? This will also delete all climbs in this session.' : 'Are you sure you want to delete this climb?'} 
            itemName={deleteConfirm.type === 'session' ? (deleteConfirm.item as Session).location : (deleteConfirm.item as LocalClimb).name} 
          />
        )}
        {/* AIAnalysisDrawer is controlled by showAnalysisDrawer state from the hook */}
        {selectedSession.aiAnalysis && ( // Only render drawer if analysis exists
            <AIAnalysisDrawer
                session={selectedSession}
                open={showAnalysisDrawer}
                onOpenChange={(open) => !open && handleCloseAnalysisDrawer()}
                onAnalysisSaved={(analysis) => handleAnalysisSaved(selectedSession.id, analysis)}
            />
        )}
      </div>
    );
  }

  // Default view: List of sessions
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-stone-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 flex-1">Session History</h1>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportData} className="text-stone-600 border-stone-300">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
             {/* Logout button can also be here if not in SessionDetails header */}
          </div>
        </div>

        {isLoadingSessions ? (
          <p>Loading sessions...</p> // Basic loading state
        ) : sessions.length === 0 ? (
          <Card className="border-stone-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-stone-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-stone-700 mb-2">No Sessions Yet</h3>
              <p className="text-stone-600 mb-4">Start your first climbing session to see it here!</p>
              <Link to="/">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Start Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <SessionList 
            sessions={sessions} 
            onSelectSession={handleSelectSession}
            // selectedSessionId={selectedSession?.id} // Pass if needed for highlighting in SessionList
          />
        )}
        
        {/* DeleteConfirmDialog might also be needed in list view if sessions can be deleted from there directly */}
        {/* For now, assuming delete is only from SessionDetails view */}
         {deleteConfirm && !selectedSession && ( // Only show if no session is selected (i.e. delete was from list view if that was possible)
          <DeleteConfirmDialog 
            open={true} 
            onOpenChange={(open) => !open && handleCloseDeleteDialog()} 
            onConfirm={handleConfirmDelete} 
            title={deleteConfirm.type === 'session' ? 'Delete Session' : 'Delete Climb'} 
            description={deleteConfirm.type === 'session' ? 'Are you sure you want to delete this entire climbing session? This will also delete all climbs in this session.' : 'Are you sure you want to delete this climb?'} 
            itemName={deleteConfirm.type === 'session' ? (deleteConfirm.item as Session).location : (deleteConfirm.item as LocalClimb).name} 
          />
        )}
      </div>
    </div>
  );
};

export default History;
