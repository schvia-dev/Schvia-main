import { Faculty } from '../types';
const BASE = '/web';

/**
 * Fetch a single faculty by ID
 */
export const fetchFaculty = async (
  id: string,
  college_id: number,
  role: 'college' | 'department' | 'class',
  admin_department_id: number | null
): Promise<Faculty> => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  params.set('role', role);
  if (admin_department_id) params.set('admin_department_id', String(admin_department_id));

  const res = await fetch(`${BASE}/fetchfaculty/${encodeURIComponent(id)}?${params.toString()}`);
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to fetch faculty');
  }
  const { faculty } = await res.json();
  return faculty;
};

/**
 * Fetch list of faculties for a college, with optional search and department filters
 */
export const getFaculties = async (
  college_id: number,
  role: 'college' | 'department' | 'class',
  department_id: number | null,
  search = '',
  dept = ''
): Promise<Faculty[]> => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  params.set('role', role);
  if (department_id) params.set('department_id', String(department_id));
  if (search) params.set('search', search);
  if (dept) params.set('dept', dept);

  const res = await fetch(`${BASE}/fetchfaculties?${params.toString()}`);
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to fetch faculties');
  }
  const { faculties } = await res.json();
  return faculties;
};

/**
 * Add a new faculty
 */
export const addFaculty = async (
  id: string,
  name: string,
  email: string,
  department_id: number,
  phone: string,
  dob: string,
  qualification: string,
  password: string,
  role: 'college' | 'department' | 'class',
  admin_department_id: number | null
): Promise<Faculty> => {
  const res = await fetch(`${BASE}/addfaculty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, email, department_id, phone, dob, qualification, password, role, admin_department_id })
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to add faculty');
  }
  const { faculty } = await res.json();
  return faculty;
};

/**
 * Update an existing faculty
 */
export const updateFaculty = async (
  id: string,
  name: string,
  email: string,
  department_id: number,
  phone: string,
  dob: string,
  qualification: string,
  role: 'college' | 'department' | 'class',
  admin_department_id: number | null
): Promise<Faculty> => {
  const res = await fetch(`${BASE}/editfaculty/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, department_id, phone, dob, qualification, role, admin_department_id })
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to update faculty');
  }
  const { faculty } = await res.json();
  return faculty;
};

/**
 * Delete a faculty by ID
 */
export const deleteFaculty = async (
  id: string,
  role: 'college' | 'department' | 'class',
  admin_department_id: number | null
): Promise<void> => {
  const params = new URLSearchParams();
  params.set('role', role);
  if (admin_department_id) params.set('admin_department_id', String(admin_department_id));
  const res = await fetch(`${BASE}/deletefaculty/${encodeURIComponent(id)}?${params.toString()}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to delete faculty');
  }
};