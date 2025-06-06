import { useState, useEffect } from "react";
import { Session, LocalClimb } from "@/types/climbing";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSessionManagement = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [climbs, setClimbs] = useState<LocalClimb[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const { toast } = useToast();

  const { user } = useAuth();

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;

      const { data: sessionRows, error } = await supabase
        .from("climbing_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error || !sessionRows) return;

      const sessionIds = sessionRows.map((s) => s.id);

      const climbsMap: Record<string, LocalClimb[]> = {};

      if (sessionIds.length > 0) {
        const { data: entries } = await supabase
          .from("climb_session_entries")
          .select("session_id, climbs(*)")
          .in("session_id", sessionIds);

        entries?.forEach((entry) => {
          const c = entry.climbs;
          const local: LocalClimb = {
            id: c.id,
            name: c.name,
            grade: c.grade,
            tickType: c.send_type as LocalClimb["tickType"],
            attempts: c.attempts || undefined,
            timestamp: new Date(c.date),
            sessionId: entry.session_id,
            height: c.elevation_gain || undefined,
            timeOnWall: c.duration || undefined,
            notes: c.notes || undefined,
            physicalSkills: (c.physical_skills || undefined) as
              | string[]
              | undefined,
            technicalSkills: (c.technical_skills || undefined) as
              | string[]
              | undefined,
          };
          if (!climbsMap[entry.session_id]) climbsMap[entry.session_id] = [];
          climbsMap[entry.session_id].push(local);
        });
      }

      const loadedSessions = sessionRows.map((row) => {
        const start = new Date(row.date);
        const end = new Date(start.getTime() + row.duration * 60000);
        return {
          id: row.id,
          location: row.location,
          climbingType: row.default_climb_type as Session["climbingType"],
          gradeSystem: row.grade_system || undefined,
          notes: row.notes || undefined,
          startTime: start,
          endTime: end,
          climbs: climbsMap[row.id] || [],
          isActive: false,
          breaks: 0,
          totalBreakTime: 0,
        } as Session;
      });

      setSessions(loadedSessions);
    };

    loadSessions();
  }, [user]);

  // Real-time timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession && currentSession.isActive) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - currentSession.startTime.getTime()) / 1000,
        );
        setSessionTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const startSession = (
    sessionData: Omit<
      Session,
      | "id"
      | "startTime"
      | "endTime"
      | "climbs"
      | "isActive"
      | "breaks"
      | "totalBreakTime"
    >,
  ) => {
    const newSession: Session = {
      ...sessionData,
      id: Date.now().toString(),
      startTime: new Date(),
      breaks: 0,
      totalBreakTime: 0,
      climbs: [],
      isActive: true,
    };
    setCurrentSession(newSession);
    toast({
      title: "Session Started",
      description: `Started ${sessionData.climbingType} session at ${sessionData.location}`,
    });
  };

  const pauseSession = () => {
    if (!currentSession) return;
    setCurrentSession((prev) => (prev ? { ...prev, isActive: false } : null));
    toast({
      title: "Session Paused",
      description: "Session has been paused",
    });
  };

  const resumeSession = () => {
    if (!currentSession) return;
    setCurrentSession((prev) => (prev ? { ...prev, isActive: true } : null));
    toast({
      title: "Session Resumed",
      description: "Session has been resumed",
    });
  };

  const resumeEndedSession = (sessionId: string) => {
    const sessionToResume = sessions.find(
      (session) => session.id === sessionId,
    );
    if (!sessionToResume) return;

    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    const resumedSession: Session = {
      ...sessionToResume,
      endTime: undefined,
      isActive: true,
    };

    setCurrentSession(resumedSession);
    toast({
      title: "Session Resumed",
      description: `Resumed ${sessionToResume.climbingType} session at ${sessionToResume.location}`,
    });
  };

  const endSession = async () => {
    if (!currentSession || !user) return;

    const updatedSession: Session = {
      ...currentSession,
      endTime: new Date(),
      isActive: false,
    };

    const { data: sessionRow, error: sessionError } = await supabase
      .from("climbing_sessions")
      .insert({
        date: updatedSession.startTime.toISOString(),
        duration: Math.floor(
          (updatedSession.endTime.getTime() -
            updatedSession.startTime.getTime()) /
            60000,
        ),
        location: updatedSession.location,
        default_climb_type: updatedSession.climbingType,
        grade_system: updatedSession.gradeSystem || null,
        notes: updatedSession.notes || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (sessionError || !sessionRow) {
      toast({
        title: "Error logging session",
        description: sessionError?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }

    for (const climb of updatedSession.climbs) {
      const { data: climbRow, error: climbError } = await supabase
        .from("climbs")
        .insert({
          name: climb.name,
          grade: climb.grade,
          type: updatedSession.climbingType,
          send_type: climb.tickType,
          attempts: climb.attempts ?? 1,
          date: climb.timestamp.toISOString(),
          location: climb.location ?? updatedSession.location,
          duration: climb.timeOnWall ?? null,
          elevation_gain: climb.height ?? null,
          notes: climb.notes ?? null,
          physical_skills: climb.physicalSkills ?? null,
          technical_skills: climb.technicalSkills ?? null,
          user_id: user.id,
        })
        .select()
        .single();

      if (climbError || !climbRow) {
        toast({
          title: "Error logging climb",
          description: climbError?.message ?? "Unknown error",
          variant: "destructive",
        });
        continue;
      }

      const { error: entryError } = await supabase
        .from("climb_session_entries")
        .insert({
          session_id: sessionRow.id,
          climb_id: climbRow.id,
        });

      if (entryError) {
        toast({
          title: "Error linking climb",
          description: entryError.message,
          variant: "destructive",
        });
      }
    }

    setSessions((prev) => [updatedSession, ...prev]);
    setClimbs([]);
    setCurrentSession(null);

    toast({
      title: "Session Ended",
      description: `Logged ${updatedSession.climbs.length} climbs`,
    });
  };

  const addClimb = (
    climb: Omit<LocalClimb, "id" | "timestamp" | "sessionId">,
  ) => {
    const newClimb: LocalClimb = {
      ...climb,
      id: Date.now().toString(),
      sessionId: currentSession?.id,
      timestamp: new Date(),
    };
    setClimbs((prev) => [newClimb, ...prev]);
    if (currentSession) {
      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              climbs: [...prev.climbs, newClimb],
            }
          : null,
      );
    }
    toast({
      title: "Climb Logged",
      description: `${climb.name} - ${climb.grade}`,
    });
  };

  const updateClimb = (climbId: string, updates: Partial<LocalClimb>) => {
    setClimbs((prev) =>
      prev.map((climb) =>
        climb.id === climbId ? { ...climb, ...updates } : climb,
      ),
    );

    if (currentSession) {
      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              climbs: prev.climbs.map((climb) =>
                climb.id === climbId ? { ...climb, ...updates } : climb,
              ),
            }
          : null,
      );
    }

    setSessions((prev) =>
      prev.map((session) => ({
        ...session,
        climbs: session.climbs.map((climb) =>
          climb.id === climbId ? { ...climb, ...updates } : climb,
        ),
      })),
    );

    toast({
      title: "Climb Updated",
      description: "Your climb has been successfully updated.",
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
    updateClimb,
  };
};
