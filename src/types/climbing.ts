
export interface Climb {
  id: string;
  sessionId?: string;
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
  location: string;
  climbingType: 'sport' | 'trad' | 'boulder' | 'toprope' | 'multipitch';
  breaks: number;
  totalBreakTime: number;
  climbs: Climb[];
  isActive: boolean;
  notes?: string;
}
