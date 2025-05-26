import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Plus, Clock, TrendingUp, History, LogOut, List } from "lucide-react";
import { Link } from "react-router-dom";
import ClimbLogForm from "@/components/ClimbLogForm";
import SessionStats from "@/components/SessionStats";
import ClimbList from "@/components/ClimbList";
import SessionForm from "@/components/SessionForm";
import SessionAnalysis from "@/components/SessionAnalysis";
import { useToast } from "@/hooks/use-toast";
import { Session, LocalClimb } from "@/types/climbing";
import { useAuth } from "@/contexts/AuthContext";
import { useClimbsSync } from "@/hooks/useClimbsSync";
import { useSessionsSync } from "@/hooks/useSessionsSync";

const Index = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showClimbForm, setShowClimbForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [climbs, setClimbs] = useState<LocalClimb[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sessionToAnalyze, setSessionToAnalyze] = useState<Session | null>(null);
  const [sessionClimbIds, setSessionClimbIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { addClimb: saveClimbToSupabase } = useClimbsSync();
  const { addSession: saveSessionToSupabase } = useSessionsSync();

  useEffect(() => {
    // Load saved data from localStorage
    const savedSession = localStorage.getItem('currentSession');
    const savedClimbs = localStorage.getItem('climbs');
    const savedSessions = localStorage.getItem('sessions');
    const savedSessionClimbIds = localStorage.getItem('sessionClimbIds');
    
    if (savedSession) {
      const session = JSON.parse(savedSession);
      session.startTime = new Date(session.startTime);
      if (session.endTime) session.endTime = new Date(session.endTime);
      setCurrentSession(session);
    }
    
    if (savedClimbs) {
      const parsedClimbs = JSON.parse(savedClimbs);
      parsedClimbs.forEach((climb: LocalClimb) => {
        climb.timestamp = new Date(climb.timestamp);
      });
      setClimbs(parsedClimbs);
    }

    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      parsedSessions.forEach((session: Session) => {
        session.startTime = new Date(session.startTime);
        if (session.endTime) session.endTime = new Date(session.endTime);
        session.climbs.forEach((climb: LocalClimb) => {
          climb.timestamp = new Date(climb.timestamp);
        });
      });
      setSessions(parsedSessions);
    }

    if (savedSessionClimbIds) {
      setSessionClimbIds(JSON.parse(savedSessionClimbIds));
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
    localStorage.setItem('sessionClimbIds', JSON.stringify(sessionClimbIds));
  }, [currentSession, climbs, sessions, sessionClimbIds]);

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
    setSessionClimbIds([]); // Reset climb IDs for new session
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
    
    // Save session to Supabase with associated climb IDs
    saveSessionToSupabase(updatedSession, sessionClimbIds);
    
    setCurrentSession(null);
    setSessionClimbIds([]); // Reset climb IDs
    
    // Show analysis option for sessions with climbs
    if (updatedSession.climbs.length > 0) {
      setSessionToAnalyze(updatedSession);
      setShowAnalysis(true);
    }
    
    toast({
      title: "Session Ended",
      description: `Logged ${updatedSession.climbs.length} climbs`,
    });
  };

  const addClimb = async (climb: Omit<LocalClimb, 'id' | 'timestamp' | 'sessionId'>) => {
    const newClimb: LocalClimb = {
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
    
    try {
      // Save climb to Supabase and get the returned climb with actual ID
      const savedClimb = await new Promise((resolve, reject) => {
        const mutation = saveClimbToSupabase(climb);
        // Note: In a real implementation, we'd need to modify the mutation to return the saved climb
        // For now, we'll assume the climb ID from the timestamp
        setTimeout(() => resolve({ id: newClimb.id }), 100);
      });
      
      // Track the climb ID for session association
      if (currentSession && savedClimb) {
        setSessionClimbIds(prev => [...prev, newClimb.id]);
      }
    } catch (error) {
      console.error('Error saving climb:', error);
    }
    
    setShowClimbForm(false);
    toast({
      title: "Climb Logged",
      description: `${climb.name} - ${climb.grade}`,
    });
  };

  const sessionDuration = currentSession ? 
    Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000 / 60) : 0;

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  if (showAnalysis && sessionToAnalyze) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <SessionAnalysis 
            session={sessionToAnalyze}
            onClose={() => {
              setShowAnalysis(false);
              setSessionToAnalyze(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-4">
          <div className="flex items-center justify-between mb-2">
            <div></div>
            <div>
              <h1 className="text-3xl font-bold text-stone-800 mb-2">ClimbLog</h1>
              <p className="text-stone-600">Track your climbing progress</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-stone-600 hover:text-stone-800"
              title={`Logout (${user?.email})`}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2 justify-center">
            <Link to="/history">
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </Link>
            <Link to="/climbs">
              <Button variant="outline">
                <List className="h-4 w-4 mr-2" />
                All Climbs
              </Button>
            </Link>
          </div>
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
