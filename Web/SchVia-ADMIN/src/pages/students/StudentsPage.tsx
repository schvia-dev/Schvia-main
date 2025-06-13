import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Key
} from 'lucide-react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SearchInput from '../../components/ui/SearchInput';
import SelectInput from '../../components/ui/SelectInput';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent
} from '../../constants/fetchStudents';
import {
  fetchDepartmentOptions,
  fetchSectionOptions
} from '../../constants/fetchSectionsOptions';

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8);
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const collegeId = user?.college_id;
  const role = user?.role;
  const departmentId = user?.department_id ?? null;
  if (!collegeId || !user) return null;

  // Filters & data
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(
    role === 'department' && departmentId ? String(departmentId) : ''
  );
  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown options
  const [deptOptions, setDeptOptions] = useState<{ value: string; label: string }[]>([]);
  const [sectionOptions, setSectionOptions] = useState<{ value: string; label: string }[]>([]);

  // Modal & form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    batch_id: '',
    current_year: '',
    password: '',
    phone: '',
    address: '',
    pan_number: '',
    aadhar_number: '',
    father_phone: '',
    mother_phone: ''
  });

  // Notification modal state
  const [notify, setNotify] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Load department & batch options
  useEffect(() => {
    (async () => {
      try {
        const depts = await fetchDepartmentOptions(collegeId, user);
        setDeptOptions(
          role === 'department' ? depts : [{ value: '', label: 'All Departments' }, ...depts]
        );
        const batches = await fetchSectionOptions(collegeId, user, selectedDept);
        setSectionOptions([{ value: '', label: 'All Batches' }, ...batches]);
        if (!batches.length) {
          setNotify({ type: 'warning', message: 'No batches available.' });
        }
      } catch (e) {
        console.error('Failed to load filters', e);
        setNotify({ type: 'error', message: 'Could not load filters.' });
      }
    })();
  }, [collegeId, user, selectedDept]);

  // Fetch students when filters change
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await getStudents(collegeId, user, searchQuery, selectedDept, selectedBatch);
        setStudents(data);
      } catch (e: any) {
        console.error('Failed to fetch students', e);
        setNotify({ type: 'error', message: e.message || 'Failed to load students.' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [collegeId, user, searchQuery, selectedDept, selectedBatch]);

  // Form input handler
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Open modals
  const openAdd = () => {
    setForm({
      id: '',
      name: '',
      email: '',
      batch_id: '',
      current_year: '',
      password: generateRandomPassword(),
      phone: '',
      address: '',
      pan_number: '',
      aadhar_number: '',
      father_phone: '',
      mother_phone: ''
    });
    setIsAddOpen(true);
  };
  const openEdit = (stu: Student) => {
    setSelected(stu);
    setForm({
      id: stu.id.toString(),
      name: stu.name,
      email: stu.email,
      batch_id: stu.batch_id.toString(),
      current_year: stu.current_year.toString(),
      password: '',
      phone: stu.phone || '',
      address: stu.address || '',
      pan_number: stu.pan_number || '',
      aadhar_number: stu.aadhar_number || '',
      father_phone: stu.father_phone || '',
      mother_phone: stu.mother_phone || ''
    });
    setIsEditOpen(true);
  };
  const openDel = (stu: Student) => {
    setSelected(stu);
    setIsDelOpen(true);
  };
  const openReset = (stu: Student) => {
    setSelected(stu);
    setIsResetOpen(true);
  };

  // CRUD handlers
  const handleAdd = async () => {
    const { id, name, email, batch_id, current_year, password, phone, address, pan_number, aadhar_number, father_phone, mother_phone } = form;
    if (!id || !name || !email || !batch_id || !current_year || !password) {
      setNotify({ type: 'error', message: 'Please fill all required fields (ID, Name, Email, Batch, Current Year, Password).' });
      return;
    }
    if (!isValidEmail(email)) {
      setNotify({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    try {
      const newStu = await addStudent(
        user,
        id,
        name,
        email,
        parseInt(batch_id, 10),
        current_year,
        password,
        phone || 'N/A',
        address || 'N/A',
        pan_number || 'N/A',
        aadhar_number || 'N/A',
        father_phone || 'N/A',
        mother_phone || 'N/A'
      );
      setStudents(prev => [...prev, newStu]);
      setIsAddOpen(false);
      setNotify({ type: 'success', message: 'Student added successfully. Password sent to student email.' });
    } catch (e: any) {
      console.error('Add failed', e);
      setNotify({ type: 'error', message: e.message || 'Failed to add student.' });
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    const { name, email, batch_id, current_year, phone, address, pan_number, aadhar_number, father_phone, mother_phone } = form;
    if (!name || !email || !batch_id || !current_year) {
      setNotify({ type: 'error', message: 'Please fill all required fields (Name, Email, Batch, Current Year).' });
      return;
    }
    if (!isValidEmail(email)) {
      setNotify({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    try {
      const updated = await updateStudent(
        user,
        form.id,
        name,
        email,
        parseInt(batch_id, 10),
        current_year,
        phone || 'N/A',
        address || 'N/A',
        pan_number || 'N/A',
        aadhar_number || 'N/A',
        father_phone || 'N/A',
        mother_phone || 'N/A'
      );
      setStudents(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      setIsEditOpen(false);
      setNotify({ type: 'success', message: 'Student updated successfully.' });
    } catch (e: any) {
      console.error('Edit failed', e);
      setNotify({ type: 'error', message: e.message || 'Failed to update student.' });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteStudent(user, selected.id.toString());
      setStudents(prev => prev.filter(s => s.id !== selected.id));
      setIsDelOpen(false);
      setNotify({ type: 'success', message: 'Student deleted successfully.' });
    } catch (e: any) {
      console.error('Delete failed', e);
      setNotify({ type: 'error', message: e.message || 'Failed to delete student.' });
    }
  };

  const handleReset = async () => {
    if (!selected) return;
    try {
      const res = await fetch('/web/studentForgotPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rollNo: selected.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      setIsResetOpen(false);
      setNotify({ type: 'success', message: data.message });
    } catch (e: any) {
      console.error('Reset failed', e);
      setIsResetOpen(false);
      setNotify({ type: 'error', message: e.message || 'Failed to reset password.' });
    }
  };

  // Table columns
  const columns = [
    { header: 'ID', accessor: (r: Student) => r.id },
    {
      header: 'Name',
      accessor: (r: Student) => <span className="font-medium">{r.name}</span>
    },
    { header: 'Email', accessor: (r: Student) => r.email },
    { header: 'Department', accessor: (r: Student) => r.department_name },
    {
      header: 'Batch',
      accessor: (r: Student) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.batch_name}</span>
        </Badge>
      )
    },
    {
      header: 'Current Year',
      accessor: (r: Student) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.current_year}</span>
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (r: Student) => (
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye size={14} />}
            onClick={() => navigate(`/students/${r.id}`)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Edit size={14} />}
            onClick={() => openEdit(r)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Key size={14} />}
            onClick={() => openReset(r)}
          >
            Reset Password
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => openDel(r)}
          >
            Delete
          </Button>
        </div>
      ),
      className: 'w-96'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-headings">
          Students {role === 'department' && deptOptions.length > 0 ? ` - ${deptOptions[0].label}` : ''}
        </h1>
        <div className="flex space-x-2">
          <Button variant="outline" icon={<Download size={16} />}>
            Export
          </Button>
          <Button variant="outline" icon={<Upload size={16} />}>
            Import
          </Button>
          <Button variant="primary" icon={<PlusCircle size={16} />} onClick={openAdd}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <SearchInput
            placeholder="Search name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {role !== 'department' && (
            <SelectInput
              label="Department"
              placeholder="All Departments"
              value={selectedDept}
              options={deptOptions}
              onChange={e => setSelectedDept(e.target.value)}
            />
          )}
          <SelectInput
            label="Batch"
            name="batch_id"
            placeholder="All Batches"
            value={selectedBatch}
            options={sectionOptions}
            onChange={e => setSelectedBatch(e.target.value)}
          />
          <div className="flex items-end">
            <span className="text-sm text-text-secondary">
              Total: <strong className="text-text-primary">{students.length}</strong> students
            </span>
          </div>
        </div>
        <Table columns={columns} data={students} keyField="id" isLoading={isLoading} />
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Student"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Add
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px] border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <div className="border-r border-gray-200 dark:border-gray-700 pr-4">
            <Input label="Student ID" name="id" value={form.id} onChange={onChange} required className="mb-4" />
            <Input label="Name" name="name" value={form.name} onChange={onChange} required className="mb-4" />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              className="mb-4"
            />
            <Input label="Phone" name="phone" value={form.phone} onChange={onChange} className="mb-4" />
            <Input label="Address" name="address" value={form.address} onChange={onChange} className="mb-4" />
            <Input label="PAN Number" name="pan_number" value={form.pan_number} onChange={onChange} className="mb-4" />
          </div>
          <div className="pl-4">
            <Input label="Aadhar Number" name="aadhar_number" value={form.aadhar_number} onChange={onChange} className="mb-4" />
            <Input label="Father's Phone" name="father_phone" value={form.father_phone} onChange={onChange} className="mb-4" />
            <Input label="Mother's Phone" name="mother_phone" value={form.mother_phone} onChange={onChange} className="mb-4" />
            {role === 'department' && deptOptions.length > 0 && (
              <Input
                label="Department"
                value={deptOptions[0].label}
                disabled
                className="mb-4 bg-gray-100 dark:bg-gray-800"
              />
            )}
            <SelectInput
              label="Batch"
              name="batch_id"
              value={form.batch_id}
              options={[{ value: '', label: 'Select Batch' }, ...sectionOptions.slice(1)]}
              onChange={onChange}
              required
              className="mb-4"
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
              className="mb-4"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Student"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEdit}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px] border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <div className="border-r border-gray-200 dark:border-gray-700 pr-4">
            <Input label="Student ID" name="id" value={form.id} disabled className="mb-4" />
            <Input label="Name" name="name" value={form.name} onChange={onChange} required className="mb-4" />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              className="mb-4"
            />
            <Input label="Phone" name="phone" value={form.phone} onChange={onChange} className="mb-4" />
            <Input label="Address" name="address" value={form.address} onChange={onChange} className="mb-4" />
            <Input label="PAN Number" name="pan_number" value={form.pan_number} onChange={onChange} className="mb-4" />
          </div>
          <div className="pl-4">
            <Input label="Aadhar Number" name="aadhar_number" value={form.aadhar_number} onChange={onChange} className="mb-4" />
            <Input label="Father's Phone" name="father_phone" value={form.father_phone} onChange={onChange} className="mb-4" />
            <Input label="Mother's Phone" name="mother_phone" value={form.mother_phone} onChange={onChange} className="mb-4" />
            {role === 'department' && deptOptions.length > 0 && (
              <Input
                label="Department"
                value={deptOptions[0].label}
                disabled
                className="mb-4 bg-gray-100 dark:bg-gray-800"
              />
            )}
            <SelectInput
              label="Batch"
              name="batch_id"
              value={form.batch_id}
              options={[{ value: '', label: 'Select Batch' }, ...sectionOptions.slice(1)]}
              onChange={onChange}
              required
              className="mb-4"
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
              className="mb-4"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Student Modal */}
      <Modal
        isOpen={isDelOpen}
        onClose={() => setIsDelOpen(false)}
        title="Delete Student"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDelOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{selected?.name}</strong>?
        </p>
        <p className="mt-2 text-red-600">This action cannot be undone.</p>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset Student Password"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReset}>
              Reset Password
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to reset the password for{' '}
          <strong>
            {selected?.name} ({selected?.id})
          </strong>
          ?
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          A new random password will be generated and emailed to the student.
        </p>
      </Modal>

      {/* Notification Modal */}
      <Modal
        isOpen={!!notify}
        onClose={() => setNotify(null)}
        title={notify?.type === 'success' ? 'Success' : notify?.type === 'error' ? 'Error' : 'Warning'}
        footer={
          <Button variant="primary" onClick={() => setNotify(null)}>
            OK
          </Button>
        }
      >
        <p>{notify?.message}</p>
      </Modal>
    </div>
  );
};

export default StudentsPage;