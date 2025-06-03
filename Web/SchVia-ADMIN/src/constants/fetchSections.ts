// src/constants/fetchSections.ts
import { Section } from '../types';

const BASE = '/web';

export const getSections = async (
  college_id: number,
  search = '',
  department = '',
  batch = ''
): Promise<Section[]> => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  if (search) params.set('search', search);
  if (department) params.set('dept', department);
  if (batch) params.set('batch', batch);

  const res = await fetch(`${BASE}/fetchbatches?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch Sections Error:', text);
    throw new Error(text || 'Could not fetch sections');
  }
  const { batches } = await res.json();
  return batches.map((b: any) => ({
    id: b.id,
    section_code: b.batch_code,
    name: b.name || b.batch_code,
    department_id: b.department_id,
    department_name: b.department_name || '',
    batch_year: b.batch_year,
    students_count: b.students_count || 0,
  }));
};

export const addSection = async (
  section_code: string,
  name: string,
  department_id: number,
  batch_year: number
): Promise<Section> => {
  const res = await fetch(`${BASE}/addbatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batch_code: section_code,
      name,
      batch_year,
      current_year: '1st',
      department_id,
      room_number: 'N/A',
      faculty_incharge: null,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Add Section Error:', text);
    if (text.includes('A batch with this code, year, and department already exists')) {
      throw new Error('A batch with this code, year, and department already exists.');
    }
    throw new Error(text || 'Could not add section');
  }
  const { batch } = await res.json();
  return {
    id: batch.id,
    section_code: batch.batch_code,
    name: batch.name,
    department_id: batch.department_id,
    batch_year: batch.batch_year,
    students_count: batch.students_count || 0,
    department_name: batch.department_name || '',
  };
};

export const updateSection = async (
  id: number,
  section_code: string,
  name: string,
  department_id: number,
  batch_year: number
): Promise<Section> => {
  const res = await fetch(`${BASE}/editbatch/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batch_code: section_code,
      name,
      batch_year,
      current_year: '1st',
      department_id,
      room_number: 'N/A',
      faculty_incharge: null,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Update Section Error:', text);
    if (text.includes('A batch with this code, year, and department already exists')) {
      throw new Error('A batch with this code, year, and department already exists.');
    }
    if (text.includes('Batch not found')) {
      throw new Error('The batch could not be found.');
    }
    if (text.includes('Invalid column reference')) {
      throw new Error('Database configuration error. Please contact support.');
    }
    throw new Error(text || 'Could not update section');
  }
  const { batch } = await res.json();
  return {
    id: batch.id,
    section_code: batch.batch_code,
    name: batch.name,
    department_id: batch.department_id,
    batch_year: batch.batch_year, // Fixed: was batch.year
    students_count: batch.students_count || 0,
    department_name: batch.department_name || '',
  };
};

export const deleteSection = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE}/deletebatch/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Delete Section Error:', text);
    throw new Error(text || 'Could not delete section');
  }
};