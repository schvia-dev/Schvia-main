// src/api/fetchProfilePageDetails.ts
export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  contact_number: string;
  role: 'college' | 'department' | 'class';
  college_id: number;
  college_name: string | null;
  college_code: string | null;
  department_id: number | null;
  department_name: string | null;
  department_code: string | null;
}

const BASE = '/web';

/**
 * Fetch the current admin's profile details.
 */
export async function fetchProfilePageDetails(id: number): Promise<AdminProfile> {
  const res = await fetch(`${BASE}/fetchAdminProfile?id=${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.statusText}`);
  }

  const data = await res.json();
  console.log('fetchAdminProfile payload:', data);

  if (!data.admin) {
    throw new Error('Unexpected payload shape — `admin` key missing');
  }

  return data.admin as AdminProfile;
}

/**
 * Update basic profile fields.
 */
export async function updateProfileDetails(
  id: number,
  name: string,
  email: string,
  contact_number?: string
): Promise<void> {
  const body: any = { id, name, email };
  if (contact_number) {
    body.contact_number = contact_number;
  }
  const res = await fetch(`${BASE}/updateAdminProfile`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to update profile');
  }
}

/**
 * Change current admin password.
 */
export async function changePassword(
  id: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch(`${BASE}/changeAdminPassword`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, currentPassword, newPassword }),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to change password');
  }
}