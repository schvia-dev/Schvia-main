import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Grid3X3,
  ClipboardCheck 
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { DashboardStats } from '../../types';
import { fetchDashboardStats } from '../../constants/fetchDashboardStats';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    faculties: 0,
    departments: 0,
    batches: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      const data = await fetchDashboardStats(user);
      if (data) {
        setStats(data.stats);
        setError(null);
      } else {
        setError('Failed to load dashboard statistics');
      }
    };

    loadStats();
  }, [user]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.students}
          icon={<Users size={20} />}
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
          value={user?.role === 'college' ? stats.departments ?? "N/A" : stats.batches ?? "N/A"}
          icon={<Building2 size={20} />}
          color="#FFC107"
        />

        <StatsCard
          title="Batches"
          value={stats.batches}
          icon={<Grid3X3 size={20} />}
          color="#FF4C4C"
        />
      </div>
      
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
    </div>
  );
};

export default DashboardPage;