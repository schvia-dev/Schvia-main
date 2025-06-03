import React, { useEffect, useState } from 'react';
import { Edit, School } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { fetchCollegeDetails, updateCollegeDetails } from '../../constants/fetchCollegeDetails';
import { fetchDashboardStats } from '../../constants/fetchDashboardStats';
import { DashboardStats } from '../../types';

interface CollegeDetails {
  id: number;
  college_code: string;
  name: string;
  location: string;
  established: string;
  contact_email: string;
  contact_phone: string;
  website: string;
}

const CollegePage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // College info
  const [collegeDetails, setCollegeDetails] = useState<CollegeDetails | null>(null);
  const [formData, setFormData] = useState<CollegeDetails | null>(null);
  const [loadingCollege, setLoadingCollege] = useState(true);

  // Overview stats
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    faculties: 0,
    departments: 0,
    batches: 0,
    sections: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load college details
  useEffect(() => {
    async function loadCollege() {
      if (!user?.college_id) return;
      const data = await fetchCollegeDetails(user.college_id);
      if (data) {
        setCollegeDetails(data);
        setFormData(data);
      }
      setLoadingCollege(false);
    }
    loadCollege();
  }, [user]);

  // Load overview stats (only for college role)
  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      const res = await fetchDashboardStats(user);
      if (res) setStats(res.stats);
      setLoadingStats(false);
    }
    loadStats();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!formData) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (formData && user?.role === 'college') {
      const success = await updateCollegeDetails(formData, user.role);
      if (success) {
        alert('College details updated successfully.');
        setCollegeDetails(formData);
        setIsEditModalOpen(false);
      } else {
        alert('Failed to update college details.');
      }
    } else {
      alert('Unauthorized. Only college admins can edit details.');
    }
  };

  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const subTextColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';

  if (loadingCollege || loadingStats) {
    return <p className="text-center mt-10 text-lg">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">College Management</h1>
      </div>

      {collegeDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* College Details */}
          <div className="lg:col-span-2">
            <Card title="College Details" className="h-full">
              <div className="flex flex-col md:flex-row md:items-start">
                <div className="mb-4 md:mb-0 md:mr-8 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-lg bg-[#6A5ACD] flex items-center justify-center text-white">
                    <School size={64} />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <h2 className={`text-2xl font-bold ${textColor}`}>{collegeDetails.name}</h2>
                  <p className={`text-sm ${subTextColor}`}>College Code: {collegeDetails.college_code}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Location" value={collegeDetails.location} />
                    <DetailItem label="Established" value={collegeDetails.established} />
                    <DetailItem label="Email" value={collegeDetails.contact_email} />
                    <DetailItem label="Phone" value={collegeDetails.contact_phone} />
                    <DetailItem label="Website" value={collegeDetails.website} />
                  </div>
                  {user?.role === 'college' && (
                    <div className="pt-4">
                      <Button
                        variant="primary"
                        icon={<Edit size={16} />}
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        Edit College Details
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* College Overview */}
          <div>
            <Card title="College Overview" className="h-64">
              <OverviewItem
                label="Departments"
                value={stats.departments ?? 'N/A'}
                subTextColor={subTextColor}
              />
              <OverviewItem label="Total Students" value={stats.students} subTextColor={subTextColor} />
              <OverviewItem label="Total Faculties" value={stats.faculties} subTextColor={subTextColor} />
              <OverviewItem label="Active Sections" value={stats.sections} subTextColor={subTextColor} />
              {/* <OverviewItem label="" value="" subTextColor={subTextColor} /> */}
              <OverviewItem label="Current Semester" value="Even Sem 2025" subTextColor={subTextColor} />
            </Card>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit College Details"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save Changes
            </Button>
          </>
        }
      >
        {formData && (
          <div className="space-y-4">
            <Input label="College Name" name="name" value={formData.name} onChange={handleInputChange} required />
            <Input
              label="College Code"
              name="college_code"
              value={formData.college_code}
              onChange={() => {}}
              disabled
              required
            />
            <Input label="Location" name="location" value={formData.location} onChange={handleInputChange} required />
            <Input
              label="Established Year"
              name="established"
              value={formData.established}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Contact Email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Contact Phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleInputChange}
              required
            />
            <Input label="Website" name="website" value={formData.website} onChange={handleInputChange} required />
          </div>
        )}
      </Modal>
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  const { theme } = useTheme();
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const subTextColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';
  return (
    <div>
      <h3 className={`text-sm font-medium ${subTextColor}`}>{label}</h3>
      <p className={textColor}>{value}</p>
    </div>
  );
};

const OverviewItem: React.FC<{ label: string; value: string | number; subTextColor: string }> = ({
  label,
  value,
  subTextColor,
}) => (
  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
    <span className={subTextColor}>{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default CollegePage;
