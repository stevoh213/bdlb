import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "";
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatTime = (date: Date | string | undefined): string => {
  if (!date) return "";
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

export const getSessionDuration = (session: SessionLike | null | undefined): number => {
  if (!session || !session.endTime) return 0;
  
  const startTime = typeof session.startTime === 'string' ? new Date(session.startTime) : session.startTime;
  const endTime = typeof session.endTime === 'string' ? new Date(session.endTime) : session.endTime;

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 0;

  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60); // Duration in minutes
};

// Utility to safely parse dates in session objects (especially from localStorage)
export const parseSessionDates = <T extends { startTime: string | Date, endTime?: string | Date | null, aiAnalysis?: { generatedAt?: string | Date }, climbs?: any[] }>(session: T): T => {
  return {
    ...session,
    startTime: new Date(session.startTime),
    endTime: session.endTime ? new Date(session.endTime) : undefined,
    aiAnalysis: session.aiAnalysis?.generatedAt 
      ? { ...session.aiAnalysis, generatedAt: new Date(session.aiAnalysis.generatedAt) } 
      : session.aiAnalysis,
    climbs: session.climbs?.map(climb => ({
      ...climb,
      timestamp: climb.timestamp ? new Date(climb.timestamp) : undefined,
      // ensure other date fields in climbs are parsed if they exist
    })) || [],
  };
};
