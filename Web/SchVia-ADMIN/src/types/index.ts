export interface Admin {
  id: number;
  name: string;
  email: string;
  contact_number: string;
  role: 'college' | 'department' | 'class';
  college_id: number;
  department_id: number | null;
  college_name: string | null;
  college_code: string | null;
  department_name: string | null;
  department_code: string | null;
  token: string | null;
}

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  contact_number: string;
  role: 'college' | 'department' | 'class';
  college_id: number;
  college_name: string | null;
  college_code: string | null;
  department_id: number | null;
  department_name: string | null;
  department_code: string | null;
}

export interface College {
  id: number;
  college_code: string;
  name: string;
}

export interface CollegeDetails {
  id: number;
  college_code: string;
  name: string;
  address: string;
  established: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  logo: string;
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

export interface Batch {
  id: number;
  batch_code: string;
  name: string;
  department_id: number;
  department_name: string;
  batch_year: number;
  students_count: number;
  current_year: '1st' | '2nd' | '3rd' | '4th';
  current_semester: number;
  room_number: string;
  faculty_incharge_name: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  batch_id: number;
  batch_name: string;
  department_id: number;
  department_name: string;
  current_year: '1st' | '2nd' | '3rd' | '4th';
  address: string;
  pan_number: string;
  aadhar_number: string;
  father_phone: string;
  mother_phone: string;
}

export interface Faculty {
  id: string;
  department_id: number;
  department_name: string;
  name: string;
  email: string;
  subjects_count: number;
  phone: string;
  dob: string | null;
  qualification: string;
}

export interface Subject {
  id: number;
  subject_code: string;
  name: string;
  department_id: number;
  department_name: string;
  credits: number;
  faculty_count: number;
}

export interface Period {
  id: number;
  batch_id: number;
  time_slot: string;
  name: string;
}

export interface TimetableEntry {
  id: number;
  batch_id: number;
  weekday: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  period_id: number;
  subject_id: number;
  semester_no: number;
  faculty_id: string;
  subject: string;
  faculty: string;
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
  batch_name: string;
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
  batches: number;
}

export interface AttendanceData {
  name: string;
  present: number;
  absent: number;
  leave: number;
}