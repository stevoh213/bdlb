import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const formatTime = (date: Date) => {
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
                <Button onClick={endSession} variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                  <Pause className="h-4 w-4 mr-2" />
                  End Session
                </Button>
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
        <Card className="border-stone-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-stone-600" />
                Recent Sessions
              </div>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="text-stone-600">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-6 text-stone-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-stone-400" />
                <p className="text-sm">No sessions yet</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {sessions.slice(0, 10).map((session) => (
                    <Link key={session.id} to="/history">
                      <Card className="cursor-pointer hover:shadow-md transition-shadow border-stone-100">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-3 w-3 text-stone-500" />
                                <span className="font-medium text-stone-800 text-sm">{session.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs capitalize ${climbingTypeColors[session.climbingType]}`}>
                                  {session.climbingType}
                                </Badge>
                                <span className="text-xs text-stone-500">
                                  {session.climbs.length} climbs
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-xs text-stone-500">
                              <div>{formatDate(session.startTime)}</div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getSessionDuration(session)}m
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

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
