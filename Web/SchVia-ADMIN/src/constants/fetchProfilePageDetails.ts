// src/api/fetchProfilePageDetails.ts

export interface AdminProfile {
  id: number;
  username: string;
  gmail: string; 
  role: 'super' | 'college' | 'department';
  super_user_id: number | null;
  super_full_name: string | null;
  college_id: number | null;
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

  // 👇 pull out the JSON and log it
  const data = await res.json();
  console.log('fetchAdminProfile payload:', data);

  // your backend should be returning { admin: { … } }
  if (!data.admin) {
    throw new Error('Unexpected payload shape — `admin` key missing');
  }

  return data.admin as AdminProfile;
}

/**
 * Update basic profile fields (e.g. username).
 */
export async function updateProfileDetails(
  id: number,
  username: string,
  gmail: string
): Promise<void> {
  const res = await fetch(`${BASE}/updateAdminProfile`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, username, gmail }),
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
    body: JSON.stringify({ id,currentPassword, newPassword }),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Failed to change password');
  }
}
