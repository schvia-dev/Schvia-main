import { Student } from '../types';

const BASE = '/web';

export async function getStudents(
  collegeId: number,
  user: { role: string; department_id: number | null; token: string | null },
  search: string,
  dept: string,
  batch: string
): Promise<Student[]> {
  const params = new URLSearchParams({ college_id: String(collegeId) });
  if (search) params.append('search', search);
  if (dept) params.append('dept', dept);
  if (batch) params.append('batch', batch);

  const headers: HeadersInit = {};
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/fetchstudents?${params}`, { headers });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to fetch students');
  }
  const { students } = await res.json();
  return students as Student[];
}

export async function addStudent(
  user: { token: string | null },
  id: string,
  name: string,
  email: string,
  batch_id: number,
  current_year: string,
  password: string,
  phone: string,
  address: string,
  pan_number: string,
  aadhar_number: string,
  father_phone: string,
  mother_phone: string
): Promise<Student> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/addstudent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id,
      name,
      email,
      batch_id,
      current_year,
      password,
      phone,
      address,
      pan_number,
      aadhar_number,
      father_phone,
      mother_phone
    })
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to add student');
  }
  const { student } = await res.json();
  return student as Student;
}

export async function updateStudent(
  user: { token: string | null },
  id: string,
  name: string,
  email: string,
  batch_id: number,
  current_year: string,
  phone: string,
  address: string,
  pan_number: string,
  aadhar_number: string,
  father_phone: string,
  mother_phone: string
): Promise<Student> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/editstudent/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name,
      email,
      batch_id,
      current_year,
      phone,
      address,
      pan_number,
      aadhar_number,
      father_phone,
      mother_phone
    })
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to update student');
  }
  const { student } = await res.json();
  return student as Student;
}

export async function deleteStudent(user: { token: string | null }, id: string): Promise<void> {
  const headers: HeadersInit = {};
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/deletestudent/${id}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to delete student');
  }
}