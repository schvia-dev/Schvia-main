// src/constants/fetchTimetableFilters.ts

import { Department, Section } from '../types';

const BASE = '/web';

export interface Option {
  value: string;
  label: string;
}

/**
 * 1) Departments for a college
 */
export async function fetchDepartmentOptions(
  college_id: number
): Promise<Option[]> {
  const res = await fetch(`${BASE}/fetchdepartments?college_id=${college_id}`);
  if (!res.ok) throw new Error('Could not load departments');
  const { departments }: { departments: Department[] } = await res.json();
  return departments.map(d => ({
    value: String(d.id),
    label: d.name
  }));
}

/**
 * 2) Sections for a college, optionally filtered to one department
 */
export async function fetchSectionOptions(
  college_id: number,
  department_id?: number
): Promise<Option[]> {
  const res = await fetch(`${BASE}/fetchsections?college_id=${college_id}`);
  if (!res.ok) throw new Error('Could not load sections');
  const { sections }: { sections: Section[] } = await res.json();

  // if you passed in a department_id, filter on the client side
  const filtered = department_id
    ? sections.filter(s => s.department_id === department_id)
    : sections;

  return filtered.map(s => ({
    value: String(s.id),
    label: `${s.name} (Batch ${s.batch_year})`
  }));
}

/**
 * 3) Semesters 1–8
 */
export function getSemesterOptions(): Option[] {
  return Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`
  }));
}
