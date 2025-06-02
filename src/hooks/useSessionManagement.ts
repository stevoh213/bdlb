
import { useState, useEffect } from "react";
import { Session, LocalClimb } from "@/types/climbing";
import { useToast } from "@/hooks/use-toast";

export const useSessionManagement = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [climbs, setClimbs] = useState<LocalClimb[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
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
    const sessionToResume = sessions.find(session => session.id === sessionId);
    if (!sessionToResume) return;

    setSessions(prev => prev.filter(session => session.id !== sessionId));
    const resumedSession: Session = {
      ...sessionToResume,
      endTime: undefined,
      isActive: true
    };

    setCurrentSession(resumedSession);
    toast({
      title: "Session Resumed",
      description: `Resumed ${sessionToResume.climbingType} session at ${sessionToResume.location}`
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
    toast({
      title: "Climb Logged",
      description: `${climb.name} - ${climb.grade}`
    });
  };

  const updateClimb = (climbId: string, updates: Partial<LocalClimb>) => {
    setClimbs(prev => prev.map(climb => climb.id === climbId ? { ...climb, ...updates } : climb));

    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        climbs: prev.climbs.map(climb => climb.id === climbId ? { ...climb, ...updates } : climb)
      } : null);
    }

    setSessions(prev => prev.map(session => ({
      ...session,
      climbs: session.climbs.map(climb => climb.id === climbId ? { ...climb, ...updates } : climb)
    })));
    
    toast({
      title: "Climb Updated",
      description: "Your climb has been successfully updated."
    });
  };

  return {
    currentSession,
    climbs,
    sessions,
    sessionTime,
    startSession,
    pauseSession,
    resumeSession,
    resumeEndedSession,
    endSession,
    addClimb,
    updateClimb
  };
};
