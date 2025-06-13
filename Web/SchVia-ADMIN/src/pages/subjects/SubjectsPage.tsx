import React, { useEffect, useState } from 'react';
import { PlusCircle, Download, Upload, Edit, Trash2 } from 'lucide-react';
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
  getSubjects,
  addSubject,
  updateSubject,
  deleteSubject
} from '../../constants/fetchSubjectDetails';
import { fetchDepartmentOptions } from '../../constants/fetchSubjectFilters';

interface Subject {
  id: number;
  subject_code: string;
  name: string;
  department_id: number;
  department_name: string;
  credits: number;
  faculty_count: number;
}

interface DepartmentOption {
  value: string;
  label: string;
}

const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const collegeId = user?.college_id;
  const userRole = user?.role;
  const departmentId = user?.department_id;

  if (!collegeId) return <div>No college ID found.</div>;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [deptOptions, setDeptOptions] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [form, setForm] = useState({
    subject_code: '',
    name: '',
    credits: ''
  });

  useEffect(() => {
    (async () => {
      if (userRole === 'department') {
        if (departmentId == null) {
          setNotify({ type: 'error', message: 'Department ID is missing for department admin.' });
          return;
        }
        // Department admins see only their department
        const depts = await fetchDepartmentOptions(collegeId);
        const userDept = depts.find((d: DepartmentOption) => d.value === String(departmentId));
        if (userDept) {
          setDeptOptions([userDept]);
          setSelectedDepartment(String(departmentId));
        } else {
          setNotify({ type: 'error', message: 'Invalid department ID for department admin.' });
        }
      } else {
        // College admins see all departments
        const depts = await fetchDepartmentOptions(collegeId);
        setDeptOptions([{ value: '', label: 'All Departments' }, ...depts]);
      }
    })();
  }, [collegeId, userRole, departmentId]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const deptFilter = userRole === 'department' ? String(departmentId) : selectedDepartment;
      const deptIdParam = userRole === 'department' && departmentId != null ? departmentId : undefined;
      const data = await getSubjects(collegeId, searchQuery, deptFilter, deptIdParam);
      setSubjects(data);
      setIsLoading(false);
    })();
  }, [collegeId, searchQuery, selectedDepartment, userRole, departmentId]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const openAdd = () => {
    setForm({ subject_code: '', name: '', credits: '' });
    setIsAddOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setSelected(subject);
    setForm({
      subject_code: subject.subject_code,
      name: subject.name,
      credits: String(subject.credits)
    });
    setSelectedDepartment(String(subject.department_id)); // Ensure department is pre-selected
    setIsEditOpen(true);
  };

  const openDel = (subject: Subject) => {
    setSelected(subject);
    setIsDelOpen(true);
  };

  const handleAdd = async () => {
    const { subject_code, name, credits } = form;
    if (!subject_code || !name || !credits) {
      setNotify({ type: 'error', message: 'Please fill all fields.' });
      return;
    }
    try {
      let deptId: number;
      if (userRole === 'department') {
        if (departmentId == null) {
          setNotify({ type: 'error', message: 'Department ID is missing.' });
          return;
        }
        deptId = departmentId;
      } else {
        deptId = parseInt(selectedDepartment || deptOptions.find(d => d.value !== '')?.value || '0');
        if (!deptId) {
          setNotify({ type: 'error', message: 'Please select a department.' });
          return;
        }
      }
      const newSubject = await addSubject(collegeId, subject_code, name, deptId, parseInt(credits));
      setSubjects(prev => [...prev, newSubject]);
      setIsAddOpen(false);
      setNotify({ type: 'success', message: 'Subject added successfully.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    const { subject_code, name, credits } = form;
    if (!subject_code || !name || !credits) {
      setNotify({ type: 'error', message: 'Please fill all fields.' });
      return;
    }
    try {
      let deptId: number;
      if (userRole === 'department') {
        if (departmentId == null) {
          setNotify({ type: 'error', message: 'Department ID is missing.' });
          return;
        }
        deptId = departmentId;
      } else {
        deptId = parseInt(selectedDepartment || String(selected.department_id));
        if (!deptId) {
          setNotify({ type: 'error', message: 'Please select a department.' });
          return;
        }
      }
      const updated = await updateSubject(selected.id, collegeId, {
        subject_code,
        name,
        department_id: deptId,
        credits: parseInt(credits),
      });
      setSubjects(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      setIsEditOpen(false);
      setNotify({ type: 'success', message: 'Subject updated successfully.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const deptIdParam = userRole === 'department' && departmentId != null ? departmentId : undefined;
      await deleteSubject(selected.id, collegeId, deptIdParam);
      setSubjects(prev => prev.filter(s => s.id !== selected.id));
      setIsDelOpen(false);
      setNotify({ type: 'success', message: 'Subject deleted successfully.' });
    } catch (e: any) {
      setNotify({ type: 'error', message: e.message });
    }
  };

  const columns = [
    { header: 'Subject Code', accessor: (r: Subject) => r.subject_code },
    { header: 'Subject Name', accessor: (r: Subject) => r.name },
    { header: 'Department', accessor: (r: Subject) => r.department_name },
    { header: 'Credits', accessor: (r: Subject) => r.credits },
    {
      header: 'Faculties',
      accessor: (r: Subject) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">
            {r.faculty_count}
          </span>
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (r: Subject) => (
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          <Button variant="outline" size="sm" icon={<Edit size={14} />} onClick={() => openEdit(r)}>Edit</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => openDel(r)}>Delete</Button>
        </div>
      ),
      className: 'w-44',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <div className="flex space-x-2">
          <Button variant="outline" icon={<Download size={16} />}>Export</Button>
          <Button variant="outline" icon={<Upload size={16} />}>Import</Button>
          <Button variant="primary" icon={<PlusCircle size={16} />} onClick={openAdd}>Add Subject</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <SearchInput placeholder="Search subjects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {userRole !== 'department' && (
            <SelectInput
              placeholder="Select Department"
              options={deptOptions}
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
            />
          )}
          <div className="flex items-end"><span>Total: <strong>{subjects.length}</strong></span></div>
        </div>
        <Table columns={columns} data={subjects} keyField="id" isLoading={isLoading} />
      </Card>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Subject" footer={
        <>
          <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add</Button>
        </>
      }>
        <Input label="Subject Code" name="subject_code" value={form.subject_code} onChange={onChange} required />
        <Input label="Name" name="name" value={form.name} onChange={onChange} required />
        {userRole !== 'department' && (
          <SelectInput
            label="Department"
            name="department_id"
            options={deptOptions.filter(d => d.value !== '')}
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            required
          />
        )}
        <Input label="Credits" name="credits" type="number" value={form.credits} onChange={onChange} required />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Subject" footer={
        <>
          <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEdit}>Save</Button>
        </>
      }>
        <Input label="Subject Code" name="subject_code" value={form.subject_code} onChange={onChange} required />
        <Input label="Name" name="name" value={form.name} onChange={onChange} required />
        {userRole !== 'department' && (
          <SelectInput
            label="Department"
            name="department_id"
            options={deptOptions.filter(d => d.value !== '')}
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            required
          />
        )}
        <Input label="Credits" name="credits" type="number" value={form.credits} onChange={onChange} required />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} title="Delete Subject" footer={
        <>
          <Button variant="outline" onClick={() => setIsDelOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </>
      }>
        <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>
      </Modal>

      {/* Notification Modal */}
      <Modal isOpen={!!notify} onClose={() => setNotify(null)} title={notify?.type === 'success' ? 'Success' : 'Error'} footer={
        <Button variant="primary" onClick={() => setNotify(null)}>OK</Button>
      }>
        <p>{notify?.message}</p>
      </Modal>
    </div>
  );
};

export default SubjectsPage;