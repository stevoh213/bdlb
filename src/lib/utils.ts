import { NewClimbData } from "@/services/climbingService";
import { Climb, ClimbingSession, LocalClimb, Session } from "@/types/climbing";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A";
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

export const formatTime = (date: Date | string | undefined): string => {
  if (!date) return "N/A";
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Assuming Session type might be defined elsewhere or passed with startTime/endTime
interface SessionLike {
  startTime: Date | string;
  endTime?: Date | string | null;
}

export const getSessionDuration = (startTimeInput: Date | string, endTimeInput?: Date | string | null): string => {
  if (!startTimeInput) return "N/A";
  
  const start = new Date(startTimeInput);
  // Check if startDate is valid
  if (isNaN(start.getTime())) {
    // console.error("Invalid start time provided to getSessionDuration:", startTimeInput);
    return "N/A"; 
  }

  // Determine the end date; default to now if no valid endTimeInput is provided or if it results in an invalid date
  let end: Date;
  if (endTimeInput) {
    const potentialEnd = new Date(endTimeInput);
    if (!isNaN(potentialEnd.getTime())) {
      end = potentialEnd;
    } else {
      // console.warn("Invalid end time provided, defaulting to current time for duration calculation:", endTimeInput);
      end = new Date(); // Fallback to now if endTimeInput is invalid
    }
  } else {
    end = new Date(); // Default to now if no endTimeInput
  }
  
  const diffMs = end.getTime() - start.getTime();
  
  // Additional check: if end time is before start time (e.g. from bad data), diffMs will be negative.
  if (diffMs < 0) {
    // console.warn("End time is before start time in getSessionDuration.");
    return "N/A"; 
  }

  const diffMins = Math.round(diffMs / 60000);
  
  // If diffMins is NaN (should be caught by start.getTime() check, but as a safeguard)
  if (isNaN(diffMins)) {
    return "N/A";
  }
  
  if (diffMins < 60) return `${diffMins}min`; // Combined with h m, so just min
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}min`; // Changed m to min for consistency
};

// Utility to safely parse dates in session objects (especially from localStorage)
export const parseSessionDates = <T extends { climbs?: Partial<Pick<LocalClimb, 'timestamp'>>[] }>(session: T): T => {
  if (session.climbs) {
    session.climbs = session.climbs.map(climb => {
      if (climb && typeof climb.timestamp === 'string') {
        return {
          ...climb,
          timestamp: new Date(climb.timestamp),
        };
      }
      return climb;
    });
  }
  return session;
};

// New function to map DB Climb to LocalClimb
export const mapDbClimbToLocalClimb = (climb: Climb): LocalClimb => {
  let tickType: LocalClimb['tickType'] = 'attempt'; // Default value

  switch (climb.send_type) {
    case 'send':
      tickType = 'send';
      break;
    case 'attempt':
      tickType = 'attempt';
      break;
    case 'flash':
      tickType = 'flash';
      break;
    case 'onsight':
      tickType = 'onsight';
      break;
    // 'project' in Climb is not directly mapped to LocalClimb['tickType']
    // It could be considered an 'attempt' or handled differently if needed.
    case 'project':
      tickType = 'attempt'; // Or handle as a specific case if LocalClimb supports it
      break;
    default:
      // This case handles if dbClimb.send_type is undefined or an unexpected value
      // console.warn(`Unknown send_type '${climb.send_type}' for climb ${climb.id}, defaulting to 'attempt'.`);
      tickType = 'attempt';
      break;
  }

  return {
    id: climb.id,
    name: climb.name,
    grade: climb.grade,
    tickType: tickType,
    attempts: climb.attempts || undefined, // Ensure 0 attempts is not treated as undefined by ||
    timestamp: new Date(climb.date),
    sessionId: climb.session_id,
    height: climb.height,
    // timeOnWall: climb.time_on_wall, // Assuming time_on_wall needs mapping if present
    effort: climb.effort,
    notes: climb.notes,
    physicalSkills: climb.physical_skills,
    technicalSkills: climb.technical_skills,
  };
};

// Updated function to map LocalClimb to NewClimbData for adding climbs
export const mapLocalClimbToNewClimbData = (
  localClimb: Partial<LocalClimb> & Pick<LocalClimb, 'timestamp'>, // Ensure timestamp for date, allow other fields to be partial
  climbingType: Climb['type'],
  climbLocation: string
): NewClimbData => {
  let sendType: Climb['send_type'] = 'attempt';
  switch (localClimb.tickType) {
    case 'send':
      sendType = 'send';
      break;
    case 'attempt':
      sendType = 'attempt';
      break;
    case 'flash':
      sendType = 'flash';
      break;
    case 'onsight':
      sendType = 'onsight';
      break;
  }

  const newClimbData: NewClimbData = {
    name: localClimb.name || 'Unnamed Climb',
    grade: localClimb.grade || 'Unknown Grade',
    type: climbingType,
    location: climbLocation,
    send_type: sendType,
    date: localClimb.timestamp.toISOString(), // timestamp is now guaranteed by Pick
    attempts: localClimb.attempts === undefined || localClimb.attempts === null ? 1 : localClimb.attempts, // Ensure attempts is at least 1 if not set
    notes: localClimb.notes,
    height: localClimb.height,
    effort: localClimb.effort,
    physical_skills: localClimb.physicalSkills,
    technical_skills: localClimb.technicalSkills,
    // session_id is typically added by the service or the hook calling the service
  };
  return newClimbData;
};

export const mapDbSessionToLocalSession = (dbSession: ClimbingSession): Session => {
  const startTime = new Date(dbSession.date);
  let endTime: Date | undefined = undefined;

  if (dbSession.duration) {
    // Assuming dbSession.duration is in minutes
    endTime = new Date(startTime.getTime() + dbSession.duration * 60000);
  }

  return {
    id: dbSession.id,
    location: dbSession.location,
    climbingType: dbSession.default_climb_type || 'sport', // Default to 'sport'
    gradeSystem: dbSession.gradeSystem,
    notes: dbSession.notes,
    startTime: startTime,
    endTime: endTime,
    climbs: [], // Initialize with empty climbs as per current hook logic
    isActive: false, // Default value as per current hook logic
    breaks: 0, // Default value
    totalBreakTime: 0, // Default value
    aiAnalysis: undefined, // Default value
  };
};

// Add this new utility function
export const mapLocalSessionUpdatesToDbFormat = (updates: Partial<Session>): Partial<ClimbingSession> => {
  const dbUpdates: Partial<ClimbingSession> = {};

  if (updates.location !== undefined) {
    dbUpdates.location = updates.location;
  }
  if (updates.notes !== undefined) {
    dbUpdates.notes = updates.notes;
  }
  if (updates.aiAnalysis !== undefined) {
    dbUpdates.ai_analysis = updates.aiAnalysis;
  }
  if (updates.climbingType !== undefined) {
    dbUpdates.default_climb_type = updates.climbingType;
  }
  if (updates.gradeSystem !== undefined) {
    dbUpdates.gradeSystem = updates.gradeSystem;
  }
  // Add other relevant Session fields that might be updated and need mapping
  // For example, if sessionType, locationType, mood, performanceRating, fatigueLevel, etc., become editable.

  return dbUpdates;
};
