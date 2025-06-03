// src/pages/AttendancePage.tsx
import React, { useEffect, useState } from 'react';
import { PlusCircle, Download, Upload, Calendar, Users } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import SelectInput from '../../components/ui/SelectInput';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAttendanceFilters, FilterOption } from '../../constants/fetchAttendanceFilters';
import { getAttendanceRecords, AttendanceRecord } from '../../constants/fetchAttendanceDetails';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const collegeId = user?.college_id;
  if (!collegeId) return null;

  // filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSection, setSelectedSection]    = useState('');
  const [selectedSubject, setSelectedSubject]    = useState('');

  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [sections,    setSections]    = useState<FilterOption[]>([]);
  const [subjects,    setSubjects]    = useState<FilterOption[]>([]);
  const [records,     setRecords]     = useState<AttendanceRecord[]>([]);
  const [loading,     setLoading]     = useState(false);

  // load filter dropdowns
  useEffect(() => {
    getAttendanceFilters(collegeId).then(f =>
      f && (setDepartments(f.departments), setSections(f.sections), setSubjects(f.subjects))
    );
  }, [collegeId]);

  // load attendance whenever any filter/search changes
  useEffect(() => {
    setLoading(true);
    getAttendanceRecords({
      college_id:     collegeId,
      department_id:  selectedDepartment,
      section_id:     selectedSection,
      subject_id:     selectedSubject,
      search:         searchQuery
    })
    .then(recs => recs && setRecords(recs))
    .finally(() => setLoading(false));
  }, [collegeId, searchQuery, selectedDepartment, selectedSection, selectedSubject]);

  const columns = [
    { header: 'Date',       
      accessor: (r: AttendanceRecord) => 
      <Badge variant="primary" size="sm">
        <span className=" text-[#6A5ACD] dark:text-[#1a1a40 ]">
        {r.date}
        </span>
        </Badge>
    },
    { header: 'Period',
      accessor: (r: AttendanceRecord) => 
      <Badge variant="primary" size="sm">
        <span className=" text-[#6A5ACD] dark:text-[#1a1a40 ]">
        {r.period_time}
        </span>
        </Badge>
    },
    { header: 'Department', accessor: (r: AttendanceRecord) => r.department },
    {
      header: 'Batch Year',
      accessor: (r: AttendanceRecord) => 
      <Badge variant="primary" size="sm">
        <span className=" text-[#6A5ACD] dark:text-[#1a1a40 ]">
        {r.batch_year}
        </span>
        </Badge>
    },
    {
      header: 'Semester',
      accessor: (r: AttendanceRecord) => 
      <Badge variant="primary" size="sm">
        <span className=" text-[#6A5ACD] dark:text-[#1a1a40 ]">
        {r.semester_no}
        </span>
      </Badge>
    },
    { header: 'Subject',    accessor: (r: AttendanceRecord) => r.subject,    className: 'font-medium' },
    { header: 'Faculty',    accessor: (r: AttendanceRecord) => r.faculty },
    { header: 'Total Students',      accessor: (r: AttendanceRecord) =>
      <Badge variant="primary" size="sm">
        <span className=" text-[#6A5ACD] dark:text-[#1a1a40 ]">
        {r.total_students}
        </span>
      </Badge>
      
     },
    {
      header: 'Present',
      accessor: (r: AttendanceRecord) => <Badge variant="success" size="sm">{r.present}</Badge>
    },
    {
      header: 'Absent',
      accessor: (r: AttendanceRecord) => <Badge variant="danger" size="sm">{r.absent}</Badge>
    },
    {
      header: 'Percent',
      accessor: (r: AttendanceRecord) => {
       // coerce to number just in case it's a string
       const pct = Number(r.percentage) || 0;
       const cls = pct >= 75 ? 'text-green-600' : 'text-red-600';
       return <span className={cls}>{pct.toFixed(2)}%</span>;
     },
    },
    {
      header: 'Actions',
      accessor: (r: AttendanceRecord) => (
        <Button variant="outline" size="sm" icon={<Users size={14} />}>
          Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" icon={<Download size={16} />}>Export</Button>
          <Button variant="outline" icon={<Upload   size={16} />}>Import</Button>
          <Button variant="primary" icon={<Calendar size={16} />}>Take Attendance</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SearchInput
            placeholder="Search…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <SelectInput
            placeholder="Department"
            options={[{ value: '', label: 'All Departments' }, ...departments]}
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
          />
          <SelectInput
            placeholder="Section"
            options={[{ value: '', label: 'All Sections' }, ...sections]}
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
          />
          <SelectInput
            placeholder="Subject"
            options={[{ value: '', label: 'All Subjects' }, ...subjects]}
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          />
          <div className="flex items-end"><span>Total: <strong>{records.length}</strong></span></div>
        </div>

        

        <Table
          columns={columns}
          data={records}
          keyField="session_id"
          isLoading={loading}
          emptyMessage="No attendance records found."
        />
      </Card>
    </div>
  );
};

export default AttendancePage;
