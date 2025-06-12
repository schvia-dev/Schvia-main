import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Download,
  Upload,
  Edit,
  Trash2,
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
import { Batch } from '../../types';
import {
  getBatches,
  addBatch,
  updateBatch,
  deleteBatch,
  fetchDepartmentOptions,
  fetchBatchYearOptions,
} from '../../constants/fetchBatches';

const BatchesPage: React.FC = () => {
  const { user } = useAuth();
  const collegeId = user?.college_id;
  if (!collegeId) return null;

  // Filters + data
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic filter options
  const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
  const [batchYearOptions, setBatchYearOptions] = useState<{ value: string; label: string }[]>([]);

  // Modal & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    batch_code: '',
    name: '',
    department_id: '',
    batch_year: '',
    current_semester: '1',
  });

  // Role checks
  const isCollegeAdmin = user?.role === 'college';
  const isDepartmentAdmin = user?.role === 'department';
  const isClassAdmin = user?.role === 'class';
  const isRestrictedAdmin = isClassAdmin; // Only class admin is read-only
  const canPerformCrud = isCollegeAdmin || isDepartmentAdmin;

  // Load department & batch filters
  useEffect(() => {
    if (isDepartmentAdmin || isClassAdmin) {
      setDepartmentOptions([
        { value: String(user.department_id), label: user.department_name || 'My Department' },
      ]);
      setSelectedDepartment(String(user.department_id));
      setFormData(prev => ({ ...prev, department_id: String(user.department_id) }));
    } else {
      (async () => {
        try {
          const deps = await fetchDepartmentOptions(collegeId);
          setDepartmentOptions([{ value: '', label: 'All Departments' }, ...deps]);
          const yrs = await fetchBatchYearOptions(collegeId);
          setBatchYearOptions(yrs);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to load filters.');
        }
      })();
    }
  }, []);

  // Load batches on filter change
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const deptFilter = isDepartmentAdmin || isClassAdmin ? String(user.department_id) : selectedDepartment;
        const bat = await getBatches(collegeId, searchQuery, deptFilter, selectedBatchYear);
        setBatches(bat);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load batches.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [collegeId, searchQuery, selectedDepartment, selectedBatchYear, isDepartmentAdmin, isClassAdmin, user?.department_id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  const openAddModal = () => {
    if (!canPerformCrud) return;
    setFormData({
      batch_code: '',
      name: '',
      department_id: isDepartmentAdmin ? String(user.department_id) : '',
      batch_year: '',
      current_semester: '1',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (bat: Batch) => {
    if (!canPerformCrud) return;
    if (isDepartmentAdmin && bat.department_id !== user.department_id) {
      setErrorMsg('You can only edit batches in your department.');
      return;
    }
    setSelectedBatch(bat);
    setFormData({
      batch_code: bat.batch_code,
      name: bat.name,
      department_id: String(bat.department_id),
      batch_year: String(bat.batch_year),
      current_semester: String(bat.current_semester),
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (bat: Batch) => {
    if (!canPerformCrud) return;
    if (isDepartmentAdmin && bat.department_id !== user.department_id) {
      setErrorMsg('You can only delete batches in your department.');
      return;
    }
    setSelectedBatch(bat);
    setIsDeleteModalOpen(true);
  };

  const handleAdd = async () => {
    if (!canPerformCrud) return;
    const { batch_code, name, department_id, batch_year, current_semester } = formData;
    if (!batch_code.trim()) {
      setErrorMsg('Batch code is required.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Batch name is required.');
      return;
    }
    const deptId = Number(department_id);
    const batchYearNum = Number(batch_year);
    const semesterNum = Number(current_semester);
    if (!deptId || deptId <= 0) {
      setErrorMsg('Please select a valid department.');
      return;
    }
    if (!batchYearNum || batchYearNum < 2000 || batchYearNum > new Date().getFullYear() + 4) {
      setErrorMsg('Please enter a valid batch year (2000 or later).');
      return;
    }
    if (!semesterNum || semesterNum < 1 || semesterNum > 8) {
      setErrorMsg('Please select a valid semester (1–8).');
      return;
    }
    if (isDepartmentAdmin && deptId !== user.department_id) {
      setErrorMsg('You can only add batches to your department.');
      return;
    }
    try {
      const newBatch = await addBatch(batch_code, name, deptId, batchYearNum, semesterNum);
      setBatches(prev => [...prev, newBatch]);
      setIsAddModalOpen(false);
      setFormData({ batch_code: '', name: '', department_id: isDepartmentAdmin ? String(user.department_id) : '', batch_year: '', current_semester: '1' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add batch.');
    }
  };

  const handleEdit = async () => {
    if (!canPerformCrud || !selectedBatch) return;
    const { batch_code, name, department_id, batch_year, current_semester } = formData;
    if (!batch_code.trim()) {
      setErrorMsg('Batch code is required.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Batch name is required.');
      return;
    }
    const deptId = Number(department_id);
    const batchYearNum = Number(batch_year);
    const semesterNum = Number(current_semester);
    if (!deptId || deptId <= 0) {
      setErrorMsg('Please select a valid department.');
      return;
    }
    if (!batchYearNum || batchYearNum < 2000 || batchYearNum > new Date().getFullYear() + 4) {
      setErrorMsg('Please enter a valid batch year (2000 or later).');
      return;
    }
    if (!semesterNum || semesterNum < 1 || semesterNum > 8) {
      setErrorMsg('Please select a valid semester (1–8).');
      return;
    }
    if (isDepartmentAdmin && deptId !== user.department_id) {
      setErrorMsg('You can only edit batches in your department.');
      return;
    }
    try {
      const updated = await updateBatch(selectedBatch.id, batch_code, name, deptId, batchYearNum, semesterNum);
      setBatches(prev => prev.map(b => (b.id === updated.id ? updated : b)));
      setIsEditModalOpen(false);
      setSelectedBatch(null);
      setFormData({ batch_code: '', name: '', department_id: isDepartmentAdmin ? String(user.department_id) : '', batch_year: '', current_semester: '1' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update batch.');
    }
  };

  const handleDelete = async () => {
    if (!canPerformCrud || !selectedBatch) return;
    try {
      await deleteBatch(selectedBatch.id);
      setBatches(prev => prev.filter(b => b.id !== selectedBatch.id));
      setIsDeleteModalOpen(false);
      setSelectedBatch(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete batch.');
    }
  };

  const columns = [
    {
      header: 'Batch Name',
      accessor: (r: Batch) => <span className="font-medium">{r.name}</span>,
    },
    {
      header: 'Batch Code',
      accessor: (r: Batch) => r.batch_code,
    },
    {
      header: 'Department',
      accessor: (r: Batch) => r.department_name,
    },
    {
      header: 'Batch Year',
      accessor: (r: Batch) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.batch_year}</span>
        </Badge>
      ),
    },
    {
      header: 'Semester',
      accessor: (r: Batch) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.current_semester}</span>
        </Badge>
      ),
    },
    {
      header: 'Students',
      accessor: (r: Batch) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.students_count}</span>
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (r: Batch) => (
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          {canPerformCrud && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Edit size={14} />}
                onClick={() => openEditModal(r)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => openDeleteModal(r)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
      className: 'w-48', // Adjusted width since fewer buttons
    },
  ];

  const semesterOptions = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' },
    { value: '7', label: 'Semester 7' },
    { value: '8', label: 'Semester 8' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Batches</h1>
        {(isCollegeAdmin || isDepartmentAdmin) && (
          <div className="flex space-x-2">
            {isCollegeAdmin && (
              <>
                <Button variant="outline" icon={<Download size={16} />}>Export</Button>
                <Button variant="outline" icon={<Upload size={16} />}>Import</Button>
              </>
            )}
            <Button variant="primary" icon={<PlusCircle size={16} />} onClick={openAddModal}>
              Add Batch
            </Button>
          </div>
        )}
      </div>

      <Card>
        {/* Filters (show only for college admin) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {isCollegeAdmin && (
            <>
              <SearchInput
                placeholder="Search batches..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <SelectInput
                placeholder="All Departments"
                name="department_id"
                value={selectedDepartment}
                options={departmentOptions}
                onChange={e => setSelectedDepartment(e.target.value)}
              />
              <SelectInput
                placeholder="All Batch Years"
                name="batch_year"
                value={selectedBatchYear}
                options={batchYearOptions}
                onChange={e => setSelectedBatchYear(e.target.value)}
              />
            </>
          )}
          <div className="flex items-end">
            <span className="text-sm">
              Total: <strong>{batches.length}</strong> {batches.length === 1 ? 'batch' : 'batches'}
            </span>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={batches}
          keyField="id"
          isLoading={isLoading}
        />
      </Card>

      {/* Add Batch Modal */}
      {(isCollegeAdmin || isDepartmentAdmin) && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Batch"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAdd}>Add Batch</Button>
            </>
          }
        >
          <Input
            label="Batch Code"
            name="batch_code"
            value={formData.batch_code}
            onChange={handleInputChange}
            placeholder="e.g., CSE-2022-A"
            required
          />
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., CSE Section A 2022"
            required
          />
          <SelectInput
            label="Department"
            name="department_id"
            options={isDepartmentAdmin ? departmentOptions : [{ value: '', label: 'Select Department' }, ...departmentOptions.filter(opt => opt.value !== '')]}
            value={formData.department_id}
            onChange={handleInputChange}
            required
            disabled={isDepartmentAdmin}
          />
          <Input
            label="Batch Year"
            name="batch_year"
            type="number"
            placeholder="e.g., 2022"
            value={formData.batch_year}
            onChange={handleInputChange}
            required
            min="2000"
            max={new Date().getFullYear() + 4}
          />
          <SelectInput
            label="Current Semester"
            name="current_semester"
            options={semesterOptions}
            value={formData.current_semester}
            onChange={handleInputChange}
            required
          />
        </Modal>
      )}

      {/* Edit Batch Modal */}
      {(isCollegeAdmin || isDepartmentAdmin) && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Batch"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleEdit}>Save Changes</Button>
            </>
          }
        >
          <Input
            label="Batch Code"
            name="batch_code"
            value={formData.batch_code}
            onChange={handleInputChange}
            placeholder="e.g., CSE-2022-A"
            required
          />
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., CSE Section A 2022"
            required
          />
          <SelectInput
            label="Department"
            name="department_id"
            options={isDepartmentAdmin ? departmentOptions : [{ value: '', label: 'Select Department' }, ...departmentOptions.filter(opt => opt.value !== '')]}
            value={formData.department_id}
            onChange={handleInputChange}
            required
            disabled={isDepartmentAdmin}
          />
          <Input
            label="Batch Year"
            name="batch_year"
            type="number"
            placeholder="e.g., 2022"
            value={formData.batch_year}
            onChange={handleInputChange}
            required
            min="2000"
            max={new Date().getFullYear() + 4}
          />
          <SelectInput
            label="Current Semester"
            name="current_semester"
            options={semesterOptions}
            value={formData.current_semester}
            onChange={handleInputChange}
            required
          />
        </Modal>
      )}

      {/* Delete Batch Modal */}
      {(isCollegeAdmin || isDepartmentAdmin) && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Batch"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </>
          }
        >
          <p>Are you sure you want to delete <strong>{selectedBatch?.name}</strong>?</p>
          <p className="mt-2 text-[#FF4C4C]">This action cannot be undone.</p>
        </Modal>
      )}

      {/* Error Modal */}
      <Modal
        isOpen={!!errorMsg}
        onClose={() => setErrorMsg(null)}
        title="Error"
        footer={
          <Button variant="primary" onClick={() => setErrorMsg(null)}>OK</Button>
        }
      >
        <p>{errorMsg}</p>
      </Modal>
    </div>
  );
};

export default BatchesPage;