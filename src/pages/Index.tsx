import { useState } from "react";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { useAuth } from "@/contexts/AuthContext";
import { LocalClimb } from "@/types/climbing";
import SessionControl from "@/components/SessionControl";
import ClimbLogSection from "@/components/ClimbLogSection";
import RecentSessions from "@/components/RecentSessions";
import EditClimbDialog from "@/components/EditClimbDialog";

const Index = () => {
  const [editingClimb, setEditingClimb] = useState<LocalClimb | null>(null);
  const { user } = useAuth();

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

        {/* Recent Sessions History */}
        <RecentSessions sessions={sessions} />

        {/* Edit Climb Dialog */}
        {editingClimb && (
          <EditClimbDialog
            climb={editingClimb}
            open={!!editingClimb}
            onOpenChange={(open) => !open && setEditingClimb(null)}
            onSave={updateClimb}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
