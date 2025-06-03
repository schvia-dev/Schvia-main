import { Admin } from '../types'; // ✅ Import Admin type

export const fetchDashboardStats = async (user: Admin | null) => {
  if (!user) return null; // Handle null case early

  try {
    const response = await fetch('/web/dashboardstats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: user.role,
        college_id: user.college_id,
        department_id: user.department_id,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch stats.');

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return null;
  }
};
