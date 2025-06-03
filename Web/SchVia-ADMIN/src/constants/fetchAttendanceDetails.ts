  // src/constants/fetchAttendanceDetails.ts
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

  interface FetchParams {
    college_id: number;
    department_id?: string;
    section_id?:    string;
    subject_id?:    string;
    search?:        string;
  }

  const BASE = '/web';

  export const getAttendanceRecords = async (
    params: FetchParams
  ): Promise<AttendanceRecord[] | null> => {
    try {
      const qs = new URLSearchParams();
      qs.set('college_id', String(params.college_id));
      if (params.department_id) qs.set('department_id', params.department_id);
      if (params.section_id)    qs.set('section_id',    params.section_id);
      if (params.subject_id)    qs.set('subject_id',    params.subject_id);
      if (params.search)        qs.set('search',        params.search);

      const response = await fetch(`${BASE}/fetchattendance?${qs.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attendance records.');
      const data = await response.json();
      return data.records as AttendanceRecord[];
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return null;
    }
  };
