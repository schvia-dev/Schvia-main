import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Download,
  Upload,
  Users,
  Edit,
  Trash2,
  BookOpen,
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
import { Section } from '../../types';
import {
  getSections,
  addSection,
  updateSection,
  deleteSection,
} from '../../constants/fetchSections';
import {
  fetchDepartmentOptions,
  fetchBatchYearOptions,
} from '../../constants/fetchSectionsFilters';

const SectionsPage: React.FC = () => {
  const { user } = useAuth();
  const collegeId = user?.college_id;
  if (!collegeId) return null;

  // Filters + data
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic filter options
  const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
  const [batchYearOptions, setBatchYearOptions] = useState<{ value: string; label: string }[]>([]);

  // Modal & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    section_code: '',
    name: '',
    department_id: '',
    batch_year: '',
  });

  // Role checks
  const isCollegeAdmin = user?.role === 'college_admin';
  const isDepartmentAdmin = user?.role === 'department_admin';
  const isClassAdmin = user?.role === 'class_admin';
  const isRestrictedAdmin = isClassAdmin; // Only class_admin is read-only
  const canPerformCrud = isCollegeAdmin || isDepartmentAdmin;

  // Load department & batch filters
  useEffect(() => {
    if (isDepartmentAdmin || isClassAdmin) {
      // For department/class admins, set department to their own department_id
      setDepartmentOptions([
        { value: String(user.department_id), label: user.department_name || 'My Department' },
      ]);
      setFormData(prev => ({ ...prev, department_id: String(user.department_id) }));
      return;
    }

    // For college_admin, load all departments
    (async () => {
      try {
        const deps = await fetchDepartmentOptions(collegeId);
        setDepartmentOptions([{ value: '', label: 'All Departments' }, ...deps]);
        const yrs = await fetchBatchYearOptions(collegeId);
        setBatchYearOptions([{ value: '', label: 'All Batch Years' }, ...yrs]);
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    })();
  }, [collegeId, isDepartmentAdmin, isClassAdmin, user?.department_id, user?.department_name]);

  // Load sections on filter change
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        // For department/class admins, filter by their department_id
        const deptFilter = isDepartmentAdmin || isClassAdmin ? String(user.department_id) : selectedDepartment;
        const secs = await getSections(collegeId, searchQuery, deptFilter, selectedBatchYear);
        setSections(secs);
      } catch (err: any) {
        setErrorMsg(err.message);
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
      section_code: '',
      name: '',
      department_id: isDepartmentAdmin ? String(user.department_id) : '',
      batch_year: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (sec: Section) => {
    if (!canPerformCrud) return;
    // For department_admin, ensure the section belongs to their department
    if (isDepartmentAdmin && sec.department_id !== user.department_id) {
      setErrorMsg('You can only edit sections in your department.');
      return;
    }
    setSelectedSection(sec);
    setFormData({
      section_code: sec.section_code,
      name: sec.name,
      department_id: String(sec.department_id),
      batch_year: String(sec.batch_year),
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (sec: Section) => {
    if (!canPerformCrud) return;
    // For department_admin, ensure the section belongs to their department
    if (isDepartmentAdmin && sec.department_id !== user.department_id) {
      setErrorMsg('You can only delete sections in your department.');
      return;
    }
    setSelectedSection(sec);
    setIsDeleteModalOpen(true);
  };

  const handleAdd = async () => {
    if (!canPerformCrud) return;
    const deptId = Number(formData.department_id);
    const batch = Number(formData.batch_year);
    if (!deptId || deptId <= 0) {
      setErrorMsg('Please select a Department.');
      return;
    }
    if (!batch || batch <= 0) {
      setErrorMsg('Please enter a valid Batch Year.');
      return;
    }
    // For department_admin, ensure department_id matches user.department_id
    if (isDepartmentAdmin && deptId !== user.department_id) {
      setErrorMsg('You can only add sections to your department.');
      return;
    }
    try {
      const newSec = await addSection(
        formData.section_code,
        formData.name,
        deptId,
        batch
      );
      setSections(prev => [...prev, newSec]);
      setIsAddModalOpen(false);
      setFormData({ section_code: '', name: '', department_id: isDepartmentAdmin ? String(user.department_id) : '', batch_year: '' });
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleEdit = async () => {
    if (!canPerformCrud || !selectedSection) return;
    const deptId = Number(formData.department_id);
    const batch = Number(formData.batch_year);
    if (!deptId || deptId <= 0) {
      setErrorMsg('Please select a Department.');
      return;
    }
    if (!batch || batch <= 0) {
      setErrorMsg('Please enter a valid Batch Year.');
      return;
    }
    // For department_admin, ensure department_id matches user.department_id
    if (isDepartmentAdmin && deptId !== user.department_id) {
      setErrorMsg('You can only edit sections in your department.');
      return;
    }
    try {
      const updated = await updateSection(
        selectedSection.id,
        formData.section_code,
        formData.name,
        deptId,
        batch
      );
      setSections(prev =>
        prev.map(s => (s.id === updated.id ? updated : s))
      );
      setIsEditModalOpen(false);
      setSelectedSection(null);
      setFormData({ section_code: '', name: '', department_id: isDepartmentAdmin ? String(user.department_id) : '', batch_year: '' });
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async () => {
    if (!canPerformCrud || !selectedSection) return;
    try {
      await deleteSection(selectedSection.id);
      setSections(prev => prev.filter(s => s.id !== selectedSection.id));
      setIsDeleteModalOpen(false);
      setSelectedSection(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const columns = [
    {
      header: 'Section Name',
      accessor: (r: Section) => <span className="font-medium">{r.name}</span>,
    },
    {
      header: 'Section Code',
      accessor: (r: Section) => r.section_code,
    },
    {
      header: 'Department',
      accessor: (r: Section) => r.department_name,
    },
    {
      header: 'Batch Year',
      accessor: (r: Section) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.batch_year}</span>
        </Badge>
      ),
    },
    {
      header: 'Students',
      accessor: (r: Section) => (
        <Badge variant="primary" size="sm">
          <span className="text-[#6A5ACD] dark:text-[#1a1a40]">{r.students_count}</span>
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (r: Section) => (
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          <Button variant="outline" size="sm" icon={<Users size={14} />} onClick={() => console.log('View students', r.id)}>
            Students
          </Button>
          <Button variant="outline" size="sm" icon={<BookOpen size={14} />} onClick={() => console.log('View subjects', r.id)}>
            Subjects
          </Button>
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
      className: 'w-96',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sections</h1>
        {(isCollegeAdmin || isDepartmentAdmin) && (
          <div className="flex space-x-2">
            {isCollegeAdmin && (
              <>
                <Button variant="outline" icon={<Download size={16} />}>Export</Button>
                <Button variant="outline" icon={<Upload size={16} />}>Import</Button>
              </>
            )}
            <Button variant="primary" icon={<PlusCircle size={16} />} onClick={openAddModal}>
              Add Section
            </Button>
          </div>
        )}
      </div>

      <Card>
        {/* Filters (show only for college_admin) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {isCollegeAdmin && (
            <>
              <SearchInput
                placeholder="Search sections..."
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
              Total: <strong>{sections.length}</strong> {(isDepartmentAdmin || isClassAdmin) ? 'section' : 'sections'}
            </span>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={sections}
          keyField="id"
          isLoading={isLoading}
        />
      </Card>

      {/* Add Section Modal */}
      {(isCollegeAdmin || isDepartmentAdmin) && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Section"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAdd}>Add Section</Button>
            </>
          }
        >
          <Input
            label="Section Code"
            name="section_code"
            value={formData.section_code}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <SelectInput
            label="Department"
            name="department_id"
            options={isDepartmentAdmin ? departmentOptions : [{ value: '', label: 'Select Department' }, ...departmentOptions.filter(opt => opt.value !== '')]}
            value={formData.department_id}
            onChange={handleInputChange}
            required
            disabled={isDepartmentAdmin} // Lock department for department_admin
          />
          <Input
            label="Batch Year"
            name="batch_year"
            type="number"
            list="batchYears"
            placeholder="Type or select year"
            value={formData.batch_year}
            onChange={handleInputChange}
            required
          />
          <datalist id="batchYears">
            {batchYearOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </datalist>
        </Modal>
      )}

      {/* Edit Section Modal */}
      {(isCollegeAdmin || isDepartmentAdmin) && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Section"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleEdit}>Save Changes</Button>
            </>
          }
        >
          <Input
            label="Section Code"
            name="section_code"
            value={formData.section_code}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <SelectInput
            label="Department"
            name="department_id"
            options={isDepartmentAdmin ? departmentOptions : [{ value: '', label: 'Select Department' }, ...departmentOptions.filter(opt => opt.value !== '')]}
            value={formData.department_id}
            onChange={handleInputChange}
            required
            disabled={isDepartmentAdmin} // Lock department for department_admin
          />
          <Input
            label="Batch Year"
            name="batch_year"
            type="number"
            list="batchYears"
            placeholder="Type or select year"
            value={formData.batch_year}
            onChange={handleInputChange}
            required
          />
          <datalist id="batchYears">
            {batchYearOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </datalist>
        </Modal>
      )}

      {/* Delete Section Modal */}
      {(isCollegeAdmin || isDepartmentAdmin) && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Section"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </>
          }
        >
          <p>Are you sure you want to delete <strong>{selectedSection?.name}</strong>?</p>
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

export default SectionsPage;