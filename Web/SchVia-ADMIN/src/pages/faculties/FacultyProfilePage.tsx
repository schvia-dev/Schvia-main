import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchFaculty, updateFaculty, deleteFaculty } from '../../constants/fetchFacultyDetails';
import { Faculty } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SelectInput from '../../components/ui/SelectInput';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, Edit, Key, Trash2, User } from 'lucide-react';
import { fetchDepartmentOptions } from '../../constants/fetchFacultyFilter';
import { getColor } from '../../constants/colors';

// Utility function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }); // e.g., "04 Jun 2025"
  } catch {
    return 'N/A';
  }
};

const FacultyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collegeId = user?.college_id;
  const role = user?.role;
  const departmentId = user?.department_id ?? null;
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [deptOptions, setDeptOptions] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    department_id: '',
    phone: '',
    dob: '',
    qualification: '',
  });

  // Load department options and faculty data
  useEffect(() => {
    if (!collegeId || !role || !id) {
      setNotify({ type: 'error', message: 'Invalid access.' });
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        // Fetch department options
        const opts = await fetchDepartmentOptions(collegeId);
        setDeptOptions(
          role === 'department' && departmentId
            ? opts.filter(opt => opt.value === String(departmentId))
            : opts
        );

        // Fetch faculty data
        const data = await fetchFaculty(id, collegeId, role, departmentId);
        if (role === 'department' && departmentId && data.department_id !== departmentId) {
          throw new Error('You can only view faculties in your own department.');
        }
        setFaculty(data);
        setForm({
          name: data.name,
          email: data.email,
          department_id: String(data.department_id),
          phone: data.phone,
          dob: data.dob || '',
          qualification: data.qualification,
        });
      } catch (e: any) {
        setNotify({ type: 'error', message: e.message });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, collegeId, role, departmentId]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleEdit = async () => {
    if (!faculty) return;
    if (role === 'department' && departmentId && parseInt(form.department_id, 10) !== departmentId) {
      setNotify({ type: 'error', message: 'You can only edit faculties in your own department.' });
      return;
    }
    try {
      const upd = await updateFaculty(
        faculty.id,
        form.name,
        form.email,
        parseInt(form.department_id, 10),
        form.phone,
        form.dob,
        form.qualification,
        role,
        departmentId
      );
      setFaculty(upd);
      setIsEditOpen(false);
      setNotify({ type: 'success', message: 'Faculty updated successfully.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const handleDelete = async () => {
    if (!faculty) return;
    if (role === 'department' && departmentId && faculty.department_id !== departmentId) {
      setNotify({ type: 'error', message: 'You can only delete faculties from your own department.' });
      return;
    }
    try {
      await deleteFaculty(faculty.id, role, departmentId);
      setIsDeleteOpen(false);
      setNotify({ type: 'success', message: 'Faculty deleted successfully.' });
      navigate('/faculties');
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const handleReset = async () => {
    if (!faculty) return;
    if (role === 'department' && departmentId && faculty.department_id !== departmentId) {
      setNotify({ type: 'error', message: 'You can only reset passwords for faculties in your own department.' });
      return;
    }
    try {
      const res = await fetch('/web/facultyforgotpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faculty.id, role, admin_department_id: departmentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setIsResetOpen(false);
      setNotify({ type: 'success', message: data.message });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
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
        <h1 className="text-3xl font-bold text-headings">Faculty Profile</h1>
        <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate('/faculties')}>
          Back to Faculties
        </Button>
      </div>

      {faculty ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-2 border-avatarImageBorder">
                <User size={48} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-headings">{faculty.name}</h2>
                <p className="text-text-secondary">{faculty.department_name}</p>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm" icon={<Edit size={16} />} onClick={() => setIsEditOpen(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" icon={<Key size={16} />} onClick={() => setIsResetOpen(true)}>
                    Reset Password
                  </Button>
                  <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={() => setIsDeleteOpen(true)}>
                    Delete Faculty
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
                  <span className="text-text-secondary">ID</span>
                  <span className="text-text-primary">{faculty.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Email</span>
                  <span className="text-text-primary">{faculty.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Phone</span>
                  <span className="text-text-primary">{faculty.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Date of Birth</span>
                  <span className="text-text-primary">{formatDate(faculty.dob)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Qualification</span>
                  <span className="text-text-primary">{faculty.qualification}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4 text-headings">Academic Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Department</span>
                  <span className="text-text-primary">{faculty.department_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subjects Assigned</span>
                  <Badge variant="primary">{faculty.subjects_count}</Badge>
                </div>
                {faculty.subjects && faculty.subjects.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Subjects Taught</h3>
                    <div className="flex flex-wrap gap-2">
                      {faculty.subjects.map((subject, index) => (
                        <Badge key={index} variant="secondary" className="text-text-primary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <p className="text-text-secondary">No faculty data available.</p>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        title="Edit Faculty Profile"
        onClose={() => setIsEditOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" name="name" value={form.name} onChange={onChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
          <SelectInput
            label="Department"
            name="department_id"
            options={deptOptions}
            value={form.department_id}
            onChange={onChange}
            disabled={role === 'department'}
            required
          />
          <Input label="Phone" name="phone" value={form.phone} onChange={onChange} />
          <Input label="Date of Birth" name="dob" type="date" value={form.dob} onChange={onChange} />
          <Input label="Qualification" name="qualification" value={form.qualification} onChange={onChange} />
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        title="Reset Faculty Password"
        onClose={() => setIsResetOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleReset}>Reset Password</Button>
          </>
        }
      >
        <p>Are you sure you want to reset the password for <strong>{faculty?.name} ({faculty?.id})</strong>?</p>
        <p className="mt-2 text-text-secondary text-sm">A new random password will be generated and emailed to the faculty.</p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        title="Delete Faculty"
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{faculty?.name}</strong>?</p>
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

export default FacultyProfilePage;