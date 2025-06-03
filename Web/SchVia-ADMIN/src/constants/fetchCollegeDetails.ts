import { CollegeDetails } from '../types'; // Adjust path if needed

export const fetchCollegeDetails = async (college_id: number): Promise<CollegeDetails | null> => {
  try {
    const response = await fetch('/web/FetchCollageDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ college_id }),
    });

    if (!response.ok) throw new Error('Failed to fetch college details.');
    const data = await response.json();
    return data.college;
  } catch (error) {
    console.error('Error fetching college details:', error);
    return null;
  }
};

export const updateCollegeDetails = async (details: CollegeDetails, role: string): Promise<boolean> => {
    console.log(details);
    if (role !== 'college') {
    alert('Only college admins can edit college details.');
    return false;
  }
  try {
    const response = await fetch('/web/updateCollegeDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...details, role }),
    });

    if (!response.ok) throw new Error('Failed to update college details.');
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error updating college details:', error);
    return false;
  }
};
