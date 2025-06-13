import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { getStudentById, updateStudent, deleteStudent } from '../../constants/fetchStudents';
import { fetchDepartmentOptions, fetchSectionOptions } from '../../constants/fetchSectionsOptions';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SelectInput from '../../components/ui/SelectInput';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, Edit, Key, Trash2, User } from 'lucide-react';
import { getColor } from '../../constants/colors';

// Utility function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    if (date > new Date()) return 'Invalid Date'; // Prevent future dates
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }); // e.g., "04 Jun 2025"
  } catch {
    return 'N/A';
  }
};

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collegeId = user?.college_id;
  const role = user?.role;
  const departmentId = user?.department_id ?? null;
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [deptOptions, setDeptOptions] = useState<{ value: string; label: string }[]>([]);
  const [sectionOptions, setSectionOptions] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    batch_id: '',
    current_year: '',
    phone: '',
    address: '',
    pan_number: '',
    aadhar_number: '',
    father_phone: '',
    mother_phone: '',
    dob: '',
  });

  // Load department, batch options, and student data
  useEffect(() => {
    if (!collegeId || !role || !id) {
      setNotify({ type: 'error', message: 'Invalid access.' });
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        // Fetch department and batch options
        const depts = await fetchDepartmentOptions(collegeId, user);
        setDeptOptions(
          role === 'department' && departmentId
            ? depts.filter(opt => opt.value === String(departmentId))
            : depts
        );
        const batches = await fetchSectionOptions(collegeId, user, departmentId ? String(departmentId) : '');
        setSectionOptions(batches);

        // Fetch student data
        const data = await getStudentById(collegeId, id, user);
        if (role === 'department' && departmentId && data.department_id !== departmentId) {
          throw new Error('You can only view students in your own department.');
        }
        setStudent(data);
        setForm({
          name: data.name,
          email: data.email,
          batch_id: String(data.batch_id),
          current_year: data.current_year,
          phone: data.phone || '',
          address: data.address || '',
          pan_number: data.pan_number || '',
          aadhar_number: data.aadhar_number || '',
          father_phone: data.father_phone || '',
          mother_phone: data.mother_phone || '',
          dob: data.dob || '',
        });
      } catch (e: any) {
        setNotify({ type: 'error', message: e.message || 'Failed to load student profile.' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [collegeId, role, departmentId, id, user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleEdit = async () => {
    if (!student) return;
    if (role === 'department' && departmentId && parseInt(form.batch_id, 10) !== student.batch_id) {
      // Assuming batch_id relates to department; adjust if needed
      setNotify({ type: 'error', message: 'You can only edit students in your own department.' });
      return;
    }
    if (!form.name || !form.email || !form.batch_id || !form.current_year) {
      setNotify({ type: 'error', message: 'Please fill all required fields (Name, Email, Batch, Current Year).' });
      return;
    }
    try {
      const updated = await updateStudent(
        user,
        student.id,
        form.name,
        form.email,
        parseInt(form.batch_id, 10),
        form.current_year,
        form.phone || 'N/A',
        form.address || 'N/A',
        form.pan_number || 'N/A',
        form.aadhar_number || 'N/A',
        form.father_phone || 'N/A',
        form.mother_phone || 'N/A',
        form.dob || 'N/A'
      );
      setStudent(updated);
      setIsEditOpen(false);
      setNotify({ type: 'success', message: 'Student updated successfully.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message || 'Failed to update student.' });
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    if (role === 'department' && departmentId && student.department_id !== departmentId) {
      setNotify({ type: 'error', message: 'You can only delete students from your own department.' });
      return;
    }
    try {
      await deleteStudent(user, student.id.toString());
      setIsDeleteOpen(false);
      setNotify({ type: 'success', message: 'Student deleted successfully.' });
      navigate('/students');
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message || 'Failed to delete student.' });
    }
  };

  const handleReset = async () => {
    if (!student) return;
    if (role === 'department' && departmentId && student.department_id !== departmentId) {
      setNotify({ type: 'error', message: 'You can only reset passwords for students in your own department.' });
      return;
    }
    try {
      const res = await fetch('/web/studentForgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: student.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      setIsResetOpen(false);
      setNotify({ type: 'success', message: data.message });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message || 'Failed to reset password.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-headings">Student Profile</h1>
        <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate('/students')}>
          Back to Students
        </Button>
      </div>

      {student ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-2 border-avatarImageBorder">
                <User size={48} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-headings">{student.name}</h2>
                <p className="text-text-secondary">{student.department_name} - {student.batch_name}</p>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm" icon={<Edit size={16} />} onClick={() => setIsEditOpen(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" icon={<Key size={16} />} onClick={() => setIsResetOpen(true)}>
                    Reset Password
                  </Button>
                  <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={() => setIsDeleteOpen(true)}>
                    Delete Student
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4 text-headings">Personal Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Student ID</span>
                  <span className="text-text-primary">{student.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Name</span>
                  <span className="text-text-primary">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Email</span>
                  <span className="text-text-primary">{student.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Phone</span>
                  <span className="text-text-primary">{student.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Date of Birth</span>
                  <span className="text-text-primary">{formatDate(student.dob)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Address</span>
                  <span className="text-text-primary">{student.address || 'N/A'}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4 text-headings">Academic Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Department</span>
                  <span className="text-text-primary">{student.department_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Batch</span>
                  <Badge variant="primary">{student.batch_name}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Current Year</span>
                  <Badge variant="primary">{student.current_year}</Badge>
                </div>
                {student.subjects && student.subjects.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Enrolled Subjects</h3>
                    <div className="flex flex-wrap gap-2">
                      {student.subjects.map((subject, index) => (
                        <Badge key={index} variant="secondary" className="text-text-primary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4 text-headings">Additional Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">PAN Number</span>
                  <span className="text-text-primary">{student.pan_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Aadhar Number</span>
                  <span className="text-text-primary">{student.aadhar_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Father's Phone</span>
                  <span className="text-text-primary">{student.father_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Mother's Phone</span>
                  <span className="text-text-primary">{student.mother_phone || 'N/A'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <p className="text-text-secondary">No student data available.</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/students')}>
            Back to Students
          </Button>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        title="Edit Student Profile"
        onClose={() => setIsEditOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Student ID" name="id" value={student?.id || ''} disabled />
          <Input label="Name" name="name" value={form.name} onChange={onChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
          <SelectInput
            label="Batch"
            name="batch_id"
            value={form.batch_id}
            options={[{ value: '', label: 'Select Batch' }, ...sectionOptions]}
            onChange={onChange}
            required
          />
          <SelectInput
            label="Current Year"
            name="current_year"
            value={form.current_year}
            options={[
              { value: '', label: 'Select Year' },
              { value: '1st', label: '1st Year' },
              { value: '2nd', label: '2nd Year' },
              { value: '3rd', label: '3rd Year' },
              { value: '4th', label: '4th Year' }
            ]}
            onChange={onChange}
            required
          />
          <Input label="Phone" name="phone" value={form.phone} onChange={onChange} />
          <Input label="Date of Birth" name="dob" type="date" value={form.dob} onChange={onChange} />
          <Input label="Address" name="address" value={form.address} onChange={onChange} />
          <Input label="PAN Number" name="pan_number" value={form.pan_number} onChange={onChange} />
          <Input label="Aadhar Number" name="aadhar_number" value={form.aadhar_number} onChange={onChange} />
          <Input label="Father's Phone" name="father_phone" value={form.father_phone} onChange={onChange} />
          <Input label="Mother's Phone" name="mother_phone" value={form.mother_phone} onChange={onChange} />
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        title="Reset Student Password"
        onClose={() => setIsResetOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleReset}>Reset Password</Button>
          </>
        }
      >
        <p>Are you sure you want to reset the password for <strong>{student?.name} ({student?.id})</strong>?</p>
        <p className="mt-2 text-text-secondary text-sm">A new random password will be generated and emailed to the student.</p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        title="Delete Student"
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{student?.name}</strong>?</p>
        <p className="mt-2 text-text-secondary text-sm">This action cannot be undone.</p>
      </Modal>

      {/* Notification Modal */}
      <Modal
        isOpen={!!notify}
        title={notify?.type === 'success' ? 'Success' : 'Error'}
        onClose={() => setNotify(null)}
        footer={<Button variant="primary" onClick={() => setNotify(null)}>OK</Button>}
      >
        <p>{notify?.message}</p>
      </Modal>
    </div>
  );
};

export default StudentProfile;