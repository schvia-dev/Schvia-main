// src/constants/fetchSectionsFilters.ts

export const fetchDepartmentOptions = async (
  college_id: number
): Promise<{ value: string; label: string }[]> => {
  const res = await fetch(`/web/fetchdepartments?college_id=${college_id}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Could not fetch departments');
  }
  const { departments } = await res.json();
  return departments.map((d: any) => ({
    value: String(d.id),
    label: d.name,
  }));
};

export const fetchBatchYearOptions = async (
  college_id: number
): Promise<{ value: string; label: string }[]> => {
  const res = await fetch(`/web/fetchbatchyears?college_id=${college_id}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Could not fetch batch years');
  }
  const { batchYears } = await res.json();
  return batchYears.map((y: number) => ({
    value: String(y),
    label: String(y),
  }));
};
