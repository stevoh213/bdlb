import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { formatDate, getSessionDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import styles from "./SessionList.module.css"; // Import the CSS module
import { Session } from "@/types/climbing"; // Assuming global Session type

// Define ClimbingType more strictly if possible, or use string.
// This should align with the values used as keys in SessionList.module.css
type ClimbingTypeStyleKey = 'sport' | 'trad' | 'boulder' | 'top_rope' | 'toprope' | 'alpine' | 'multipitch' | string;


interface SessionListProps {
  sessions: Session[]; // Using global Session type
  selectedSessionId?: string | null; // To highlight the selected session
  onSelectSession: (sessionId: string) => void;
}

const SessionList = ({ sessions, selectedSessionId, onSelectSession }: SessionListProps) => {
  if (sessions.length === 0) {
    return null; // Or a "No sessions" message, though History.tsx handles this globally
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        // Ensure session.startTime is a Date object, or handle string conversion
        const sessionStartTime = typeof session.startTime === 'string' ? new Date(session.startTime) : session.startTime;
        
        // Determine the style key for climbing type, handling potential variations
        const climbingTypeStyleKey = session.climbingType.replace(/\s+/g, '_').toLowerCase() as ClimbingTypeStyleKey;

        return (
          <Card 
            key={session.id} 
            className={cn(
              "border-stone-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow",
              selectedSessionId === session.id && "ring-2 ring-amber-500 border-amber-500" // Highlight if selected
            )}
            onClick={() => onSelectSession(session.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-stone-600" />
                    <span className="font-semibold text-stone-800">{session.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        styles.badgeBase, // Base styles if defined
                        styles[climbingTypeStyleKey] || styles.boulder // Fallback to a default style
                      )}
                    >
                      {session.climbingType}
                    </Badge>
                    {session.aiAnalysis && (
                      <Badge variant="outline" className={styles.aiAnalyzed}>
                        AI Analyzed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-stone-600">
                  <div>{formatDate(sessionStartTime)}</div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {getSessionDuration(session)}m
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Climbs logged</span>
                <span className="font-semibold text-emerald-600">{session.climbs?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SessionList;
