import ClimbLogSection from "@/components/ClimbLogSection";
import EditClimbDialog from "@/components/EditClimbDialog";
import RecentSessions from "@/components/RecentSessions";
import SessionControl from "@/components/SessionControl";
import { useAuth } from "@/contexts/AuthContext";
import { useClimbs } from "@/hooks/useClimbs";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { LocalClimb } from "@/types/climbing";
import { useState } from "react";

const Index = () => {
  const [editingClimb, setEditingClimb] = useState<LocalClimb | null>(null);
  const { user } = useAuth();
  const { climbs: allUserClimbs } = useClimbs();
  
  const {
    currentSession,
    sessions,
    sessionTime,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    addClimb,
    updateClimb,
    deleteClimb,
  } = useSessionManagement();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Session Control */}
        <SessionControl
          currentSession={currentSession}
          sessionTime={sessionTime}
          onStartSession={startSession}
          onPauseSession={pauseSession}
          onResumeSession={resumeSession}
          onEndSession={endSession}
        />

        {/* Climb Logging Section */}
        <ClimbLogSection
          currentSession={currentSession}
          onAddClimb={addClimb}
          onEditClimb={setEditingClimb}
        />

        {/* Recent Sessions History - Only show when no active session */}
        {!currentSession && <RecentSessions sessions={sessions} allUserClimbs={allUserClimbs} />}

        {/* Edit Climb Dialog */}
        {editingClimb && (
          <EditClimbDialog 
            climb={editingClimb} 
            open={!!editingClimb} 
            onOpenChange={open => !open && setEditingClimb(null)} 
            onSave={updateClimb} 
            onDelete={deleteClimb}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
