import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Plus, Clock, TrendingUp, History, LogOut, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import ClimbLogForm from "@/components/ClimbLogForm";
import SessionStats from "@/components/SessionStats";
import ClimbList from "@/components/ClimbList";
import SessionForm from "@/components/SessionForm";
import EditClimbDialog from "@/components/EditClimbDialog";
import { useToast } from "@/hooks/use-toast";
import { Session, LocalClimb } from "@/types/climbing";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showClimbForm, setShowClimbForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [climbs, setClimbs] = useState<LocalClimb[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingClimb, setEditingClimb] = useState<LocalClimb | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const { toast } = useToast();
  const { signOut, user } = useAuth();

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
  }, []);

  // Real-time timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession && currentSession.isActive) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000);
        setSessionTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

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
      description: `Started ${sessionData.climbingType} session at ${sessionData.location}`
    });
  };

  const pauseSession = () => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? {
      ...prev,
      isActive: false
    } : null);
    toast({
      title: "Session Paused",
      description: "Session has been paused"
    });
  };

  const resumeSession = () => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? {
      ...prev,
      isActive: true
    } : null);
    toast({
      title: "Session Resumed",
      description: "Session has been resumed"
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
      description: `Logged ${updatedSession.climbs.length} climbs`
    });
  };

  const addClimb = (climb: Omit<LocalClimb, 'id' | 'timestamp' | 'sessionId'>) => {
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
    setShowClimbForm(false);
    toast({
      title: "Climb Logged",
      description: `${climb.name} - ${climb.grade}`
    });
  };

  const updateClimb = (climbId: string, updates: Partial<LocalClimb>) => {
    // Update in global climbs list
    setClimbs(prev => prev.map(climb => climb.id === climbId ? {
      ...climb,
      ...updates
    } : climb));

    // Update in current session if the climb belongs to it
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        climbs: prev.climbs.map(climb => climb.id === climbId ? {
          ...climb,
          ...updates
        } : climb)
      } : null);
    }

    // Update in sessions history
    setSessions(prev => prev.map(session => ({
      ...session,
      climbs: session.climbs.map(climb => climb.id === climbId ? {
        ...climb,
        ...updates
      } : climb)
    })));
    toast({
      title: "Climb Updated",
      description: "Your climb has been successfully updated."
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const sessionDuration = currentSession ? Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000 / 60) : 0;

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeForHistory = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionDuration = (session: Session) => {
    if (!session.endTime) return 0;
    return Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60);
  };

  const climbingTypeColors = {
    sport: "bg-blue-100 text-blue-800 border-blue-200",
    trad: "bg-purple-100 text-purple-800 border-purple-200",
    boulder: "bg-orange-100 text-orange-800 border-orange-200",
    toprope: "bg-green-100 text-green-800 border-green-200",
    multipitch: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
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
                    <Button onClick={pauseSession} variant="outline" className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={resumeSession} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button onClick={endSession} variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50">
                    End Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {showSessionForm ? (
                  <SessionForm onSubmit={startSession} onCancel={() => setShowSessionForm(false)} />
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
                  gradeSystem={currentSession.gradeSystem}
                  sessionLocation={currentSession.location}
                />
              ) : (
                <Button onClick={() => setShowClimbForm(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Climb
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Climbs in Current Session */}
        {currentSession && currentSession.climbs.length > 0 && (
          <Card className="border-stone-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle>Session Climbs</CardTitle>
            </CardHeader>
            <CardContent>
              <ClimbList climbs={currentSession.climbs.slice(0, 5)} onEdit={setEditingClimb} showEditButton={true} />
            </CardContent>
          </Card>
        )}

        {/* Recent Sessions History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-stone-600" />
              <h2 className="text-lg font-semibold text-stone-800">Recent Sessions</h2>
            </div>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-stone-600">
                View All
              </Button>
            </Link>
          </div>

          {sessions.length === 0 ? (
            <Card className="border-stone-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-stone-700 mb-2">No Sessions Yet</h3>
                <p className="text-stone-600 mb-4">Start your first climbing session to see it here!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((session) => (
                <Link key={session.id} to="/history">
                  <Card className="border-stone-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-stone-600" />
                            <span className="font-semibold text-stone-800">{session.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`capitalize ${climbingTypeColors[session.climbingType]}`}>
                              {session.climbingType}
                            </Badge>
                            {session.aiAnalysis && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                AI Analyzed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-stone-600">
                          <div>{formatDate(session.startTime)}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getSessionDuration(session)}m
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-600">Climbs logged</span>
                        <span className="font-semibold text-emerald-600">{session.climbs.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Edit Climb Dialog */}
        {editingClimb && (
          <EditClimbDialog 
            climb={editingClimb} 
            open={!!editingClimb} 
            onOpenChange={open => !open && setEditingClimb(null)} 
            onSave={updateClimb} 
          />
        )}
      </div>
    </div>
  );
};

export default Index;
