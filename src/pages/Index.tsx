
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Plus, Clock, TrendingUp } from "lucide-react";
import ClimbLogForm from "@/components/ClimbLogForm";
import SessionStats from "@/components/SessionStats";
import ClimbList from "@/components/ClimbList";
import { useToast } from "@/hooks/use-toast";

export interface Climb {
  id: string;
  name: string;
  grade: string;
  tickType: 'send' | 'attempt' | 'flash' | 'onsight';
  height?: number;
  timeOnWall?: number;
  effort: number;
  notes?: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  breaks: number;
  totalBreakTime: number;
  climbs: Climb[];
  isActive: boolean;
}

const Index = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showClimbForm, setShowClimbForm] = useState(false);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved data from localStorage
    const savedSession = localStorage.getItem('currentSession');
    const savedClimbs = localStorage.getItem('climbs');
    
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
  }, []);

  useEffect(() => {
    // Save to localStorage whenever state changes
    if (currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
      localStorage.removeItem('currentSession');
    }
    localStorage.setItem('climbs', JSON.stringify(climbs));
  }, [currentSession, climbs]);

  const startSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      startTime: new Date(),
      breaks: 0,
      totalBreakTime: 0,
      climbs: [],
      isActive: true
    };
    setCurrentSession(newSession);
    toast({
      title: "Session Started",
      description: "Good luck with your climbing!",
    });
  };

  const endSession = () => {
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      endTime: new Date(),
      isActive: false
    };
    setCurrentSession(null);
    
    toast({
      title: "Session Ended",
      description: `Logged ${updatedSession.climbs.length} climbs`,
    });
  };

  const addClimb = (climb: Omit<Climb, 'id' | 'timestamp'>) => {
    const newClimb: Climb = {
      ...climb,
      id: Date.now().toString(),
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
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Active
                  </Badge>
                  <span className="text-lg font-semibold text-stone-700">
                    {sessionDuration}m
                  </span>
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
              <Button 
                onClick={startSession}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
          </CardContent>
        </Card>

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

        {/* Recent Climbs */}
        {climbs.length > 0 && (
          <Card className="border-stone-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle>Recent Climbs</CardTitle>
            </CardHeader>
            <CardContent>
              <ClimbList climbs={climbs.slice(0, 5)} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
