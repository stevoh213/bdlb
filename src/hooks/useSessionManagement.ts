import { useState, useEffect } from "react";
import { Session, LocalClimb } from "@/types/climbing";
import { useToast } from "@/hooks/use-toast";
import { useClimbingSessions } from "@/hooks/useClimbingSessions";
import { useClimbs } from "@/hooks/useClimbs";
import { useAuth } from "@/contexts/AuthContext";

export const useSessionManagement = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [climbs, setClimbs] = useState<LocalClimb[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use database hooks
  const { sessions: dbSessions, addSessionAsync: addDbSession } = useClimbingSessions();
  const { addClimbAsync: addDbClimb } = useClimbs();

  useEffect(() => {
    // Only load current active session from localStorage
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
      parsedClimbs.forEach((climb: LocalClimb) => {
        climb.timestamp = new Date(climb.timestamp);
      });
      setClimbs(parsedClimbs);
    }
    
    // Clear old localStorage sessions data
    localStorage.removeItem('sessions');
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
  }, [currentSession, climbs]);

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
    toast({
      title: "Session Started",
      description: `Started ${sessionData.climbingType} session at ${sessionData.location}`
    });
  };

  const pauseSession = () => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, isActive: false } : null);
    toast({
      title: "Session Paused",
      description: "Session has been paused"
    });
  };

  const resumeSession = () => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, isActive: true } : null);
    toast({
      title: "Session Resumed",
      description: "Session has been resumed"
    });
  };

  const resumeEndedSession = (sessionId: string) => {
    const sessionToResume = dbSessions?.find(session => session.id === sessionId);
    if (!sessionToResume) return;

    const resumedSession: Session = {
      ...sessionToResume,
      endTime: undefined,
      isActive: true
    };

    setCurrentSession(resumedSession);
    localStorage.setItem('currentSession', JSON.stringify(resumedSession));
    
    toast({
      title: "Session Resumed",
      description: `Resumed ${sessionToResume.climbingType} session at ${sessionToResume.location}`
    });
  };

  const endSession = () => {
    if (!currentSession || !user) return;
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 60000); // minutes
    
    // Save session to database asynchronously
    const saveSessionAsync = async () => {
      try {
        // Save session to database
        const dbSession = await addDbSession({
          date: currentSession.startTime.toISOString(),
          duration,
          location: currentSession.location,
          location_type: currentSession.location?.toLowerCase().includes('gym') ? 'indoor' : 'outdoor',
          default_climb_type: currentSession.climbingType,
          gradeSystem: currentSession.gradeSystem,
          notes: currentSession.notes
        });
        
        // Save climbs to database
        if (dbSession && climbs.length > 0) {
          for (const climb of climbs) {
            await addDbClimb({
              sessionId: dbSession.id,
              name: climb.name,
              grade: climb.grade,
              type: currentSession.climbingType,
              send_type: climb.tickType === 'send' ? 'send' : climb.tickType === 'flash' ? 'flash' : climb.tickType === 'onsight' ? 'onsight' : 'attempt',
              date: climb.timestamp.toISOString(),
              location: currentSession.location,
              attempts: climb.attempts || 1,
              notes: climb.notes
            });
          }
        }
      } catch (error) {
        console.error('Failed to save session:', error);
        toast({
          title: "Error",
          description: "Failed to save session to database. Data saved locally.",
          variant: "destructive"
        });
      }
    };
    
    // Execute async save
    saveSessionAsync();
    
    // Clear local state immediately for better UX
    setCurrentSession(null);
    setClimbs([]);
    setSessionTime(0);
    localStorage.removeItem('currentSession');
    localStorage.removeItem('climbs');
    
    toast({
      title: "Session Ended",
      description: `Logged ${climbs.length} climbs in ${duration} minutes`
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
    toast({
      title: "Climb Logged",
      description: `${climb.name} - ${climb.grade}`
    });
  };

  const updateClimb = (climbId: string, updates: Partial<LocalClimb>) => {
    setClimbs(prevClimbs => 
      prevClimbs.map(climb => 
        climb.id === climbId ? { ...climb, ...updates } : climb
      )
    );
    if (currentSession) {
      setCurrentSession(prevSession => 
        prevSession ? {
          ...prevSession,
          climbs: prevSession.climbs.map(climb => 
            climb.id === climbId ? { ...climb, ...updates } : climb
          )
        } : null
      );
    }
    toast({
      title: "Climb Updated",
      description: `Updated details for ${updates.name || 'climb'}`
    });
  };

  const deleteClimb = (climbId: string) => {
    const climbToDelete = climbs.find(c => c.id === climbId);

    setClimbs(prevClimbs => prevClimbs.filter(climb => climb.id !== climbId));

    if (currentSession) {
      setCurrentSession(prevSession =>
        prevSession
          ? {
              ...prevSession,
              climbs: prevSession.climbs.filter(climb => climb.id !== climbId),
            }
          : null
      );
    }

    if (climbToDelete) {
      toast({
        title: "Climb Deleted",
        description: `${climbToDelete.name} (${climbToDelete.grade}) was removed from the session.`,
        variant: "destructive",
      });
    }
  };

  return {
    currentSession,
    sessions: dbSessions, // Expose database sessions
    climbs, // Expose local climbs for current session
    sessionTime,
    startSession,
    pauseSession,
    resumeSession,
    resumeEndedSession,
    endSession,
    addClimb,
    updateClimb,
    deleteClimb, // Expose deleteClimb
  };
};
