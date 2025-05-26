
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Plus, Clock, TrendingUp, History } from "lucide-react";
import { Link } from "react-router-dom";
import ClimbLogForm from "@/components/ClimbLogForm";
import SessionStats from "@/components/SessionStats";
import ClimbList from "@/components/ClimbList";
import SessionForm from "@/components/SessionForm";
import { useToast } from "@/hooks/use-toast";
import { Session, Climb } from "@/types/climbing";

const Index = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showClimbForm, setShowClimbForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved data from localStorage
    const savedSession = localStorage.getItem('currentSession');
    const savedClimbs = localStorage.getItem('climbs');
    const savedSessions = localStorage.getItem('sessions');
    
    if (savedSession) {
      const session = JSON.parse(savedSession);
      session.startTime = new Date(session.startTime);
      if (session.endTime) session.endTime = new Date(session.endTime);
      setCurrentSession(session);
    }
    
    if (savedClimbs) {
      const parsedClimbs = JSON.parse(savedClimbs);
      parsedClimbs.forEach((climb: Climb) => {
        climb.timestamp = new Date(climb.timestamp);
      });
      setClimbs(parsedClimbs);
    }

    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      parsedSessions.forEach((session: Session) => {
        session.startTime = new Date(session.startTime);
        if (session.endTime) session.endTime = new Date(session.endTime);
        session.climbs.forEach((climb: Climb) => {
          climb.timestamp = new Date(climb.timestamp);
        });
      });
      setSessions(parsedSessions);
    }
  }, []);

  useEffect(() => {
    // Save to localStorage whenever state changes
    if (currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
      localStorage.removeItem('currentSession');
    }
    localStorage.setItem('climbs', JSON.stringify(climbs));
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }, [currentSession, climbs, sessions]);

  const startSession = (sessionData: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => {
    const newSession: Session = {
      ...sessionData,
      id: Date.now().toString(),
      startTime: new Date(),
      breaks: 0,
      totalBreakTime: 0,
      climbs: [],
      isActive: true
    };
    setCurrentSession(newSession);
    setShowSessionForm(false);
    toast({
      title: "Session Started",
      description: `Started ${sessionData.climbingType} session at ${sessionData.location}`,
    });
  };

  const endSession = () => {
    if (!currentSession) return;
    
    const updatedSession: Session = {
      ...currentSession,
      endTime: new Date(),
      isActive: false
    };
    
    setSessions(prev => [updatedSession, ...prev]);
    setCurrentSession(null);
    
    toast({
      title: "Session Ended",
      description: `Logged ${updatedSession.climbs.length} climbs`,
    });
  };

  const addClimb = (climb: Omit<Climb, 'id' | 'timestamp' | 'sessionId'>) => {
    const newClimb: Climb = {
      ...climb,
      id: Date.now().toString(),
      sessionId: currentSession?.id,
      timestamp: new Date()
    };
    
    setClimbs(prev => [newClimb, ...prev]);
    
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        climbs: [...prev.climbs, newClimb]
      } : null);
    }
    
    setShowClimbForm(false);
    toast({
      title: "Climb Logged",
      description: `${climb.name} - ${climb.grade}`,
    });
  };

  const sessionDuration = currentSession ? 
    Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000 / 60) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">ClimbLog</h1>
          <p className="text-stone-600">Track your climbing progress</p>
          <Link to="/history">
            <Button variant="outline" className="mt-2">
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          </Link>
        </div>

        {/* Session Control */}
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
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Active
                    </Badge>
                    <span className="text-lg font-semibold text-stone-700">
                      {sessionDuration}m
                    </span>
                  </div>
                  <div className="text-sm text-stone-600">
                    <div className="capitalize">{currentSession.climbingType} at {currentSession.location}</div>
                  </div>
                </div>
                <SessionStats session={currentSession} />
                <Button 
                  onClick={endSession}
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {showSessionForm ? (
                  <SessionForm 
                    onSubmit={startSession}
                    onCancel={() => setShowSessionForm(false)}
                  />
                ) : (
                  <Button 
                    onClick={() => setShowSessionForm(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Add Climb */}
        {currentSession && (
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
                  onSubmit={addClimb}
                  onCancel={() => setShowClimbForm(false)}
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
        )}

        {/* Recent Climbs */}
        {currentSession && currentSession.climbs.length > 0 && (
          <Card className="border-stone-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle>Session Climbs</CardTitle>
            </CardHeader>
            <CardContent>
              <ClimbList climbs={currentSession.climbs.slice(0, 5)} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
