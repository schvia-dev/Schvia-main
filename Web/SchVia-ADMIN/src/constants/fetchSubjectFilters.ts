const BASE = '/web';

export const fetchDepartmentOptions = async (college_id: number): Promise<{ value: string; label: string }[]> => {
  const res = await fetch(`${BASE}/fetchdepartments?college_id=${college_id}`);
  if (!res.ok) throw new Error('Failed to fetch departments');
  const { departments } = await res.json();
  return departments.map((d: any) => ({
    value: String(d.id),
    label: d.name,
  }));
};

export const fetchSemesterOptions = async (): Promise<{ value: string; label: string }[]> => {
  return Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
  }));
};
