
import { Department } from '../types';

export const getDepartments = (
  search: string,
  college_id: number
): Promise<Department[]> => {
    console.log('👉 GET /web/fetchdepartments', { search, college_id });
  const params = new URLSearchParams();
  params.append('college_id', college_id.toString());
  if (search) params.append('search', search);
    console.log('👉 params.tostring() : ', params.toString());
  return fetch(`/web/fetchdepartments?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
    .then(async (resp) => {
      const result = await resp.json();
      console.log('👉 resp.json() : ', result);
      if (!Array.isArray(result.departments)) {
        console.error('Backend error:', result.message || 'Invalid response');
        return [];
      }
      return result.departments as Department[];
    })
    .catch((err) => {
      console.error('Failed to fetch departments:', err);
      return [];
    });
};

export const addDepartment = async (
  dept_code: string,
  name: string,
  college_id: number
): Promise<Department> => {
  const res = await fetch(`/web/adddepartment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dept_code, name, college_id }),
  });
  if (!res.ok) throw new Error('Could not add department');
  const { department } = await res.json();
  return department;
};

export const updateDepartment = async (
  id: number,
  dept_code: string,
  name: string
): Promise<void> => {
  const res = await fetch(`/web/editdepartment/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dept_code, name }),
  });
  if (!res.ok) throw new Error('Could not update department');
};

export const deleteDepartment = async (id: number): Promise<void> => {
  const res = await fetch(`/web/deletedepartment/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Could not delete department');
};
