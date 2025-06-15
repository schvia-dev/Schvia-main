import { Option } from './fetchTimetableFilters';
const BASE = '/web';

export async function fetchSubjectOptions(
  college_id: number,
  batch_id: number,
  semester_no: number
): Promise<Option[]> {
  const res = await fetch(
    `${BASE}/fetchSubjectOptions?college_id=${college_id}&batch_id=${batch_id}&semester_no=${semester_no}`
  );
  if (!res.ok) throw new Error('Could not load subjects');
  const { options }: { options: { value: number; label: string }[] } = await res.json();
  return options.map(opt => ({
    value: String(opt.value),
    label: opt.label,
  }));
}

export async function fetchFacultyOptions(
  college_id: number,
  batch_id: number,
  semester_no: number,
  subject_id?: number
): Promise<Option[]> {
  const params = new URLSearchParams({
    college_id: college_id.toString(),
    batch_id: batch_id.toString(),
    semester_no: semester_no.toString(),
  });
  if (subject_id) {
    params.append('subject_id', subject_id.toString());
  }
  const res = await fetch(`${BASE}/fetchFacultyOptions?${params.toString()}`);
  if (!res.ok) throw new Error('Could not load faculties');
  const { options }: { options: { value: string; label: string }[] } = await res.json();
  return options;
}