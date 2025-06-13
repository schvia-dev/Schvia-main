import { Department, Batch } from '../types';

const BASE = '/web';

/**
 * Fetch departments for a given college and turn them into {value, label} options.
 */
export async function fetchDepartmentOptions(
  college_id: number | null,
  user: { role: string; department_id: number | null; token: string | null }
): Promise<{ value: string; label: string }[]> {
  if (!college_id) throw new Error('College ID is required');
  const params = new URLSearchParams({ college_id: String(college_id) });
  if (user.role === 'department' && user.department_id) {
    params.append('department_id', String(user.department_id));
  }

  const headers: HeadersInit = {};
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE}/fetchdepartments?${params}`, { headers });
  if (!res.ok) throw new Error('Could not load departments');
  const { departments } = await res.json() as { departments: Department[] };
  return departments.map(d => ({
    value: String(d.id),
    label: d.name,
  }));
}

/**
 * Fetch batches (used as sections) for a given college and optional department, turn into {value, label}.
 */
export async function fetchSectionOptions(
  college_id: number | null,
  user: { role: string; department_id: number | null; token: string | null },
  department_id: string = ''
): Promise<{ value: string; label: string }[]> {
  try {
    if (!college_id) throw new Error('College ID is required');
    const params = new URLSearchParams({ college_id: String(college_id) });
    if (user.role === 'department' && user.department_id) {
      params.append('dept', String(user.department_id));
    } else if (department_id) {
      params.append('dept', department_id);
    }

    const headers: HeadersInit = {};
    if (user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    const res = await fetch(`${BASE}/fetchbatches?${params}`, { headers });
    if (!res.ok) throw new Error('Could not load sections');
    const { batches } = await res.json() as { batches: Batch[] };
    return batches.length
      ? batches.map(b => ({
          value: String(b.id),
          label: `${b.name} (${b.batch_year})`,
        }))
      : [];
  } catch (error) {
    console.error('Fetch Sections Error:', error);
    return [];
  }
}