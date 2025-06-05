import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate, getSessionDuration } from "@/lib/utils";
import { Climb, Session } from "@/types/climbing"; // Added Climb type
import { ChevronDown, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import styles from "./SessionList.module.css"; // Import the CSS module

// Define ClimbingType more strictly if possible, or use string.
// This should align with the values used as keys in SessionList.module.css
type ClimbingTypeStyleKey = 'sport' | 'trad' | 'boulder' | 'top_rope' | 'toprope' | 'alpine' | 'multipitch' | string;


interface SessionListProps {
  sessions: Session[]; // Using global Session type
  allUserClimbs: Climb[]; // Added prop
  selectedSessionId?: string | null; // To highlight the selected session
  onSelectSession: (sessionId: string) => void;
  showLoadMore?: boolean; // Control whether to show load more button
}

const SessionList = ({ sessions, allUserClimbs, selectedSessionId, onSelectSession, showLoadMore = true }: SessionListProps) => {
  const [displayCount, setDisplayCount] = useState(5);
  
  if (sessions.length === 0) {
    return null; // Or a "No sessions" message, though History.tsx handles this globally
  }

  // If showLoadMore is false, show all sessions passed in (for RecentSessions component)
  const visibleSessions = showLoadMore ? sessions.slice(0, displayCount) : sessions;
  const hasMoreSessions = showLoadMore && sessions.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  return (
    <div className="space-y-3">
      {visibleSessions.map((session) => {
        // Ensure session.startTime is a Date object, or handle string conversion
        const sessionStartTime = typeof session.startTime === 'string' ? new Date(session.startTime) : session.startTime;
        
        // Calculate climb count for the current session
        const climbCount = allUserClimbs.filter(climb => climb.session_id === session.id).length;

        // Determine the style key for climbing type, handling potential variations and undefined values
        const climbingTypeStyleKey = session.climbingType 
          ? session.climbingType.replace(/\s+/g, '_').toLowerCase() as ClimbingTypeStyleKey
          : 'boulder'; // Default fallback if climbingType is undefined

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
                      {session.climbingType || 'Unknown'}
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
                    {getSessionDuration(session.startTime, session.endTime)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Climbs logged</span>
                <span className="font-semibold text-emerald-600">{climbCount}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {hasMoreSessions && showLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            onClick={handleLoadMore}
            className="text-stone-600 hover:text-stone-800 hover:bg-stone-100"
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Load older sessions
          </Button>
        </div>
      )}
    </div>
  );
};

export default SessionList;
