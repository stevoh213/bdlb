

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Download, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// Components used by History.tsx directly
import EditClimbDialog from "@/components/EditClimbDialog";
import EditSessionDialog from "@/components/EditSessionDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SessionAnalysis from "@/components/SessionAnalysis";

// Custom hook and new sub-components
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import SessionList from "@/components/SessionList";
import SessionDetails from "@/components/SessionDetails";

// Types
import { Session, LocalClimb } from "@/types/climbing";

// Utilities
import { exportToCSV } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const History = () => {
  const navigate = useNavigate();
  const {
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

  const handleExportData = () => {
    if (sessions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "You don't have any sessions to export yet.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert sessions to format expected by exportToCSV
    const exportData = sessions.map(s => ({
      id: s.id,
      location: s.location,
      climbingType: s.climbingType,
      startTime: s.startTime.toISOString(), 
      endTime: s.endTime ? s.endTime.toISOString() : '',
      climbs: s.climbs?.map(c => ({
        ...c, 
        timestamp: c.timestamp.toISOString()
      })) || [],
      isActive: s.isActive,
      breaks: s.breaks,
      totalBreakTime: s.totalBreakTime,
      notes: s.notes,
      gradeSystem: s.gradeSystem,
      aiAnalysis: s.aiAnalysis ? {
        ...s.aiAnalysis,
        generatedAt: s.aiAnalysis.generatedAt ? s.aiAnalysis.generatedAt.toISOString() : '',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
        <SessionDetails
          session={selectedSession}
          climbs={climbsForSelectedSession}
          onClose={() => handleSelectSession(null)}
          onEditSession={handleOpenEditSessionDialog}
          onDeleteSession={(session) => handleOpenDeleteDialog(session, 'session')}
          onResumeSession={handleResumeSession}
          onShowAnalysisDrawer={handleOpenAnalysisDrawer}
          onEditClimb={handleOpenEditClimbDialog}
          onDeleteClimb={(climb) => handleOpenDeleteDialog(climb, 'climb')}
          currentUser={user}
          onLogout={performLogout}
        />
        
        {/* Dialogs */}
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
            <Link to="/import">
              <Button variant="outline" size="sm" className="text-stone-600 border-stone-300">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Link>
            {sessions.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportData} className="text-stone-600 border-stone-300">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {isLoadingSessions ? (
          <p>Loading sessions...</p>
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
          />
        )}
        
        {deleteConfirm && !selectedSession && (
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

