
export interface CSVRecord {
  [key: string]: string;
  climb_name: string;
  climb_grade: string;
  climb_type: string;
  send_type: string;
  attempts: string;
  date: string;
  location: string;
  session_notes?: string;
  climb_notes?: string;
  grade_system?: string;
  climbing_type?: string;
  duration?: string;
}
