export interface Admin {
  id: number;
  username: string;
  password: string;
  role: 'college' | 'department';
  college_id: number | null;
  department_id: number | null;
  college_name: string | null;
  super_user_id: number;
  department_name: string | null;
  college_code: string;
  department_code: string;
  token: string | null; // Added for authentication
}

export interface College {
  id: number;
  college_code: string;
  name: string;
}

export interface CollegeDetails extends College {
  location: string;
  established: string;
  contact_email: string;
  contact_phone: string;
  website: string;
}

export interface Department {
  id: number;
  college_id: number;
  dept_code: string;
  name: string;
  batches_count: number;
  students_count: number;
  faculties_count: number;
}

export interface Section {
  id: number;
  department_id: number;
  batch_year: number;
  section_code: string;
  name: string;
  department_name: string;
  students_count: number;
}

export interface Student {
  id: string;
  name: string;
  gmail: string;
  phone: string;
  semester_no: string;
  section_id: number;
  section_name: string;
  department_id: number;
  department_name: string;
}

export interface Faculty {
  id: string;
  department_id: number;
  department_name: string;
  faculty_name: string;
  joining_year: number;
  designation: string;
  faculty_mail: string;
  subjects_count: number;
}

export interface Subject {
  id: number;
  subject_code: string;
  name: string;
  department_id: number;
  department_name: string;
  semester_no: number;
  faculty_count: number;
}

export interface Period {
  id: number;
  section_id: number;
  time_slot: string;
  name: string;
}

export interface TimetableEntry {
  id: number;
  section_id: number;
  weekday: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  period_id: number;
  subject_id: number;
  semester_no: number;
  faculty_id: string;
}

export interface AttendanceSession {
  id: number;
  timetable_id: number;
  session_date: string;
}

export interface AttendanceRecord {
  session_id: number;
  date: string;
  period_time: string;
  period_name: string;
  department: string;
  batch_year: number;
  semester_no: number;
  subject: string;
  faculty: string;
  total_students: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface AppTheme {
  mode: 'light' | 'dark';
}

export interface DashboardStats {
  students: number;
  faculties: number;
  departments?: number;
  batches?: number;
  sections: number;
}

export interface AttendanceData {
  name: string;
  present: number;
  absent: number;
  leave: number;
}