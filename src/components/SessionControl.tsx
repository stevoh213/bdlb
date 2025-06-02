
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock } from "lucide-react";
import { Session } from "@/types/climbing";
import SessionForm from "./SessionForm";
import SessionStats from "./SessionStats";

interface SessionControlProps {
  currentSession: Session | null;
  sessionTime: number;
  onStartSession: (session: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => void;
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

  const handleStartSession = (sessionData: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => {
    onStartSession(sessionData);
    setShowSessionForm(false);
  };

  return (
    <Card className="border-stone-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentSession ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={currentSession.isActive ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${currentSession.isActive ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                    {currentSession.isActive ? 'Active' : 'Paused'}
                  </Badge>
                  <span className="text-lg font-mono font-semibold text-stone-700">
                    {formatTime(sessionTime)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-stone-600">
                <div className="capitalize">{currentSession.climbingType} at {currentSession.location}</div>
              </div>
            </div>
            <SessionStats session={currentSession} />
            <div className="flex gap-2">
              {currentSession.isActive ? (
                <Button onClick={onPauseSession} variant="outline" className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={onResumeSession} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button onClick={onEndSession} variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50">
                End Session
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {showSessionForm ? (
              <SessionForm onSubmit={handleStartSession} onCancel={() => setShowSessionForm(false)} />
            ) : (
              <Button onClick={() => setShowSessionForm(true)} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionControl;
