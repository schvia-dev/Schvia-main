import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  School, 
  Building2, 
  Users,
  GraduationCap,
  BookOpen,
  Grid3X3,
  X,
  CalendarClock,
  ClipboardCheck,
  BarChart3
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const bgColor = theme === 'light' ? 'bg-white' : 'bg-[#3F3D56]';
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const activeClasses = theme === 'light' 
    ? 'bg-[#6A5ACD]/10 text-[#6A5ACD] font-medium'
    : 'bg-[#6A5ACD]/20 text-[#6A5ACD] font-medium';
  const hoverClasses = theme === 'light'
    ? 'hover:bg-gray-100'
    : 'hover:bg-gray-700';
  
  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/' },
    { name: 'College', icon: <School size={20} />, path: '/college' },
    { name: 'Departments', icon: <Building2 size={20} />, path: '/departments' },
    { name: 'Sections', icon: <Grid3X3 size={20} />, path: '/sections' },
    { name: 'Students', icon: <Users size={20} />, path: '/students' },
    { name: 'Faculties', icon: <GraduationCap size={20} />, path: '/faculties' },
    { name: 'Subjects', icon: <BookOpen size={20} />, path: '/subjects' },
    { name: 'Timetable', icon: <CalendarClock size={20} />, path: '/timetable' },
    { name: 'Attendance', icon: <ClipboardCheck size={20} />, path: '/attendance' },
    { name: 'Reports', icon: <BarChart3 size={20} />, path: '/reports' },
  ];
  
  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`${bgColor} fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-[#6A5ACD]">Admin Portal</h2>
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} className={textColor} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center px-3 py-2 rounded-md transition-colors ${textColor}
                      ${isActive ? activeClasses : hoverClasses}
                    `}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar Footer */}
          <div className={`px-6 py-4 text-sm ${textColor}`}>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="font-medium">
                {user.role === 'college' && 'College Administrator'}
                {user.role === 'department' && 'Department Administrator'}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                College Code: {user.college_code}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;