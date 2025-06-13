import { Subject } from '../types';
const BASE = '/web';

export const getSubjects = async (
  college_id: number,
  search = '',
  dept = '',
  department_id?: number
): Promise<Subject[]> => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  if (search) params.set('search', search);
  if (dept) params.set('dept', dept);
  if (department_id) params.set('department_id', String(department_id));

  const res = await fetch(`${BASE}/fetchsubjects?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch subjects');
  const { subjects } = await res.json();
  return subjects;
};

export const addSubject = async (
  college_id: number,
  subject_code: string,
  name: string,
  department_id: number,
  credits: number
): Promise<Subject> => {
  const res = await fetch('/web/addsubject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      college_id,
      subject_code,
      name,
      department_id,
      credits,
    }),
  });

  if (!res.ok) throw new Error('Failed to add subject');
  const { subject } = await res.json();
  return subject;
};

export const updateSubject = async (
  id: number,
  college_id: number,
  subject: {
    subject_code: string;
    name: string;
    department_id: number;
    credits: number;
  }
): Promise<Subject> => {
  const res = await fetch(`/web/editsubject/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ college_id, ...subject }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update subject');
  }
  const { subject: updatedSubject } = await res.json();
  return updatedSubject;
};

export const deleteSubject = async (
  id: number,
  college_id: number,
  department_id?: number
) => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  if (department_id) params.set('department_id', String(department_id));

  const res = await fetch(`${BASE}/deletesubject/${id}?${params.toString()}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete subject');
};