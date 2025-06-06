export interface Climb {
  id: string;
  name: string;
  grade: string;
  type: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';
  send_type: 'send' | 'attempt' | 'flash' | 'onsight' | 'project';
  date: string;
  location: string;
  attempts: number;
  rating?: number;
  notes?: string;
  duration?: number;
  elevation_gain?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  color?: string;
  gym?: string;
  country?: string;
  skills?: string[];
  stiffness?: number;
  physical_skills?: string[];
  technical_skills?: string[];
}

export interface ClimbingSession {
  id: string;
  date: string;
  duration: number;
  location: string;
  location_type?: 'indoor' | 'outdoor';
  default_climb_type?: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';
  grade_system?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Local session interface for the frontend (updated to match database types)
export interface Session {
  id: string;
  location: string;
  climbingType: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';
  gradeSystem?: string;
  notes?: string;
  startTime: Date;
  endTime?: Date;
  climbs: LocalClimb[];
  isActive: boolean;
  breaks: number;
  totalBreakTime: number;
  aiAnalysis?: {
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    progressInsights: string;
    generatedAt: Date;
  };
}

// Local climb interface for the frontend
export interface LocalClimb {
  id: string;
  name: string;
  grade: string;
  tickType: 'send' | 'attempt' | 'flash' | 'onsight';
  attempts?: number;
  timestamp: Date;
  sessionId?: string;
  height?: number;
  timeOnWall?: number;
  effort?: number;
  notes?: string;
  physicalSkills?: string[];
  technicalSkills?: string[];
}

