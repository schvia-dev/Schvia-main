import { Batch } from '../types';

const BASE = '/web';

// Helper to convert current_year to current_semester (assume first semester of the year)
const yearToSemester = (year: '1st' | '2nd' | '3rd' | '4th'): number => {
  const yearMap: Record<'1st' | '2nd' | '3rd' | '4th', number> = {
    '1st': 1, // Semester 1
    '2nd': 3, // Semester 3
    '3rd': 5, // Semester 5
    '4th': 7, // Semester 7
  };
  return yearMap[year];
};

// Helper to convert current_semester to current_year
const semesterToYear = (semester: number): '1st' | '2nd' | '3rd' | '4th' => {
  if (semester <= 2) return '1st';
  if (semester <= 4) return '2nd';
  if (semester <= 6) return '3rd';
  return '4th';
};

export const getBatches = async (
  college_id: number,
  search = '',
  department = '',
  batch = ''
): Promise<Batch[]> => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  if (search) params.set('search', search);
  if (department) params.set('dept', department);
  if (batch) params.set('batch', batch);

  const res = await fetch(`${BASE}/fetchbatches?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch Batches Error:', text);
    throw new Error(text || 'Could not fetch batches');
  }
  const { batches } = await res.json();
  return batches.map((b: any) => ({
    id: b.id,
    batch_code: b.batch_code,
    name: b.name || b.batch_code,
    department_id: b.department_id,
    department_name: b.department_name || '',
    batch_year: b.batch_year,
    students_count: b.students_count || 0,
    current_year: b.current_year,
    current_semester: yearToSemester(b.current_year),
    room_number: b.room_number || 'N/A',
    faculty_incharge_name: b.faculty_incharge_name || null,
  }));
};

export const addBatch = async (
  batch_code: string,
  name: string,
  department_id: number,
  batch_year: number,
  current_semester: number
): Promise<Batch> => {
  const current_year = semesterToYear(current_semester);
  const res = await fetch(`${BASE}/addbatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batch_code,
      name,
      batch_year,
      current_year,
      department_id,
      room_number: 'N/A',
      faculty_incharge: null,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Add Batch Error:', text);
    if (text.includes('A batch with this code, year, and department already exists')) {
      throw new Error('A batch with this code, year, and department already exists.');
    }
    if (text.includes('Invalid department_id')) {
      throw new Error('Invalid department selected.');
    }
    throw new Error(text || 'Could not add batch');
  }
  const { batch } = await res.json();
  return {
    id: batch.id,
    batch_code: batch.batch_code,
    name: batch.name,
    department_id: batch.department_id,
    department_name: batch.department_name || '',
    batch_year: batch.batch_year,
    students_count: batch.students_count || 0,
    current_year: batch.current_year,
    current_semester: yearToSemester(batch.current_year),
    room_number: batch.room_number || 'N/A',
    faculty_incharge_name: batch.faculty_incharge_name || null,
  };
};

export const updateBatch = async (
  id: number,
  batch_code: string,
  name: string,
  department_id: number,
  batch_year: number,
  current_semester: number
): Promise<Batch> => {
  const current_year = semesterToYear(current_semester);
  const res = await fetch(`${BASE}/editbatch/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batch_code,
      name,
      batch_year,
      current_year,
      department_id,
      room_number: 'N/A',
      faculty_incharge: null,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Update Batch Error:', text);
    if (text.includes('A batch with this code, year, and department already exists')) {
      throw new Error('A batch with this code, year, and department already exists.');
    }
    if (text.includes('Batch not found')) {
      throw new Error('The batch could not be found.');
    }
    if (text.includes('Invalid department_id')) {
      throw new Error('Invalid department selected.');
    }
    throw new Error(text || 'Could not update batch');
  }
  const { batch } = await res.json();
  return {
    id: batch.id,
    batch_code: batch.batch_code,
    name: batch.name,
    department_id: batch.department_id,
    department_name: batch.department_name || '',
    batch_year: batch.batch_year,
    students_count: batch.students_count || 0,
    current_year: batch.current_year,
    current_semester: yearToSemester(batch.current_year),
    room_number: batch.room_number || 'N/A',
    faculty_incharge_name: batch.faculty_incharge_name || null,
  };
};

export const deleteBatch = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE}/deletebatch/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Delete Batch Error:', text);
    if (text.includes('Batch not found')) {
      throw new Error('The batch could not be found.');
    }
    throw new Error(text || 'Could not delete batch');
  }
};

export const fetchDepartmentOptions = async (college_id: number): Promise<{ value: string; label: string }[]> => {
  const res = await fetch(`${BASE}/fetchdepartments?college_id=${college_id}`);
  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch Departments Error:', text);
    throw new Error(text || 'Could not fetch departments');
  }
  const { departments } = await res.json();
  return departments.map((d: any) => ({
    value: String(d.id),
    label: d.name,
  }));
};

export const fetchBatchYearOptions = async (college_id: number): Promise<{ value: string; label: string }[]> => {
  const res = await fetch(`${BASE}/fetchbatchyears?college_id=${college_id}`);
  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch Batch Years Error:', text);
    throw new Error(text || 'Could not fetch batch years');
  }
  const { batchYears } = await res.json();
  const currentYear = new Date().getFullYear();
  const years = new Set([
    ...batchYears,
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ]);
  return Array.from(years)
    .sort((a, b) => b - a)
    .map(year => ({
      value: String(year),
      label: String(year),
    }));
};