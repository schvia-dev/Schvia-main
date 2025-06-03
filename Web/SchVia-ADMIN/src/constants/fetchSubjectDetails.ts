import { Subject } from '../types';
const BASE = '/web';

export const getSubjects = async (
  college_id: number,
  search = '',
  dept = '',
  sem = ''
): Promise<Subject[]> => {
  const params = new URLSearchParams();
  params.set('college_id', String(college_id));
  if (search) params.set('search', search);
  if (dept) params.set('dept', dept);
  if (sem) params.set('sem', sem);

  const res = await fetch(`${BASE}/fetchsubjects?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch subjects');
  const { subjects } = await res.json();
  return subjects;
};

// export const addSubject = async (
//   college_id: number,
//   subject_code: string,
//   name: string,
//   department_id: number,
//   semester_no: number
// ): Promise<Subject> => {
//   const res = await fetch('/web/addsubject', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       college_id,
//       subject_code,
//       name,
//       department_id,
//       semester_no,
//     }),
//   });

//   if (!res.ok) throw new Error('Failed to add subject');
//   const { subject } = await res.json();
//   return subject;
// };

export const addSubject = async (
  college_id: number,
  subject_code: string,
  name: string,
  department_id: number,
  semester_no: number
): Promise<Subject> => {
  const res = await fetch('/web/addsubject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      college_id,
      subject_code,
      name,
      department_id,
      semester_no,
    }),
  });

  if (!res.ok) throw new Error('Failed to add subject');
  const { subject } = await res.json();

  // Ensure the returned object matches the full Subject interface
  return {
    ...subject,
    department_name: subject.department_name || 'Unknown',
    faculty_count: subject.faculty_count || 0,
  };
};
// export const updateSubject = async (id: number, subject: Partial<Subject>) => {
//   const res = await fetch(`${BASE}/editsubject/${id}`, {
//     method: 'PUT',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(subject),
//   });
//   if (!res.ok) throw new Error('Failed to update subject');
//   return res.json();
// };

export const updateSubject = async (
  id: number,
  subject: {
    subject_code: string;
    name: string;
    department_id: number;
    semester_no: number;
  }
): Promise<Subject> => {
  const res = await fetch(`/web/editsubject/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subject),
  });

  if (!res.ok) throw new Error('Failed to update subject');
  const { subject: updatedSubject } = await res.json();

  return {
    ...updatedSubject,
    department_name: updatedSubject.department_name || 'Unknown',
    faculty_count: updatedSubject.faculty_count || 0,
  };
};

export const deleteSubject = async (id: number) => {
  const res = await fetch(`${BASE}/deletesubject/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete subject');
};
