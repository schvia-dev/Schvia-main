import React, { useEffect, useState } from 'react';
import { Download, Upload, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { Department } from '../../types';
import {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../constants/fetchDepartments';

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');

  // Check user role
  const isCollegeAdmin = user?.role === 'college';
  const isDepartmentAdmin = user?.role === 'department';
  const isClassAdmin = user?.role === 'class';

  // Load departments
  useEffect(() => {
    if (!user?.college_id) return;

    const collegeId: number = user.college_id;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getDepartments(searchQuery, collegeId);
        // Filter for department/class admin's department
        const filteredData = (isDepartmentAdmin || isClassAdmin)
          ? data.filter((dept: Department) => dept.id === user.department_id)
          : data;
        setDepartments(filteredData);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
      setIsLoading(false);
    };

    load();
  }, [searchQuery, user?.college_id, user?.department_id, isDepartmentAdmin, isClassAdmin]);

  // Add (only for college admins)
  const handleAdd = async () => {
    if (!isCollegeAdmin || !deptCode || !deptName || !user?.college_id) return;
    try {
      const newDept = await addDepartment(deptCode, deptName, user.college_id);
      setDepartments(prev => [...prev, newDept]);
      setIsAddModalOpen(false);
      setDeptCode('');
      setDeptName('');
    } catch (err) {
      console.error('Error adding department:', err);
      alert('Failed to add department: ' + (err.message || 'Unknown error'));
    }
  };

  // Edit (for college admins or department admins editing their own department)
  const handleEdit = async () => {
    if (!selectedDepartment) return;
    if (!isCollegeAdmin && !(isDepartmentAdmin && selectedDepartment.id === user?.department_id)) return;
    try {
      await updateDepartment(selectedDepartment.id, deptCode, deptName);
      setDepartments(prev =>
        prev.map(d =>
          d.id === selectedDepartment.id ? { ...d, dept_code: deptCode, name: deptName } : d
        )
      );
      setIsEditModalOpen(false);
      setSelectedDepartment(null);
      setDeptCode('');
      setDeptName('');
    } catch (err) {
      console.error('Error updating department:', err);
      alert('Failed to update department: ' + (err.message || 'Unknown error'));
    }
  };

  // Delete (only for college admins)
  const handleDelete = async () => {
    if (!isCollegeAdmin || !selectedDepartment) return;
    try {
      await deleteDepartment(selectedDepartment.id);
      setDepartments(prev => prev.filter(d => d.id !== selectedDepartment.id));
      setIsDeleteModalOpen(false);
      setSelectedDepartment(null);
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department: ' + (err.message || 'Unknown error'));
    }
  };

  const openEditModal = (dept: Department) => {
    if (!isCollegeAdmin && !(isDepartmentAdmin && dept.id === user?.department_id)) return;
    setSelectedDepartment(dept);
    setDeptCode(dept.dept_code);
    setDeptName(dept.name);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (dept: Department) => {
    if (!isCollegeAdmin) return;
    setSelectedDepartment(dept);
    setIsDeleteModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      header: 'Department Code',
      accessor: (row: Department) => <span className="font-medium">{row.dept_code}</span>,
    },
    {
      header: 'Department Name',
      accessor: (row: Department) => row.name,
    },
    {
      header: 'Batches',
      accessor: (row: Department) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{row.batches_count}</span>
        </Badge>
      ),
    },
    {
      header: 'Students',
      accessor: (row: Department) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{row.students_count}</span>
        </Badge>
      ),
    },
    {
      header: 'Faculties',
      accessor: (row: Department) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{row.faculties_count}</span>
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Department) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          {(isCollegeAdmin || (isDepartmentAdmin && row.id === user?.department_id)) && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit size={14} />}
              onClick={() => openEditModal(row)}
            >
              Edit
            </Button>
          )}
          {isCollegeAdmin && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => openDeleteModal(row)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
      className: 'w-44',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Departments</h1>
        {isCollegeAdmin && (
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
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Department
            </Button>
          </div>
        )}
      </div>

      {/* Search & Count */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          {isCollegeAdmin && (
            <SearchInput
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
          <span className="mt-2 sm:mt-0 text-sm">
            Total: <strong>{departments.length}</strong> {(isDepartmentAdmin || isClassAdmin) ? 'department' : 'departments'}
          </span>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={departments}
          keyField="id"
          isLoading={isLoading}
        />
      </Card>

      {/* Add Modal (only for college admins) */}
      {isCollegeAdmin && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Department"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAdd}>
                Add Department
              </Button>
            </>
          }
        >
          <Input
            label="Department Code"
            placeholder="e.g. CSE"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            required
          />
          <Input
            label="Department Name"
            placeholder="e.g. Computer Science"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            required
          />
        </Modal>
      )}

      {/* Edit Modal (for college or department admins) */}
      {(isCollegeAdmin || isDepartmentAdmin) && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Department"
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
          <Input
            label="Department Code"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            required
          />
          <Input
            label="Department Name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            required
          />
        </Modal>
      )}

      {/* Delete Modal (only for college admins) */}
      {isCollegeAdmin && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Department"
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
            Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>?
          </p>
          <p className="mt-2 text-[#FF3333]">This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
};

export default DepartmentsPage;