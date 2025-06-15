const BASE = '/web';

export interface Option {
  value: string;
  label: string;
}

/**
 * Fetch departments for a college
 */
export async function fetchDepartmentOptions(college_id: number): Promise<Option[]> {
  const res = await fetch(`${BASE}/fetchDepartmentOptions?college_id=${college_id}`);
  if (!res.ok) throw new Error('Could not load departments');
  const { options }: { options: { value: number; label: string }[] } = await res.json();
  return options.map(opt => ({
    value: String(opt.value), // Convert number to string
    label: opt.label,
  }));
}

/**
 * Fetch sections (batches) for a college, optionally filtered to one department
 */
export async function fetchSectionOptions(
  college_id: number,
  department_id?: number
): Promise<Option[]> {
  const params = new URLSearchParams({ college_id: college_id.toString() });
  if (department_id) {
    params.append('department_id', department_id.toString());
  }
  const res = await fetch(`${BASE}/fetchSectionOptions?${params.toString()}`);
  if (!res.ok) throw new Error('Could not load sections');
  const { options }: { options: { value: number; label: string }[] } = await res.json();
  return options.map(opt => ({
    value: String(opt.value), // Convert number to string
    label: opt.label,
  }));
}

/**
 * Fetch semesters for a batch
 */
export async function fetchSemesterOptions(batch_id: number): Promise<Option[]> {
  const res = await fetch(`${BASE}/getSemesterOptions?batch_id=${batch_id}`);
  if (!res.ok) throw new Error('Could not load semesters');
  const { options }: { options: { value: number; label: string }[] } = await res.json();
  return options.map(opt => ({
    value: String(opt.value), // Convert number to string
    label: opt.label,
  }));
}