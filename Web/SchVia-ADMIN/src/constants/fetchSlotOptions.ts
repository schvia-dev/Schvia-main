// src/constants/fetchSlotOptions.ts
import { Option } from './fetchTimetableFilters';
const BASE = '/web';

/**
 * Fetch subjects for a given college, department & semester
 */
export async function fetchSubjectOptions(
  college_id: number,
  department_id: number,
  semester_no: number
): Promise<Option[]> {
  const res = await fetch(
    `${BASE}/fetchsubjects?college_id=${college_id}&dept=${department_id}&sem=${semester_no}`
  );
  if (!res.ok) throw new Error('Could not load subjects');
  const { subjects }: { subjects: { id: number; name: string }[] } = await res.json();
  return subjects.map(s => ({
    value: String(s.id),
    label: s.name
  }));
}

/**
 * Fetch faculties for a given college & department
 */
export async function fetchFacultyOptions(
  college_id: number,
  department_id: number
): Promise<Option[]> {
  const res = await fetch(
    `${BASE}/fetchfaculties?college_id=${college_id}&dept=${department_id}`
  );
  if (!res.ok) throw new Error('Could not load faculties');
  const { faculties }: { faculties: { id: string; faculty_name: string }[] } = await res.json();
  return faculties.map(f => ({
    value: f.id,
    label: f.faculty_name
  }));
}
