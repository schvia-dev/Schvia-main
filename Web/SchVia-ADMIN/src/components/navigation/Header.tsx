import React from 'react';
import { Menu, Sun, Moon, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import APPLogoLight from '../../assets/logo_light.png';
import APPLogoDark from '../../assets/logo_dark.png';
import CollegeLogoLight from '../../assets/Malla_reddy_University_logo.png';
import CollegeLogoDark from '../../assets/Malla_reddy_University_logo.png';
import { colors } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import Clock from '../ui/Clock';
import { motion } from 'framer-motion';
import RoundButton from '../ui/RoundButton';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const currentColors = colors[theme];
  const navigate = useNavigate();
  const bgColor = theme === 'light' ? 'bg-white' : 'bg-[#3F3D56]';
  const borderColorClass = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const iconColor = theme === 'light' ? 'text-[#6A5ACD]' : 'text-[#E5E5E5]';
  const collegeName = user?.college_name || '';
  
  // pick the correct src per theme
  const appLogoSrc = theme === 'light' ? APPLogoLight : APPLogoDark;
  const collegeLogoSrc = theme === 'light' ? CollegeLogoLight : CollegeLogoDark;
  // pick border color: primary on light, white on dark
  const logoBorderColor = theme === 'light'
    ? currentColors.primary
    : currentColors.white;

  return (
    <header
      className={`${bgColor} ${borderColorClass} border-b sticky top-0 z-30 flex items-center justify-between px-4 py-3 transition-all duration-300`}
    >
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className={iconColor} size={22} />
        </button>

        {/* Logos + Title */}
        <div className="flex items-center space-x-3">
            {/* App Logo */}
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden"
              style={{ borderColor:currentColors.headings }}
            >
              <img src={appLogoSrc} alt="App Logo" className="w-10 h-10 object-contain" />
            </div>

            <span
              className="text-2xl font-thin mx-1"
              style={{ color: currentColors.headings }}
            >
              /
            </span>

            {/* College Logo */}
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden bg-white"
              style={{ borderColor:currentColors.headings }}
            >
              <img src={collegeLogoSrc} alt="College Logo" className="w-10 h-10 object-contain" />
            </div>

            {/* Title */}
            <h1
              className="text-xl font-semibold hidden md:block ml-4"
              style={{ color: currentColors.headings }}
            >
              SchVia – {collegeName} Admin Portal
            </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* live clock */}
        <div className="flex items-center">
          <Clock size={28} borderColor={currentColors.headings} />
        </div>
        <motion.div
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
         >
        {/* <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
          >
          {theme === 'light' ? (
            <Moon className={iconColor} size={20} />
          ) : (
            <Sun className={iconColor} size={20} />
          )}
        </button> */}
        <RoundButton
          onClick={toggleTheme}
          variant="outline"
          size="md"
          icon={ theme === 'light'
                  ? <Moon className={iconColor} size={20} />
                  : <Sun  className={iconColor} size={20} />}
          aria-label="Toggle theme"
        />
        </motion.div>
        <motion.div
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
         >
        <RoundButton
          icon={<Bell className={iconColor} size={20} />}
          variant="outline"
          size="md"
          onClick={toggleTheme}
        />
        </motion.div>

        <div className="flex items-center ml-3 space-x-3">
          <div className="flex items-center">
            <motion.div
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
            <button
              onClick={() => navigate('/admin/profile')}
              className="flex md:mr-2 items-center"
            >
            <div className="mr-2 hidden md:block">
              <div className="text-sm font-medium text-current">{user?.username}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role} admin
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#6A5ACD] flex items-center justify-center text-white">
              <User size={18} />
            </div>
          </button>
          </motion.div>
          </div>
          {/* wrap Logout in a motion.div to get hover/tap animations */}
         <motion.div
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
         >
           <Button variant="outline" size="sm" onClick={logout}>
             Logout
           </Button>
         </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
