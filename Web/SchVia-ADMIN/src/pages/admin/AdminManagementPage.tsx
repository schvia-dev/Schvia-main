// src/pages/AdminManagementPage.tsx

import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Download,
  Upload,
  Edit,
  Trash2,
} from 'lucide-react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import SelectInput from '../../components/ui/SelectInput';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

import {
  fetchDepartmentAdmins,
  addDepartmentAdmin,
  editDepartmentAdmin,
  deleteDepartmentAdmin,
  DepartmentAdmin,
} from '../../constants/fetchDepartmentAdmins';

import { fetchDepartmentOptions } from '../../constants/fetchSectionsFilters';

// Define TableColumn type for the Table component
interface TableColumn<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

const AdminManagementPage: React.FC = () => {
  const { user } = useAuth();
  const collegeId = user?.college_id!;

  const [admins, setAdmins] = useState<DepartmentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departmentOptions, setDepartmentOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<DepartmentAdmin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department_id: '',
  });

  // Load department dropdown
  useEffect(() => {
    fetchDepartmentOptions(collegeId)
      .then((opts: { value: string; label: string }[]) =>
        setDepartmentOptions([{ value: '', label: 'All Departments' }, ...opts])
      )
      .catch((err: any) => setError(err.message));
  }, [collegeId]);

  const loadAdmins = () => {
    setLoading(true);
    fetchDepartmentAdmins(collegeId)
      .then(setAdmins)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadAdmins, [collegeId]);

  const filtered = admins.filter((a) => {
    const term = searchQuery.toLowerCase();
    const textMatch =
      a.name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      a.department_name.toLowerCase().includes(term);
    const deptMatch =
      selectedDepartment === '' ||
      a.department_id.toString() === selectedDepartment;
    return textMatch && deptMatch;
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((fd) => ({ ...fd, [e.target.name]: e.target.value }));
  };

  const handleAdd = () => {
    addDepartmentAdmin({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      college_id: collegeId,
      department_id: Number(formData.department_id),
    })
      .then(() => {
        setIsAddModalOpen(false);
        loadAdmins();
      })
      .catch((err: any) => setError(err.message));
  };

  const handleEdit = () => {
    if (!selectedAdmin) return;
    editDepartmentAdmin(selectedAdmin.id, {
      name: formData.name,
      email: formData.email,
      department_id: Number(formData.department_id),
      password: formData.password || undefined,
    })
      .then(() => {
        setIsEditModalOpen(false);
        loadAdmins();
      })
      .catch((err: any) => setError(err.message));
  };

  const handleDelete = () => {
    if (!selectedAdmin) return;
    deleteDepartmentAdmin(selectedAdmin.id)
      .then(() => {
        setIsDeleteModalOpen(false);
        loadAdmins();
      })
      .catch((err: any) => setError(err.message));
  };

  const columns: TableColumn<DepartmentAdmin>[] = [
    {
      header: 'Name',
      accessor: (row: DepartmentAdmin) => row.name,
      className: 'font-medium',
    },
    {
      header: 'Email',
      accessor: (row: DepartmentAdmin) => row.email,
    },
    {
      header: 'Department',
      accessor: (row: DepartmentAdmin) => row.department_name,
    },
    {
      header: 'Role',
      accessor: (row: DepartmentAdmin) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">
            {row.role === 'department' ? 'Department Admin' : 'Class Admin'}
          </span>
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: DepartmentAdmin) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit size={14} />}
            onClick={() => {
              setSelectedAdmin(row);
              setFormData({
                name: row.name,
                email: row.email,
                password: '',
                department_id: row.department_id.toString(),
              });
              setIsEditModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => {
              setSelectedAdmin(row);
              setIsDeleteModalOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
      className: 'w-48',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Department Admin Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" icon={<Download size={16} />}>
            Export
          </Button>
          <Button variant="outline" icon={<Upload size={16} />}>
            Import
          </Button>
          <Button
            variant="primary"
            icon={<PlusCircle size={16} />}
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                password: '',
                department_id: '',
              });
              setIsAddModalOpen(true);
            }}
          >
            Add Admin
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <SearchInput
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <SelectInput
            placeholder="Select Department"
            options={departmentOptions}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          />

          <div className="flex items-end">
            Total: <strong className="ml-1">{filtered.length}</strong>
          </div>
        </div>

        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          isLoading={loading}
          emptyMessage="No department admins found."
        />
      </Card>

      {/* Add Admin */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Department Admin"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Add Admin
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <SelectInput
            label="Department"
            name="department_id"
            options={departmentOptions}
            value={formData.department_id}
            onChange={handleInputChange}
            required
          />
        </div>
      </Modal>

      {/* Edit Admin */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Department Admin"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input
            label="New Password (optional)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
          />
          <SelectInput
            label="Department"
            name="department_id"
            options={departmentOptions.filter((o) => o.value)}
            value={formData.department_id}
            onChange={handleInputChange}
            required
          />
        </div>
      </Modal>

      {/* Delete Admin */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Department Admin"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>?
        </p>
        <p className="mt-2 text-red-600">
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default AdminManagementPage;