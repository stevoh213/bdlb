import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { Session, LocalClimb } from "@/types/climbing";
import ClimbLogForm from "./ClimbLogForm";
import ClimbList from "./ClimbList";

interface ClimbLogSectionProps {
  currentSession: Session | null;
  onAddClimb: (
    climb: Omit<LocalClimb, "id" | "timestamp" | "sessionId">,
  ) => void;
  onEditClimb: (climb: LocalClimb) => void;
}

const ClimbLogSection = ({
  currentSession,
  onAddClimb,
  onEditClimb,
}: ClimbLogSectionProps) => {
  const [showClimbForm, setShowClimbForm] = useState(false);

  const handleAddClimb = (
    climb: Omit<LocalClimb, "id" | "timestamp" | "sessionId">,
  ) => {
    onAddClimb(climb);
    setShowClimbForm(false);
  };

  if (!currentSession) return null;

  return (
    <>
      {/* Quick Add Climb */}
      <Card className="border-stone-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Log Climb
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showClimbForm ? (
            <ClimbLogForm
              onSubmit={handleAddClimb}
              onCancel={() => setShowClimbForm(false)}
              gradeSystem={currentSession.gradeSystem}
              sessionLocation={currentSession.location}
            />
          ) : (
            <Button
              onClick={() => setShowClimbForm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Climb
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Climbs in Current Session */}
      {currentSession.climbs.length > 0 && (
        <Card className="border-stone-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle>Session Climbs</CardTitle>
          </CardHeader>
          <CardContent>
            <ClimbList
              climbs={currentSession.climbs.slice(0, 5)}
              onEdit={onEditClimb}
              showEditButton={true}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ClimbLogSection;
