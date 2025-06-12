import { CollegeDetails } from '../types';

export const fetchCollegeDetails = async (college_id: number): Promise<CollegeDetails | null> => {
  try {
    const response = await fetch('/web/FetchCollegeDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ college_id }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch college details.');
    }
    const data = await response.json();
    return data.college;
  } catch (error) {
    console.error('Error fetching college details:', error);
    return null;
  }
};

export const updateCollegeDetails = async (details: CollegeDetails, role: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('Sending update request:', { ...details, role }); // Debug request body
    const response = await fetch('/web/updateCollegeDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...details, role }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update college details.');
    }
    const data = await response.json();
    return { success: data.success, message: data.message };
  } catch (error) {
    console.error('Error updating college details:', error);
    return { success: false};
  }
};