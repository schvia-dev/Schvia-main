import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SearchInput from '../../components/ui/SearchInput';
import SelectInput from '../../components/ui/SelectInput';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import {
  getFaculties,
  addFaculty,
  updateFaculty,
  deleteFaculty
} from '../../constants/fetchFacultyDetails';
import { fetchDepartmentOptions } from '../../constants/fetchFacultyFilter';
import { Faculty } from '../../types';

const FacultiesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const collegeId = user?.college_id;
  const role = user?.role;
  const departmentId = user?.department_id ?? null; // Convert undefined to null
  if (!collegeId || !role) return null;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDepartment] = useState('');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deptOptions, setDeptOptions] = useState<{ value: string; label: string }[]>([]);
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals & form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    department_id: '',
    phone: '',
    dob: '',
    qualification: '',
    password: ''
  });

  // Load department options
  useEffect(() => {
    (async () => {
      try {
        const opts = await fetchDepartmentOptions(collegeId);
        if (role === 'department' && departmentId) {
          const deptOption = opts.find(opt => opt.value === String(departmentId));
          setDeptOptions(deptOption ? [deptOption] : []);
          setSelectedDepartment(String(departmentId));
        } else {
          setDeptOptions([{ value: '', label: 'All Departments' }, ...opts]);
        }
      } catch {
        setNotify({ type: 'error', message: 'Could not load departments.' });
      }
    })();
  }, [collegeId, role, departmentId]);

  // Load faculties
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await getFaculties(collegeId, role, departmentId, searchQuery, selectedDept);
        setFaculties(data);
      } catch (e: any) {
        setNotify({ type: 'error', message: e.message });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [collegeId, role, departmentId, searchQuery, selectedDept]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const openAdd = () => {
    setForm({
      id: '',
      name: '',
      email: '',
      department_id: role === 'department' ? String(departmentId) : '',
      phone: '',
      dob: '',
      qualification: '',
      password: ''
    });
    setIsAddOpen(true);
  };

  const openEdit = (f: Faculty) => {
    setSelected(f);
    setForm({
      id: f.id,
      name: f.name,
      email: f.email,
      department_id: String(f.department_id),
      phone: f.phone,
      dob: f.dob || '',
      qualification: f.qualification,
      password: ''
    });
    setIsEditOpen(true);
  };

  const openDel = (f: Faculty) => {
    setSelected(f);
    setIsDelOpen(true);
  };

  const openReset = (f: Faculty) => {
    setSelected(f);
    setIsResetOpen(true);
  };

  const handleAdd = async () => {
    const { id, name, email, department_id, phone, dob, qualification, password } = form;
    if (!id || !name || !email || !department_id || !password) {
      setNotify({ type: 'error', message: 'Please fill all required fields (ID, Name, Email, Department, Password).' });
      return;
    }
    if (role === 'department' && departmentId && parseInt(department_id, 10) !== departmentId) {
      setNotify({ type: 'error', message: 'You can only add faculties to your own department.' });
      return;
    }
    try {
      const newF = await addFaculty(
        id,
        name,
        email,
        parseInt(department_id, 10),
        phone,
        dob,
        qualification,
        password,
        role,
        departmentId
      );
      setFaculties(prev => [...prev, newF]);
      setIsAddOpen(false);
      setNotify({ type: 'success', message: 'Faculty added.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    if (role === 'department' && departmentId && parseInt(form.department_id, 10) !== departmentId) {
      setNotify({ type: 'error', message: 'You can only edit faculties in your own department.' });
      return;
    }
    try {
      const upd = await updateFaculty(
        selected.id,
        form.name,
        form.email,
        parseInt(form.department_id, 10),
        form.phone,
        form.dob,
        form.qualification,
        role,
        departmentId
      );
      setFaculties(prev => prev.map(f => (f.id === upd.id ? upd : f)));
      setIsEditOpen(false);
      setNotify({ type: 'success', message: 'Faculty updated.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (role === 'department' && departmentId && selected.department_id !== departmentId) {
      setNotify({ type: 'error', message: 'You can only delete faculties from your own department.' });
      return;
    }
    try {
      await deleteFaculty(selected.id, role, departmentId);
      setFaculties(prev => prev.filter(f => f.id !== selected.id));
      setIsDelOpen(false);
      setNotify({ type: 'success', message: 'Faculty deleted.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const handleReset = async () => {
    if (!selected) return;
    if (role === 'department' && departmentId && selected.department_id !== departmentId) {
      setNotify({ type: 'error', message: 'You can only reset passwords for faculties in your own department.' });
      return;
    }
    try {
      const res = await fetch('/web/facultyforgotpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, role, admin_department_id: departmentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setIsResetOpen(false);
      setNotify({ type: 'success', message: data.message });
    } catch (e: any) {
      setIsResetOpen(false);
      setNotify({ type: 'error', message: e.message });
    }
  };

  const columns = [
    { header: 'ID', accessor: (r: Faculty) => r.id, className: 'font-medium' },
    { header: 'Name', accessor: (r: Faculty) => r.name },
    { header: 'Email', accessor: (r: Faculty) => r.email },
    { header: 'Department', accessor: (r: Faculty) => r.department_name },
    { header: 'Qualification', accessor: (r: Faculty) => r.qualification },
    {
      header: 'Subjects',
      accessor: (r: Faculty) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.subjects_count}</span>
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (r: Faculty) => (
        <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye size={14} />}
            onClick={() => navigate(`/faculty/${r.id}`)}
          >
            View
          </Button>
          <Button variant="outline" size="sm" icon={<Edit size={14} />} onClick={() => openEdit(r)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" icon={<Key size={14} />} onClick={() => openReset(r)}>
            Reset Password
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => openDel(r)}>
            Delete
          </Button>
        </div>
      ),
      className: 'w-96'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Faculties</h1>
        <div className="flex space-x-2">
          <Button variant="outline" icon={<Download size={16} />}>Export</Button>
          <Button variant="outline" icon={<Upload size={16} />}>Import</Button>
          <Button variant="primary" icon={<PlusCircle size={16} />} onClick={openAdd}>Add Faculty</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <SearchInput
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {role !== 'department' && (
            <SelectInput
              placeholder="All Departments"
              options={deptOptions}
              value={selectedDept}
              onChange={e => setSelectedDepartment(e.target.value)}
            />
          )}
          <div className="flex items-end">
            <span>Total: <strong>{faculties.length}</strong></span>
          </div>
        </div>
        <Table columns={columns} data={faculties} keyField="id" isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isAddOpen}
        title="Add Faculty"
        onClose={() => setIsAddOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd}>Add</Button>
          </>
        }
      >
        <Input label="ID" name="id" value={form.id} onChange={onChange} required />
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
        <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
      </Modal>

      <Modal
        isOpen={isEditOpen}
        title="Edit Faculty"
        onClose={() => setIsEditOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEdit}>Save</Button>
          </>
        }
      >
        <Input label="ID" name="id" value={form.id} disabled />
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
      </Modal>

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
        <p>Are you sure you want to reset the password for <strong>{selected?.name} ({selected?.id})</strong>?</p>
        <p className="mt-2 text-gray-500 text-sm">A new random password will be generated and emailed to the faculty.</p>
      </Modal>

      <Modal
        isOpen={isDelOpen}
        title="Delete Faculty"
        onClose={() => setIsDelOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDelOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>
      </Modal>

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

export default FacultiesPage;