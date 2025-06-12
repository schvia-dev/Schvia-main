// src/api/fetchDepartmentAdmins.ts

export interface DepartmentAdmin {
  id: number;
  name: string;
  email: string;
  department_id: number;
  department_name: string;
  role: 'department' | 'class';
  contact_number: string;
  created_at: string;
}

const BASE = '/web';

export async function fetchDepartmentAdmins(
  collegeId: number
): Promise<DepartmentAdmin[]> {
  const res = await fetch(
    `${BASE}/fetchDepartmentAdmins?college_id=${collegeId}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!res.ok) {
    throw new Error('Failed to fetch department admins');
  }
  const { admins } = await res.json();
  return admins as DepartmentAdmin[];
}

export async function addDepartmentAdmin(payload: {
  name: string;
  email: string;
  password: string;
  college_id: number;
  department_id: number;
}): Promise<DepartmentAdmin> {
  const res = await fetch(`${BASE}/addDepartmentAdmin`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to add admin');
  }
  const { admin } = await res.json();
  return admin as DepartmentAdmin;
}

export async function editDepartmentAdmin(
  id: number,
  payload: {
    name: string;
    email: string;
    department_id: number;
    password?: string;
  }
): Promise<DepartmentAdmin> {
  const res = await fetch(`${BASE}/editDepartmentAdmin/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to update admin');
  }
  const { admin } = await res.json();
  return admin as DepartmentAdmin;
}

export async function deleteDepartmentAdmin(id: number): Promise<void> {
  const res = await fetch(`${BASE}/deleteDepartmentAdmin/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to delete admin');
  }
}