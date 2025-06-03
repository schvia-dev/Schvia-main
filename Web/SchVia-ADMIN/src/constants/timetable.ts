// src/constants/timetable.ts

export interface Period {
  id: number;
  name: string;
  time: string;
}

export interface Entry {
  id:          number;
  weekday:     string;
  period_id:   number;
  subject_id:  number;
  faculty_id:  string;    // ← string, not number
  subject:     string;
  faculty:     string;
}

const BASE = '/web';

export async function createTimetable(
  sectionId: number,
  semesterNo: number,
  times: string[]
) {
  const res = await fetch(`${BASE}/createtimetable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section_id: sectionId, semester_no: semesterNo, times })
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

export async function fetchPeriods(sectionId: number): Promise<Period[]> {
  const res = await fetch(`${BASE}/periods?section_id=${sectionId}`);
  if (!res.ok) throw new Error('Could not load periods');
  return (await res.json()).periods;
}

export async function fetchEntries(
  sectionId: number,
  semesterNo: number
): Promise<Entry[]> {
  const res = await fetch(
    `${BASE}/timetableentries?section_id=${sectionId}&semester_no=${semesterNo}`
  );
  if (!res.ok) throw new Error('Could not load timetable entries');
  return (await res.json()).entries;
}

export async function saveEntry(e: {
  id?: number;
  section_id: number;
  weekday: string;
  period_id: number;
  subject_id: number;
  faculty_id: string;   // ← string, not number
  semester_no: number;
}) {
  const res = await fetch(`${BASE}/timetableentry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(e)
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

export async function deleteEntry(id: number) {
  const res = await fetch(`${BASE}/timetableentry/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}
