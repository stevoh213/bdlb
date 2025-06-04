import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Check, X, Zap, Eye } from "lucide-react";
import { Session } from "@/types/climbing";
import SessionForm from "./SessionForm";

// SessionStats component is no longer used and its logic is integrated below

interface SessionControlProps {
  currentSession: Session | null;
  sessionTime: number;
  onStartSession: (session: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => Promise<void>;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => Promise<void>;
}

const SessionControl = ({
  currentSession,
  sessionTime,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onEndSession
}: SessionControlProps) => {
  const [showSessionForm, setShowSessionForm] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async (sessionData: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => {
    await onStartSession(sessionData);
    setShowSessionForm(false);
  };

  // Stats logic integrated here for use in the new layout
  const climbs = currentSession?.climbs || [];
  const sends = climbs.filter(c => c.tickType === 'send').length;
  const attempts = climbs.filter(c => c.tickType === 'attempt').length;
  const flashes = climbs.filter(c => c.tickType === 'flash').length;
  const onsights = climbs.filter(c => c.tickType === 'onsight').length;
  const totalClimbs = climbs.length;

  return (
    <Card className="border-stone-200 shadow-lg">
      {currentSession ? (
        <>
          <CardHeader className="pt-3 pb-2 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-lg">Session</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${currentSession.isActive ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${currentSession.isActive ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                  {currentSession.isActive ? 'Active' : 'Paused'}
                </Badge>
                <span className="text-base font-mono font-semibold text-stone-700">
                  {formatTime(sessionTime)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-2 space-y-2.5"> {/* Main content spacing */}
            {/* Three-column layout for stats and info */}
            <div className="flex items-stretch gap-1.5">
              {/* Column 1: Attempt & Onsight Icons */}
              <div className="flex w-20 flex-shrink-0 flex-col space-y-1.5 items-center">
                {(attempts > 0 || onsights > 0) ? (
                  <>
                    {attempts > 0 && (
                      <div className="flex items-center gap-1 text-red-600" title={`${attempts} Attempt${attempts !== 1 ? 's' : ''}`}>
                        <X className="h-4 w-4" />
                        <span className="text-sm font-medium">{attempts}</span>
                      </div>
                    )}
                    {onsights > 0 && (
                      <div className="flex items-center gap-1 text-purple-600" title={`${onsights} Onsight${onsights !== 1 ? 's' : ''}`}>
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">{onsights}</span>
                      </div>
                    )}
                  </>
                ) : <div className="w-full h-8"/> /* Placeholder for consistent height */}
              </div>

              {/* Column 2: Send & Flash Icons */}
              <div className="flex w-20 flex-shrink-0 flex-col space-y-1.5 items-center pl-1.5">
                 {(sends > 0 || flashes > 0) ? (
                  <>
                    {sends > 0 && (
                      <div className="flex items-center gap-1 text-green-600" title={`${sends} Send${sends !== 1 ? 's' : ''}`}>
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">{sends}</span>
                      </div>
                    )}
                    {flashes > 0 && (
                      <div className="flex items-center gap-1 text-blue-600" title={`${flashes} Flash${flashes !== 1 ? 'es' : ''}`}>
                        <Zap className="h-4 w-4" />
                        <span className="text-sm font-medium">{flashes}</span>
                      </div>
                    )}
                  </>
                ) : <div className="w-full h-8"/> /* Placeholder for consistent height */}
              </div>

              {/* Column 3: Total Climbs & Location/Type */}
              <div className="flex flex-1 flex-col items-end space-y-0.5 text-right pl-1.5">
                <div className="text-xs text-stone-500">Total Climbs</div>
                <div className="text-xl font-bold text-stone-800">{totalClimbs}</div>
                <div className="text-xs text-stone-500 capitalize pt-1">
                  {currentSession.climbingType} at {currentSession.location}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1.5 pt-2.5">
              {currentSession.isActive ? (
                <Button onClick={onPauseSession} variant="outline" size="sm" className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 text-xs">
                  <Pause className="h-3.5 w-3.5 mr-1.5" />
                  Pause
                </Button>
              ) : (
                <Button onClick={onResumeSession} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs">
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Resume
                </Button>
              )}
              <Button onClick={onEndSession} variant="outline" size="sm" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 text-xs">
                End Session
              </Button>
            </div>
          </CardContent>
        </>
      ) : (
        // Fallback for when there is no current session (Start Session button)
        <CardContent className="px-4 py-4">
          {showSessionForm ? (
            <SessionForm onSubmit={handleStartSession} onCancel={() => setShowSessionForm(false)} />
          ) : (
            <Button onClick={() => setShowSessionForm(true)} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SessionControl;
