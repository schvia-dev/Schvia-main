// src/constants/fetchAttendanceFilters.ts
export interface FilterOption {
  value: string;
  label: string;
}

interface AttendanceFilters {
  departments: FilterOption[];
  sections:    FilterOption[];
  subjects:    FilterOption[];
}

const BASE = '/web';

export const getAttendanceFilters = async (
  college_id: number
): Promise<AttendanceFilters | null> => {
  try {
    const response = await fetch(
      `${BASE}/fetchattendancefilters?college_id=${college_id}`
    );
    if (!response.ok) throw new Error('Failed to fetch attendance filters.');
    const data = await response.json();
    return {
      departments: data.departments.map((d: any) => ({ value: String(d.id), label: d.name })),
      sections:    data.sections   .map((s: any) => ({ value: String(s.id), label: s.name })),
      subjects:    data.subjects   .map((s: any) => ({ value: String(s.id), label: s.name })),
    };
  } catch (error) {
    console.error('Error fetching attendance filters:', error);
    return null;
  }
};
