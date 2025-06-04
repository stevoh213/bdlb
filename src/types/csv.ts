
export interface CSVRecord {
  climb_name: string;
  climb_grade: string;
  climb_type: string;
  send_type: string;
  attempts: string;
  date: string;
  location: string;
  climb_notes?: string;
  session_notes?: string;
  duration?: string;
  grade_system?: string;
  climbing_type?: string;
}
