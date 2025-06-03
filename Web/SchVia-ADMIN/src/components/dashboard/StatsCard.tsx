import React from 'react';
import Card from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  color = '#6A5ACD',
}) => {
  const { theme } = useTheme();
  
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const subTextColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';
  
  return (
    <Card className="flex items-center h-full">
      <div className="mr-4 flex-shrink-0">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className={`text-sm font-medium ${subTextColor}`}>{title}</h3>
        <div className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</div>
        
        {change && (
          <div className="flex items-center mt-1">
            <span
              className={
                change.type === 'increase'
                  ? 'text-[#4CAF50]'
                  : 'text-[#FF4C4C]'
              }
            >
              {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
            </span>
            <span className={`text-xs ml-1 ${subTextColor}`}>from last semester</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;