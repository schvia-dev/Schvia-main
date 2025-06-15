export interface Period {
  id: number;
  name: string;
  time: string; // Format: 'HH:MM-HH:MM'
}

export interface Entry {
  id: number;
  weekday: string;
  period_id: number;
  subject_id: number;
  faculty_id: string;
  subject: string;
  faculty: string;
}

export const BASE = '/web';

export async function createTimetable(
  batch_id: number,
  semester_no: number,
  times: string[]
): Promise<void> {
  try {
    const res = await fetch(`${BASE}/createTimetable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id, semester_no, times }),
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Create Timetable Error:', error); // Debug
      throw new Error(error.message || 'Failed to create timetable');
    }
  } catch (err) {
    console.error('Create Timetable Failed:', err); // Debug
    throw err;
  }
}

export async function fetchPeriods(batch_id: number, semester_no: number): Promise<Period[]> {
  try {
    const params = new URLSearchParams({
      batch_id: batch_id.toString(),
      semester_no: semester_no.toString(),
    });
    const res = await fetch(`${BASE}/fetchPeriods?${params.toString()}`);
    if (!res.ok) {
      const error = await res.json();
      console.error('Fetch Periods Error:', error); // Debug
      throw new Error(error.message || 'Could not load periods');
    }
    const { periods } = await res.json();
    console.log('Fetched periods:', periods); // Debug
    return periods;
  } catch (err) {
    console.error('Fetch Periods Failed:', err); // Debug
    throw err;
  }
}

export async function fetchEntries(
  batch_id: number,
  semester_no: number
): Promise<Entry[]> {
  try {
    const params = new URLSearchParams({
      batch_id: batch_id.toString(),
      semester_no: semester_no.toString(),
    });
    const res = await fetch(`${BASE}/fetchEntries?${params.toString()}`);
    if (!res.ok) {
      const error = await res.json();
      console.error('Fetch Entries Error:', error); // Debug
      throw new Error(error.message || 'Could not load timetable entries');
    }
    const { entries } = await res.json();
    console.log('Fetched entries:', entries); // Debug
    return entries;
  } catch (err) {
    console.error('Fetch Entries Failed:', err); // Debug
    throw err;
  }
}

export async function saveEntry(e: {
  id?: number;
  batch_id: number;
  weekday: string;
  period_id: number;
  subject_id: number;
  faculty_id: string;
  semester_no: number;
}): Promise<void> {
  try {
    console.log('Saving entry:', e); // Debug
    const res = await fetch(`${BASE}/saveEntry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Save Entry Error:', error, { status: res.status }); // Debug
      throw new Error(error.message || 'Failed to save entry');
    }
    console.log('Entry saved successfully:', e); // Debug
  } catch (err) {
    console.error('Save Entry Failed:', err); // Debug
    throw err;
  }
}

export async function deleteEntry(id: number): Promise<void> {
  try {
    const res = await fetch(`${BASE}/deleteEntry/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const error = await res.json();
      console.error('Delete Entry Error:', error); // Debug
      throw new Error(error.message || 'Failed to delete entry');
    }
  } catch (err) {
    console.error('Delete Entry Failed:', err); // Debug
    throw err;
  }
}


export interface Timetable {
  batch_id: number;
  semester_no: number;
  department_name: string;
  batch_name: string;
}

export async function fetchTimetables(
  college_id: number,
  department_id?: number,
  batch_id?: number,
  semester_no?: number
): Promise<Timetable[]> {
  try {
    const params = new URLSearchParams({ college_id: college_id.toString() });
    if (department_id) params.append('department_id', department_id.toString());
    if (batch_id) params.append('batch_id', batch_id.toString());
    if (semester_no) params.append('semester_no', semester_no.toString());
    const url = `${BASE}/fetchTimetables?${params.toString()}`;
    console.log('Fetching timetables from:', url); // Debug
    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.json();
      console.error('Fetch Timetables Error:', error); // Debug
      throw new Error(error.message || 'Could not load timetables');
    }
    const { timetables } = await res.json();
    console.log('Fetched timetables:', timetables); // Debug
    return timetables;
  } catch (err) {
    console.error('Fetch Timetables Failed:', err); // Debug
    throw err;
  }
}

export async function deleteTimetable(batch_id: number, semester_no: number): Promise<void> {
  try {
    const res = await fetch(`${BASE}/deleteTimetable`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id, semester_no }),
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Delete Timetable Error:', error); // Debug
      throw new Error(error.message || 'Failed to delete timetable');
    }
    console.log('Timetable deleted:', { batch_id, semester_no }); // Debug
  } catch (err) {
    console.error('Delete Timetable Failed:', err); // Debug
    throw err;
  }
}