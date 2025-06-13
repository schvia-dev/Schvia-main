export const fetchDepartmentOptions = async (college_id: number) => {
  const res = await fetch(`/web/fetchdepartments?college_id=${college_id}`);
  if (!res.ok) throw new Error('Failed to fetch departments');
  const { departments } = await res.json();
  return departments.map((d: any) => ({
    value: String(d.id),
    label: d.name
  }));
};