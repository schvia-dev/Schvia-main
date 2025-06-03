// src/api/fetchDepartmentAdmins.ts

export interface DepartmentAdmin {
  id: number;
  username: string;
  gmail: string;
  department_id: number;
  department_name: string;
  created_at: string;
  last_login: string;
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
  username: string;
  gmail: string;
  password: string;
  college_id: number;
  super_user_id: number;
  department_id: number;
}): Promise<DepartmentAdmin> {
  console.log(payload);
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
    username: string;
    gmail: string;
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
