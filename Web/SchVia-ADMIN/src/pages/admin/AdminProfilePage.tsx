// src/pages/AdminProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { User, Key, Building2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  fetchProfilePageDetails,
  updateProfileDetails,
  changePassword,
  AdminProfile,
} from '../../constants/fetchProfilePageDetails';
import { useAuth } from '../../context/AuthContext';

const AdminProfilePage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth(); // assume user.id exists

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_number: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user?.id) {
      setError('User ID not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfilePageDetails(user.id)
      .then((p) => {
        setProfile(p);
        setFormData((fd) => ({
          ...fd,
          name: p.name,
          email: p.email,
          contact_number: p.contact_number || '',
        }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      await updateProfileDetails(
        user!.id,
        formData.name,
        formData.email,
        formData.contact_number || undefined
      );
      setProfile((p) =>
        p
          ? {
              ...p,
              name: formData.name,
              email: formData.email,
              contact_number: formData.contact_number || 'N/A',
            }
          : p
      );
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setError(null);
      await changePassword(user!.id, formData.currentPassword, formData.newPassword);
      setFormData((fd) => ({
        ...fd,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!profile) return <p>No profile data.</p>;

  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const subTextColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';

  return (
    <div className="space-y-6">
      {/* Header + Manage button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Profile</h1>
        {profile.role === 'college' && (
          <Button
            variant="primary"
            icon={<Building2 size={16} />}
            onClick={() => navigate('/admin/management')}
          >
            Manage Department Admins
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <div className="lg:col-span-2">
          <Card title="Profile Details" className="h-full">
            <div className="flex flex-col md:flex-row md:items-start">
              <div className="mb-4 md:mb-0 md:mr-8 flex items-center justify-center">
                <div className="w-32 h-32 rounded-lg bg-[#6A5ACD] flex items-center justify-center text-white">
                  <User size={64} />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className={`text-2xl font-bold ${textColor}`}>
                    {profile.name}
                  </h2>
                  <p className={`text-sm ${subTextColor}`}>
                    {profile.role === 'college'
                      ? 'College Administrator'
                      : profile.role === 'department'
                      ? 'Department Administrator'
                      : 'Class Administrator'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <h3 className={`text-sm font-medium ${subTextColor}`}>
                      Name
                    </h3>
                    <p className={textColor}>{profile.name}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <h3 className={`text-sm font-medium ${subTextColor}`}>
                      Email
                    </h3>
                    <p className={textColor}>{profile.email}</p>
                  </div>

                  {/* Contact Number */}
                  <div>
                    <h3 className={`text-sm font-medium ${subTextColor}`}>
                      Contact Number
                    </h3>
                    <p className={textColor}>{profile.contact_number || 'N/A'}</p>
                  </div>

                  {profile.college_id != null && (
                    <div>
                      <h3 className={`text-sm font-medium ${subTextColor}`}>
                        College
                      </h3>
                      <p className={textColor}>
                        {profile.college_name} ({profile.college_code})
                      </p>
                    </div>
                  )}
                  {profile.department_id != null && (
                    <div>
                      <h3 className={`text-sm font-medium ${subTextColor}`}>
                        Department
                      </h3>
                      <p className={textColor}>
                        {profile.department_name} ({profile.department_code})
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex space-x-4">
                  <Button
                    variant="primary"
                    icon={<User size={16} />}
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    icon={<Key size={16} />}
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setError(null);
        }}
        title="Edit Profile"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateProfile}>
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
            label="Contact Number"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleInputChange}
          />
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setError(null);
        }}
        title="Change Password"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdatePassword}>
              Update Password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange}
            required
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminProfilePage;