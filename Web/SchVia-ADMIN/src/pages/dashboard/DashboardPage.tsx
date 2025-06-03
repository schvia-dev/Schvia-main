import React, { useEffect,useState  } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Grid3X3,
  PlusCircle,
  Edit,
  Trash2,
  ClipboardCheck
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import RecentActivityCard from '../../components/dashboard/RecentActivityCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { DashboardStats, AttendanceData } from '../../types';
import {fetchDashboardStats} from '../../constants/fetchDashboardStats';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    faculties: 0,
    departments: 0, // Optional, depends on role
    batches: 0,     // Optional, depends on role
    sections: 0,
  });

// For attendanceData (initialize as empty array)
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  useEffect(() => {
  const loadStats = async () => {
    const data = await fetchDashboardStats(user);
    console.log(data, "fvsmkldf");
    
    if (data) {
      setStats(data.stats);
      setAttendanceData(data.attendanceData);
    }
  };

  if (user) loadStats();
}, [user]);

  
  // Mock data for recent activities
  const recentActivities = [
    {
      id: 1,
      action: 'Added new student',
      user: 'Admin',
      timestamp: '2 hours ago',
      target: 'Rahul Sharma was added to CSE 3rd Year',
      icon: <PlusCircle size={18} />
    },
    {
      id: 2,
      action: 'Updated faculty details',
      user: 'Admin',
      timestamp: '4 hours ago',
      target: 'Dr. Priya Patel\'s contact information was updated',
      icon: <Edit size={18} />
    },
    {
      id: 3,
      action: 'Deleted section',
      user: 'Admin',
      timestamp: '1 day ago',
      target: 'Section D of ECE 2nd Year was removed',
      icon: <Trash2 size={18} />
    },
    {
      id: 4,
      action: 'Marked attendance',
      user: 'Admin',
      timestamp: '1 day ago',
      target: 'Attendance for Database Systems class on 15 May was recorded',
      icon: <ClipboardCheck size={18} />
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div>
          <Button 
            variant="primary" 
            size="md"
            icon={<PlusCircle size={16} />}
          >
            Quick Add
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.students}
          icon={<Users size={20} />}
          change={{ value: 5, type: 'increase' }}
          color="#6A5ACD"
        />
        
        <StatsCard
          title="Total Faculties"
          value={stats.faculties}
          icon={<GraduationCap size={20} />}
          color="#4CAF50"
        />
        
        <StatsCard
          title={user?.role === 'college' ? 'Departments' : 'Batches'}
          value={user?.role === 'college' ? stats.departments ?? "N'A" : stats.batches ?? "N'A"} // Provide 0 if undefined
          icon={<Building2 size={20} />}
          color={user?.role === 'college' ? '#FFC107' : '#FFC107'}
        />


        
        <StatsCard
          title="Sections"
          value={stats.sections}
          icon={<Grid3X3 size={20} />}
          change={{ value: 2, type: 'increase' }}
          color="#FF4C4C"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart 
            data={attendanceData} 
            title="Department-wise Attendance"
          />
        </div>
        
        <div>
          <RecentActivityCard activities={recentActivities} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Links">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              fullWidth
              icon={<Users size={16} />}
            >
              Manage Students
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              icon={<GraduationCap size={16} />}
            >
              Manage Faculty
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              icon={<ClipboardCheck size={16} />}
            >
              Record Attendance
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              icon={<Grid3X3 size={16} />}
            >
              Timetable
            </Button>
          </div>
        </Card>
        
        <Card title="College Information">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">College Name</p>
              <p className="font-medium">
                {user?.college_name}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">College Code</p>
              <p className="font-medium">
                {user?.college_code}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Admin Login</p>
              <p className="font-medium">{user?.username}</p>
            </div>
            
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit size={14} />}
              >
                Edit College Details
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;