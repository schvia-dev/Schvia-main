// src/constants/fetchFacultyDetails.ts
import { Faculty } from '../types';
const BASE = '/web';

/**
 * Fetch list of faculties for a college, with optional search and department filters
 */
export const getFaculties = async (
  college_id: number,
  search = '',
  dept = ''
): Promise<Faculty[]> => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  if (search) params.set('search', search);
  if (dept) params.set('dept', dept);

  const res = await fetch(`${BASE}/fetchfaculties?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch faculties');
  const { faculties } = await res.json();
  return faculties;
};

/**
 * Add a new faculty
 */
export const addFaculty = async (
  id: string,
  faculty_name: string,
  faculty_mail: string,
  department_id: number,
  joining_year: number,
  designation: string
): Promise<Faculty> => {
  const res = await fetch(`${BASE}/addfaculty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, faculty_name, faculty_mail, department_id, joining_year, designation })
  });
  if (!res.ok) throw new Error('Failed to add faculty');
  const { faculty } = await res.json();
  return faculty;
};

/**
 * Update an existing faculty
 */
export const updateFaculty = async (
  id: string,
  faculty_name: string,
  faculty_mail: string,
  department_id: number,
  joining_year: number,
  designation: string
): Promise<Faculty> => {
  const res = await fetch(`${BASE}/editfaculty/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ faculty_name, faculty_mail, department_id, joining_year, designation })
  });
  if (!res.ok) throw new Error('Failed to update faculty');
  const { faculty } = await res.json();
  return faculty;
};

/**
 * Delete a faculty by ID
 */
export const deleteFaculty = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE}/deletefaculty/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete faculty');
};
