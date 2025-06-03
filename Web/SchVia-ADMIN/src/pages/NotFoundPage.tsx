import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const bgColor = theme === 'light' ? 'bg-[#f9f9ff]' : 'bg-[#1A1A2E]';
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const subtextColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${bgColor}`}>
      <div className="text-center px-4">
        <h1 className={`text-9xl font-bold ${textColor}`}>404</h1>
        <h2 className={`text-2xl font-semibold mt-4 ${textColor}`}>
          Page Not Found
        </h2>
        <p className={`mt-2 max-w-md mx-auto ${subtextColor}`}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="mt-8">
          <Button
            variant="primary"
            icon={<Home size={16} />}
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;