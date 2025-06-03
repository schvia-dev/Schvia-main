import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout: React.FC = () => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const bgColor = theme === 'light' ? 'bg-[#f9f9ff]' : 'bg-[#1A1A2E]';
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  
  return (
    <div className={`min-h-screen flex flex-col ${bgColor} ${textColor}`}>
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;