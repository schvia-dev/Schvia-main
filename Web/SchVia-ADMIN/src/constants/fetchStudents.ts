import { Student } from '../types';

const BASE = '/web';

/**
 * Fetch students based on college ID and optional filters.
 */
export const getStudents = async (
  college_id: number | null,
  user: { role: string; department_id: number | null; token: string | null },
  search = '',
  dept = '',
  batch = ''
): Promise<Student[]> => {
  if (!college_id) throw new Error('College ID is required');
  const params = new URLSearchParams({ college_id: String(college_id) });
  if (search) params.append('search', search);
  if (user.role === 'department' && user.department_id) {
    params.append('dept', String(user.department_id));
  } else if (dept) {
    params.append('dept', dept);
  }
  if (batch) params.append('batch', batch);

  const headers: HeadersInit = {};
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/fetchstudents?${params}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Could not fetch students');
  }
  const { students } = await res.json() as { students: Student[] };
  return students;
};

/**
 * Add a new student.
 */
export const addStudent = async (
  user: { token: string | null },
  id: string,
  name: string,
  gmail: string,
  batch_id: number,
  current_year: string,
  password: string
): Promise<Student> => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/addstudent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id, name, email: gmail, batch_id, current_year, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    if (err?.message.includes('Invalid email')) {
      throw new Error('Invalid email format.');
    }
    if (err?.message.includes('already exists')) {
      throw new Error('Student ID or email already exists.');
    }
    if (err?.message.includes('Invalid batch_id')) {
      throw new Error('Selected batch is invalid.');
    }
    if (err?.message.includes('You can only add students')) {
      throw new Error('You can only add students to your department.');
    }
    throw new Error(err?.message || 'Could not add student');
  }
  const { student } = await res.json() as { student: Student };
  return student;
};

/**
 * Update an existing student.
 */
export const updateStudent = async (
  user: { token: string | null },
  id: string,
  name: string,
  gmail: string,
  batch_id: number,
  current_year: string
): Promise<Student> => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/editstudent/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name, email: gmail, batch_id, current_year }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    if (err?.message.includes('Invalid email')) {
      throw new Error('Invalid email format.');
    }
    if (err?.message.includes('already in use')) {
      throw new Error('Email already in use.');
    }
    if (err?.message.includes('Invalid batch_id')) {
      throw new Error('Selected batch is invalid.');
    }
    if (err?.message.includes('You can only')) {
      throw new Error('You can only edit students in your department.');
    }
    throw new Error(err?.message || 'Could not update student');
  }
  const { student } = await res.json() as { student: Student };
  return student;
};

/**
 * Delete a student.
 */
export const deleteStudent = async (user: { token: string | null }, id: string): Promise<void> => {
  const headers: HeadersInit = {};
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/deletestudent/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Could not delete student');
  }
};