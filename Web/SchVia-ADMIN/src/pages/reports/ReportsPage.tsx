import React, { useState } from 'react';
import { Download, BarChart3, PieChart, Users } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SelectInput from '../../components/ui/SelectInput';
import { useTheme } from '../../context/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ReportsPage: React.FC = () => {
  const { theme } = useTheme();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateRange, setDateRange] = useState('');

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    { value: '1', label: 'CSE' },
    { value: '2', label: 'ECE' },
    { value: '3', label: 'AIML' },
  ];

  const sectionOptions = [
    { value: '', label: 'All Sections' },
    { value: '1', label: 'Section A' },
    { value: '2', label: 'Section B' },
    { value: '3', label: 'Section C' },
  ];

  const subjectOptions = [
    { value: '', label: 'All Subjects' },
    { value: '1', label: 'Advanced Algorithms' },
    { value: '2', label: 'Database Systems' },
    { value: '3', label: 'Machine Learning' },
  ];

  const dateRangeOptions = [
    { value: '', label: 'Select Date Range' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'semester', label: 'This Semester' },
  ];

  // Mock data for charts
  const attendanceData = [
    { name: 'CSE-A', present: 90, absent: 10 },
    { name: 'CSE-B', present: 85, absent: 15 },
    { name: 'ECE-A', present: 88, absent: 12 },
    { name: 'AIML-A', present: 92, absent: 8 },
  ];

  const subjectWiseData = [
    { subject: 'Advanced Algorithms', attendance: 88 },
    { subject: 'Database Systems', attendance: 92 },
    { subject: 'Machine Learning', attendance: 85 },
    { subject: 'Web Technologies', attendance: 90 },
  ];

  const textColor = theme === 'light' ? '#333' : '#E5E5E5';
  const gridColor = theme === 'light' ? '#e0e0e0' : '#444444';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance Reports</h1>
        <Button
          variant="outline"
          icon={<Download size={16} />}
        >
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SelectInput
          placeholder="Select Department"
          options={departmentOptions}
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        />
        <SelectInput
          placeholder="Select Section"
          options={sectionOptions}
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
        />
        <SelectInput
          placeholder="Select Subject"
          options={subjectOptions}
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        />
        <SelectInput
          placeholder="Select Date Range"
          options={dateRangeOptions}
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Section-wise Attendance">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: textColor }} />
                <YAxis tick={{ fill: textColor }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'light' ? '#fff' : '#3F3D56',
                    borderColor: theme === 'light' ? '#e0e0e0' : '#555',
                    color: textColor,
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#4CAF50" name="Present" />
                <Bar dataKey="absent" fill="#FF4C4C" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Subject-wise Attendance">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="subject" tick={{ fill: textColor }} />
                <YAxis tick={{ fill: textColor }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'light' ? '#fff' : '#3F3D56',
                    borderColor: theme === 'light' ? '#e0e0e0' : '#555',
                    color: textColor,
                  }}
                />
                <Bar dataKey="attendance" fill="#6A5ACD" name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Attendance</h3>
            <BarChart3 size={20} className="text-[#6A5ACD]" />
          </div>
          <div className="text-3xl font-bold text-[#6A5ACD]">87.5%</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Average across all sections
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Students Below 75%</h3>
            <Users size={20} className="text-[#FF4C4C]" />
          </div>
          <div className="text-3xl font-bold text-[#FF4C4C]">12</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Requires attention
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Perfect Attendance</h3>
            <PieChart size={20} className="text-[#4CAF50]" />
          </div>
          <div className="text-3xl font-bold text-[#4CAF50]">45</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            100% attendance
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;