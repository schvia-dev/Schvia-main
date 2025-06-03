// src/constants/fetchFacultyFilter.ts

export interface Option {
  value: string;
  label: string;
}

const BASE = '/web';

/**
 * Fetch department options for a given college
 */
export const fetchDepartmentOptions = async (
  college_id: number
): Promise<Option[]> => {
  const res = await fetch(`${BASE}/fetchdepartments?college_id=${college_id}`);
  if (!res.ok) throw new Error('Failed to fetch departments');
  const { departments } = await res.json();
  return departments.map((d: any) => ({
    value: String(d.id),
    label: d.name
  }));
};
