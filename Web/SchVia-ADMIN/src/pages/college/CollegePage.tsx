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
import { CollegeDetails, DashboardStats } from '../../types';

const CollegePage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [collegeDetails, setCollegeDetails] = useState<CollegeDetails | null>(null);
  const [formData, setFormData] = useState<CollegeDetails | null>(null);
  const [loadingCollege, setLoadingCollege] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    faculties: 0,
    departments: 0,
    batches: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCollege() {
      if (!user?.college_id) {
        setError('No college ID provided.');
        setLoadingCollege(false);
        return;
      }
      console.log('User:', user);
      const data = await fetchCollegeDetails(user.college_id);
      if (data) {
        setCollegeDetails(data);
        setFormData({ ...data, address: data.address || '' });
      } else {
        setError('Failed to load college details.');
      }
      setLoadingCollege(false);
    }
    loadCollege();
  }, [user]);

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
    if (!formData || !user || user.role !== 'college') {
      setError('Unauthorized. Only college admins can edit details.');
      return;
    }
    console.log('Submitting with role:', user.role, 'FormData:', formData);
    const { success, message } = await updateCollegeDetails(
      { ...formData, address: formData.address },
      user.role
    );
    if (success) {
      setCollegeDetails(formData);
      setIsEditModalOpen(false);
      setError(null);
    } else {
      setError(message || 'Failed to update college details.');
    }
  };

  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const subTextColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';

  if (loadingCollege || loadingStats) {
    return <p className="text-center mt-10 text-lg">Loading...</p>;
  }

  if (error) {
    return <p className="text-center mt-10 text-lg text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">College Management</h1>
      </div>

      {collegeDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="College Details" className="h-full">
              <div className="flex flex-col md:flex-row md:items-start">
                <div className="mb-4 md:mb-0 md:mr-8 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-[#6A5ACD] flex items-center justify-center text-white">
                    {collegeDetails.logo && collegeDetails.logo !== 'N/A' ? (
                      <img
                        src={collegeDetails.logo}
                        alt={`${collegeDetails.name} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-[#6A5ACD]"><svg>...</svg></div>'.replace(
                            '<svg>...</svg>',
                            '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/><path d="M14 2v6h6"/><path d="M8 12h8"/><path d="M10 10v4"/></svg>'
                          );
                        }}
                      />
                    ) : (
                      <School size={64} />
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <h2 className={`text-2xl font-bold ${textColor}`}>{collegeDetails.name}</h2>
                  <p className={`text-sm ${subTextColor}`}>College Code: {collegeDetails.college_code}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Address" value={collegeDetails.address} />
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

          <div>
            <Card title="College Overview" className="h-64">
              <OverviewItem
                label="Departments"
                value={stats.departments ?? 'N/A'}
                subTextColor={subTextColor}
              />
              <OverviewItem label="Total Students" value={stats.students} subTextColor={subTextColor} />
              <OverviewItem label="Total Faculties" value={stats.faculties} subTextColor={subTextColor} />
              <OverviewItem label="Active Batches" value={stats.batches} subTextColor={subTextColor} />
              <OverviewItem label="Current Semester" value="Even Sem 2025" subTextColor={subTextColor} />
            </Card>
          </div>
        </div>
      )}

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
            <Input
              label="College Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="College Code"
              name="college_code"
              value={formData.college_code}
              onChange={() => {}}
              disabled
              required
            />
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
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
            <Input
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Logo URL"
              name="logo"
              value={formData.logo}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
            />
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