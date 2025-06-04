import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Edit, Trash2, Play, Brain, ChevronRight, TrendingUp, LogOut } from "lucide-react";
import SessionStats from "@/components/SessionStats";
import ClimbList from "@/components/ClimbList";
import AIAnalysisDrawer from "@/components/AIAnalysisDrawer"; // This might be a simple trigger if drawer is global
import { Session, LocalClimb } from "@/types/climbing";
import { formatDate, formatTime, getSessionDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import styles from "./SessionList.module.css"; // Re-use for climbing type badge colors
import { User } from '@supabase/supabase-js'; // For user prop type

// Define ClimbingTypeStyleKey as in SessionList
type ClimbingTypeStyleKey = 'sport' | 'trad' | 'boulder' | 'top_rope' | 'toprope' | 'alpine' | 'multipitch' | string;

interface SessionDetailsProps {
  session: Session;
  climbs: LocalClimb[]; // Climbs filtered for this session
  onClose: () => void; // To go back to the session list
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
  onResumeSession: (sessionId: string) => void;
  onShowAnalysisDrawer: () => void; // To trigger the AI Analysis Drawer
  onEditClimb: (climb: LocalClimb) => void;
  onDeleteClimb: (climb: LocalClimb) => void;
  currentUser: User | null; // For displaying user info or logout action
  onLogout?: () => void; // Optional: if logout is handled here
}

const SessionDetails = ({
  session,
  climbs,
  onClose,
  onEditSession,
  onDeleteSession,
  onResumeSession,
  onShowAnalysisDrawer,
  onEditClimb,
  onDeleteClimb,
  currentUser,
  onLogout,
}: SessionDetailsProps) => {
  if (!session) return null;

  const sessionStartTime = typeof session.startTime === 'string' ? new Date(session.startTime) : session.startTime;
  const climbingTypeStyleKey = session.climbingType 
    ? session.climbingType.replace(/\s+/g, '_').toLowerCase() as ClimbingTypeStyleKey
    : 'boulder'; // Default fallback if climbingType is undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-4">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-stone-800 flex-1">Session Details</h1>
        {onLogout && currentUser && (
           <Button variant="ghost" size="icon" onClick={onLogout} className="text-stone-600 hover:text-stone-800" title={`Logout (${currentUser.email})`}>
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Card className="border-stone-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-stone-600" />
                <span className="text-lg">{session.location}</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn(styles.badgeBase, styles[climbingTypeStyleKey] || styles.boulder)}
              >
                {session.climbingType}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-sm text-stone-600">
                <div>{formatDate(sessionStartTime)}</div>
                <div>{formatTime(sessionStartTime)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEditSession(session)} className="h-8 w-8 text-stone-500 hover:text-stone-700">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteSession(session)} className="h-8 w-8 text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Duration</span>
              <span className="font-semibold">{getSessionDuration(session)}m</span>
            </div>
            {session.notes && (
              <div className="text-sm">
                <span className="text-stone-600">Notes: </span>
                <span className="italic">{session.notes}</span>
              </div>
            )}
            <SessionStats session={session} />
            
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => onResumeSession(session.id)} 
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                // Consider disabling if session is active or other conditions
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Session
              </Button>
              <Button onClick={onShowAnalysisDrawer} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Brain className="h-4 w-4 mr-2" />
                {session.aiAnalysis ? 'View Analysis' : 'AI Analysis'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {session.aiAnalysis && (
        // AIAnalysisDrawer is a trigger here; the actual drawer might be global or rendered in History.tsx
        // This can be simplified if AIAnalysisDrawer is a simple component passed as prop.
        // For now, assuming onShowAnalysisDrawer opens a modal/drawer managed by useSessionHistory
        <Card 
          onClick={onShowAnalysisDrawer} 
          className="border-blue-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Brain className="h-5 w-5" />
              AI Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-stone-700 mb-2 line-clamp-2">{session.aiAnalysis.summary}</p>
                {session.aiAnalysis.generatedAt && (
                  <div className="text-xs text-stone-500">
                    Generated on {formatDate(new Date(session.aiAnalysis.generatedAt))}
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {climbs && climbs.length > 0 && (
        <Card className="border-stone-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Climbs ({climbs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClimbList 
              climbs={climbs} 
              onEdit={onEditClimb} 
              onDelete={onDeleteClimb} 
              showEditButton={true} 
              showDeleteButton={true} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionDetails;
