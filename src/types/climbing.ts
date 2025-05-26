
export interface Climb {
  id: string;
  name: string;
  grade: string;
  type: 'sport' | 'trad' | 'boulder' | 'toprope' | 'multipitch';
  send_type: 'send' | 'attempt' | 'flash' | 'onsight';
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
}

export interface ClimbingSession {
  id: string;
  date: string;
  duration: number;
  location: string;
  location_type?: 'indoor' | 'outdoor';
  default_climb_type?: 'sport' | 'trad' | 'boulder' | 'toprope' | 'multipitch';
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: string;
  status: 'active' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'hard';
  target_value?: number;
  current_value?: number;
  target_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  tags?: string[];
  unit?: string;
  target_grade?: string;
  target_climb_type?: string;
  target_location?: string;
}
