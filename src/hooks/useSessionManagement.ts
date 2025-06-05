import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useClimbingSessions } from "@/hooks/useClimbingSessions";
import { AddClimbVariables, useClimbs } from "@/hooks/useClimbs";
import { mapDbClimbToLocalClimb, mapLocalClimbToNewClimbData } from "@/lib/utils";
import { UpdateClimbData } from "@/services/climbingService";
import { Climb, LocalClimb, Session } from "@/types/climbing";
import { useCallback, useEffect, useState } from "react";

export const useSessionManagement = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [climbs, setClimbs] = useState<LocalClimb[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Loading and error states
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isAddingClimb, setIsAddingClimb] = useState(false);
  const [isUpdatingClimb, setIsUpdatingClimb] = useState(false);
  const [isDeletingClimb, setIsDeletingClimb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use database hooks
  const { sessions: dbSessions, addSessionAsync: addDbSession, updateSessionAsync: updateDbSession } = useClimbingSessions();
  const { 
    climbs: allUserClimbs, 
    addClimbAsync: addDbClimbMutationAsync, 
    updateClimb: updateDbClimbMutation,
    deleteClimbAsync: deleteDbClimbMutationAsync
  } = useClimbs();

  useEffect(() => {
    console.log("[useSessionManagement Mount Effect] Running effect to load from localStorage."); // DEBUG
    const savedSessionData = localStorage.getItem('currentSession');
    console.log("[useSessionManagement Mount Effect] Raw savedSessionData from LS:", savedSessionData); // DEBUG
    const savedClimbsData = localStorage.getItem('climbs');

    if (savedSessionData) {
      try {
        const sessionFromFile = JSON.parse(savedSessionData) as Partial<Session>; 
        console.log("[useSessionManagement Mount Effect] Parsed sessionFromFile:", JSON.parse(JSON.stringify(sessionFromFile))); // DEBUG (deep copy for logging)
        
        let parsedStartTime: Date | null = null;
        if (sessionFromFile.startTime) {
            const st = new Date(sessionFromFile.startTime);
            console.log("[useSessionManagement Mount Effect] Attempting to parse startTime:", sessionFromFile.startTime, "Resulting Date object:", st, "Is valid time:", !isNaN(st.getTime())); // DEBUG
            if (!isNaN(st.getTime())) {
                parsedStartTime = st;
            }
        } else {
            console.log("[useSessionManagement Mount Effect] sessionFromFile.startTime is missing."); // DEBUG
        }

        let parsedEndTime: Date | undefined = undefined;
        if (sessionFromFile.endTime) {
            const et = new Date(sessionFromFile.endTime);
            console.log("[useSessionManagement Mount Effect] Attempting to parse endTime:", sessionFromFile.endTime, "Resulting Date object:", et, "Is valid time:", !isNaN(et.getTime())); // DEBUG
            if (!isNaN(et.getTime())) {
                parsedEndTime = et;
            }
        } else {
            console.log("[useSessionManagement Mount Effect] sessionFromFile.endTime is missing."); // DEBUG
        }

        if (parsedStartTime) {
          console.log("[useSessionManagement Mount Effect] Valid parsedStartTime found. Calling setCurrentSession."); // DEBUG
          const sessionToSet = {
            id: sessionFromFile.id || Date.now().toString(),
            location: sessionFromFile.location || "",
            climbingType: sessionFromFile.climbingType || "boulder",
            gradeSystem: sessionFromFile.gradeSystem,
            notes: sessionFromFile.notes,
            startTime: parsedStartTime,      
            endTime: parsedEndTime,          
            climbs: sessionFromFile.climbs || [], 
            isActive: sessionFromFile.isActive === undefined ? true : sessionFromFile.isActive, 
            breaks: sessionFromFile.breaks || 0,
            totalBreakTime: sessionFromFile.totalBreakTime || 0,
            aiAnalysis: sessionFromFile.aiAnalysis
          } as Session;
          console.log("[useSessionManagement Mount Effect] Session object to be set:", JSON.parse(JSON.stringify(sessionToSet))); // DEBUG
          setCurrentSession(sessionToSet);
        } else {
          console.warn("[useSessionManagement Mount Effect] No valid parsedStartTime. Clearing 'currentSession' from LS."); // DEBUG
          localStorage.removeItem('currentSession');
        }
      } catch (e) {
        console.error("[useSessionManagement Mount Effect] Failed to parse session from localStorage", e);
        localStorage.removeItem('currentSession');
      }
    } else {
        console.log("[useSessionManagement Mount Effect] No savedSessionData found in LS."); // DEBUG
    }

    if (savedClimbsData) {
      try {
        const parsedClimbs = JSON.parse(savedClimbsData) as Partial<LocalClimb>[];
        setClimbs(
          parsedClimbs.map(c => ({ 
            ...(c as LocalClimb), 
            id: c.id || Date.now().toString(), 
            name: c.name || "",
            grade: c.grade || "",
            tickType: c.tickType || "attempt",
            timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
          }))
        );
      } catch (e) {
        console.error("[useSessionManagement Mount Effect] Failed to parse climbs from localStorage", e);
        localStorage.removeItem('climbs');
      }
    }
  }, []); // Dependencies: should be empty for mount only

  // Real-time timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession && currentSession.isActive && currentSession.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000);
        setSessionTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
      localStorage.removeItem('currentSession');
    }
    if (climbs.length > 0 || localStorage.getItem('climbs')) {
        localStorage.setItem('climbs', JSON.stringify(climbs));
    }
  }, [currentSession, climbs]);

  const startSession = useCallback(async (sessionData: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }
    setIsStartingSession(true);
    setError(null);
    try {
      const dbSessionResponse = await addDbSession({
        date: new Date().toISOString(),
        duration: 0,
        location: sessionData.location,
        default_climb_type: sessionData.climbingType,
        gradeSystem: sessionData.gradeSystem,
        notes: sessionData.notes
      });
      const newSession: Session = {
        ...sessionData,
        id: dbSessionResponse.id,
        startTime: new Date(dbSessionResponse.date),
        breaks: 0,
        totalBreakTime: 0,
        climbs: [],
        isActive: true,
      };
      setCurrentSession(newSession);
      setClimbs([]);
      toast({
        title: "Session Started",
        description: `Started ${sessionData.climbingType} session at ${sessionData.location}`
      });
    } catch (err) {
      console.error('Failed to create session:', err);
      const message = err instanceof Error ? err.message : "Could not create session. Please try again.";
      setError(message);
      toast({
        title: "Session Start Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
    }
  }, [user, toast, addDbSession, setClimbs]);

  const pauseSession = useCallback(() => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, isActive: false } : null);
    toast({
      title: "Session Paused",
      description: "Session has been paused"
    });
  }, [currentSession, toast]);

  const resumeSession = useCallback(() => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, isActive: true } : null);
    toast({
      title: "Session Resumed",
      description: "Session has been resumed"
    });
  }, [currentSession, toast]);

  const resumeEndedSession = useCallback((sessionId: string) => {
    const sessionToResume = dbSessions?.find((s: Session) => s.id === sessionId);
    if (!sessionToResume) {
        toast({title: "Error", description: "Session not found to resume.", variant: "destructive"});
        return;
    }

    const historicalDbClimbs = allUserClimbs.filter((climb: Climb) => climb.session_id === sessionId);
    const mappedLocalClimbs: LocalClimb[] = historicalDbClimbs.map(mapDbClimbToLocalClimb);

    setClimbs(mappedLocalClimbs);

    const resumedSessionData: Session = {
      id: sessionToResume.id,
      location: sessionToResume.location,
      climbingType: sessionToResume.climbingType, 
      gradeSystem: sessionToResume.gradeSystem,
      notes: sessionToResume.notes,
      startTime: new Date(sessionToResume.startTime),
      climbs: mappedLocalClimbs,
      endTime: undefined,
      isActive: true,
      breaks: sessionToResume.breaks || 0,
      totalBreakTime: sessionToResume.totalBreakTime || 0,
      aiAnalysis: sessionToResume.aiAnalysis,
    };

    setCurrentSession(resumedSessionData);
    toast({
      title: "Session Resumed",
      description: `Resumed ${resumedSessionData.climbingType} session at ${resumedSessionData.location}`
    });
  }, [dbSessions, toast, allUserClimbs, setClimbs, mapDbClimbToLocalClimb]);

  const endSession = useCallback(async () => {
    console.log("[endSession] Clicked. currentSession:", currentSession, "User:", user); // DEBUG
    if (!currentSession || !currentSession.id || !user) {
      console.warn("[endSession] Guard clause failed. Session or user missing."); // DEBUG
      return;
    }
    setIsEndingSession(true);
    setError(null);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - (currentSession.startTime ? currentSession.startTime.getTime() : Date.now())) / 60000);
    console.log("[endSession] Calculated duration (minutes):", duration); // DEBUG
    
    try {
      console.log("[endSession] Attempting to update DB session with ID:", currentSession.id, "and duration:", duration); // DEBUG
      await updateDbSession({ sessionId: currentSession.id, updates: { duration } });
      console.log("[endSession] DB session update successful."); // DEBUG
      
      setCurrentSession(null);
      setClimbs([]);
      setSessionTime(0);
      toast({
        title: "Session Ended",
        description: `Logged ${climbs.length} climbs in ${duration} minutes`
      });
      console.log("[endSession] Local state cleared and toast shown."); // DEBUG
    } catch (err) {
      console.error('[endSession] Failed to end session:', err); // DEBUG
      const message = err instanceof Error ? err.message : "Session ended but duration may not be saved correctly.";
      setError(message);
      toast({
        title: "Session End Error", 
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsEndingSession(false);
      console.log("[endSession] setIsEndingSession(false) called."); // DEBUG
    }
  }, [currentSession, user, updateDbSession, climbs, toast, setClimbs, setSessionTime, setError, setIsEndingSession]);

  const addClimb = useCallback(async (climbData: Omit<LocalClimb, 'id' | 'timestamp' | 'sessionId'>) => {
    console.log("[addClimb] Attempting to add climb. Current session:", JSON.parse(JSON.stringify(currentSession))); // DEBUG
    console.log("[addClimb] User:", JSON.parse(JSON.stringify(user))); // DEBUG

    if (!currentSession || !currentSession.id || !user) { 
      console.error("[addClimb] Guard clause failed: No active session, session ID, or user."); // DEBUG
      toast({ title: "Error", description: "No active session or user not authenticated", variant: "destructive" });
      return;
    }
    const tempId = Date.now().toString();
    const newClimb: LocalClimb = {
      ...climbData,
      id: tempId, 
      sessionId: currentSession.id,
      timestamp: new Date()
    };
    console.log("[addClimb] Optimistically adding local climb:", JSON.parse(JSON.stringify(newClimb))); // DEBUG
    setClimbs(prevLocalClimbs => {
      const updatedLocalClimbs = [newClimb, ...prevLocalClimbs];
      setCurrentSession(prevSession => {
        if (!prevSession) return null;
        return { ...prevSession, climbs: updatedLocalClimbs };
      });
      return updatedLocalClimbs;
    });

    setIsAddingClimb(true);
    setError(null);
    try {
      const dbClimbPayload = mapLocalClimbToNewClimbData(
        newClimb, 
        currentSession.climbingType, 
        currentSession.location
      );
      console.log("[addClimb] Payload for DB (NewClimbData):", JSON.parse(JSON.stringify(dbClimbPayload))); // DEBUG
      console.log("[addClimb] Calling addDbClimbMutationAsync with sessionId:", currentSession.id); // DEBUG
      
      const savedDbClimb = await addDbClimbMutationAsync({ 
          ...dbClimbPayload, 
          sessionId: currentSession.id 
      } as AddClimbVariables);
      
      console.log("[addClimb] Response from addDbClimbMutationAsync (savedDbClimb):", JSON.parse(JSON.stringify(savedDbClimb))); // DEBUG

      if (savedDbClimb && savedDbClimb.id !== tempId) {
        const fullyMappedSavedClimb = mapDbClimbToLocalClimb(savedDbClimb); 
        console.log("[addClimb] DB save successful. Updating local climb ID. Mapped DB climb:", JSON.parse(JSON.stringify(fullyMappedSavedClimb))); // DEBUG
        setClimbs(prevLocalClimbs => {
          const updatedLocalClimbs = prevLocalClimbs.map(c => 
            c.id === tempId ? { ...fullyMappedSavedClimb, sessionId: currentSession!.id } : c // currentSession is checked not null
          );
          setCurrentSession(prevSession => {
            if (!prevSession) return null;
            return { ...prevSession, climbs: updatedLocalClimbs };
          });
          return updatedLocalClimbs;
        });
      } else if (!savedDbClimb) {
        console.warn("[addClimb] addClimb mutation returned no data (savedDbClimb is falsy). Optimistic update might be out of sync for ID."); // DEBUG
      } else if (savedDbClimb && savedDbClimb.id === tempId) {
        console.warn("[addClimb] DB saved climb ID is the same as temporary ID. This might indicate an issue if DB should generate new IDs."); // DEBUG
      }

      toast({ title: "Climb Added", description: `${climbData.name} added to session.` });
    } catch (err) {
      console.error("[addClimb] Error caught while adding climb to DB:", err); // DEBUG
      const message = err instanceof Error ? err.message : "Failed to save climb.";
      setError(message);
      toast({ title: "Save Climb Failed", description: message, variant: "destructive" });
      setClimbs(prevLocalClimbs => {
        const updatedLocalClimbs = prevLocalClimbs.filter(c => c.id !== tempId);
        setCurrentSession(prevSession => {
          if (!prevSession) return null;
          return { ...prevSession, climbs: updatedLocalClimbs };
        });
        return updatedLocalClimbs;
      });
    } finally {
      setIsAddingClimb(false);
    }
  }, [currentSession, user, toast, setClimbs, addDbClimbMutationAsync, mapLocalClimbToNewClimbData, mapDbClimbToLocalClimb]);

  const updateClimb = useCallback(async (
    climbId: string,
    updates: Partial<Omit<LocalClimb, 'id' | 'sessionId' | 'timestamp'>>
  ) => {
    if (!currentSession || !user) {
      toast({ title: "Error", description: "No active session or user not authenticated", variant: "destructive" });
      return;
    }
    if (!climbs.find(c => c.id === climbId)) {
      toast({ title: "Error", description: "Climb not found in current session.", variant: "destructive" });
      return;
    }

    const originalClimbs = [...climbs]; // Shallow copy for potential rollback

    // Optimistic UI update
    const updatedOptimisticClimbs = climbs.map(c =>
      c.id === climbId ? { ...c, ...updates, timestamp: new Date() } : c
    );
    setClimbs(updatedOptimisticClimbs);
    setCurrentSession(prev => prev ? { ...prev, climbs: updatedOptimisticClimbs } : null);
    setIsUpdatingClimb(true);
    setError(null);

    // Map LocalClimb updates to UpdateClimbData for the DB
    const { tickType, ...restOfUpdates } = updates; // Removed 'media' from destructuring
    const dbUpdatePayload: UpdateClimbData = { ...restOfUpdates };
    if (tickType !== undefined) {
      dbUpdatePayload.send_type = tickType;
    }
    // Removed media_urls handling as 'media' is not on LocalClimb and 'media_urls' not on Climb/UpdateClimbData based on current info

    // Ensure no undefined values are sent if the DB schema doesn't allow it for specific fields
    Object.keys(dbUpdatePayload).forEach(key => {
        if (dbUpdatePayload[key as keyof UpdateClimbData] === undefined) {
            delete dbUpdatePayload[key as keyof UpdateClimbData];
        }
    });


    updateDbClimbMutation( // This is the synchronous .mutate()
      { id: climbId, updates: dbUpdatePayload },
      {
        onSuccess: (savedDbClimb) => { // savedDbClimb is the result from the mutationFn in useClimbs
          const fullyMappedSavedClimb = mapDbClimbToLocalClimb(savedDbClimb);
          
          const finalClimbs = originalClimbs.map(c => 
            c.id === climbId ? { ...fullyMappedSavedClimb, sessionId: currentSession!.id } : c
          );
          setClimbs(finalClimbs);
          setCurrentSession(prevSess => {
            if (!prevSess) return null;
            return {...prevSess, climbs: finalClimbs};
          });

          toast({ title: "Climb Updated", description: `${fullyMappedSavedClimb.name || 'Climb'} updated successfully.` });
          setIsUpdatingClimb(false);
        },
        onError: (error) => {
          setClimbs(originalClimbs); // Rollback optimistic update
          setCurrentSession(prev => prev ? { ...prev, climbs: originalClimbs } : null);
          
          const message = error instanceof Error ? error.message : "Failed to update climb.";
          setError(message);
          toast({ title: "Update Failed", description: message, variant: "destructive"});
          console.error("[updateClimb] Error caught while updating climb in DB:", error);
          setIsUpdatingClimb(false);
        },
      }
    );
  }, [currentSession, user, climbs, toast, setClimbs, updateDbClimbMutation, mapDbClimbToLocalClimb, setIsUpdatingClimb, setError]);

  const deleteClimb = useCallback(async (climbId: string) => {
    if (!currentSession || !user) { 
      toast({ title: "Error", description: "No active session or user not authenticated", variant: "destructive" });
      return;
    }

    const climbToDelete = climbs.find(c => c.id === climbId);
    if (!climbToDelete) {
      toast({ title: "Error", description: "Climb not found to delete.", variant: "destructive" });
      return;
    }

    const originalClimbs = [...climbs];

    // Optimistic UI update
    const updatedOptimisticClimbs = climbs.filter(c => c.id !== climbId);
    setClimbs(updatedOptimisticClimbs);
    setCurrentSession(prev => prev ? { ...prev, climbs: updatedOptimisticClimbs } : null);
    setIsDeletingClimb(true);
    setError(null);

    try {
      await deleteDbClimbMutationAsync(climbId); 
      toast({ title: "Climb Deleted", description: `${climbToDelete.name || 'Climb'} has been deleted.` });
      // onSuccess toast from useClimbs might also fire, this one is more specific to session management
    } catch (error) {
      setClimbs(originalClimbs); // Rollback optimistic update
      setCurrentSession(prev => prev ? { ...prev, climbs: originalClimbs } : null);

      const message = error instanceof Error ? error.message : "Failed to delete climb.";
      setError(message);
      toast({ title: "Delete Failed", description: message, variant: "destructive"});
      console.error("[deleteClimb] Error caught while deleting climb from DB:", error);
    } finally {
      setIsDeletingClimb(false);
    }
  }, [currentSession, user, climbs, toast, setClimbs, deleteDbClimbMutationAsync, setIsDeletingClimb, setError]);

  return {
    currentSession,
    sessions: dbSessions,
    climbs,
    sessionTime,
    startSession,
    pauseSession,
    resumeSession,
    resumeEndedSession,
    endSession,
    addClimb,
    updateClimb, 
    deleteClimb, 
    isStartingSession,
    isEndingSession,
    isAddingClimb,
    isUpdatingClimb,
    isDeletingClimb,
    error,
  };
};
