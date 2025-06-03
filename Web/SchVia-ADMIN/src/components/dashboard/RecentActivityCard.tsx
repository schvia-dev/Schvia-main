import React from 'react';
import Card from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

interface Activity {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  target: string;
  icon: React.ReactNode;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  const { theme } = useTheme();
  
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const subTextColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';
  const borderColor = theme === 'light' ? 'border-gray-100' : 'border-gray-700';
  
  return (
    <Card title="Recent Activity">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className={`flex items-start pb-4 ${
              activity.id !== activities[activities.length - 1].id ? `border-b ${borderColor}` : ''
            }`}
          >
            <div className="mr-3 p-2 rounded-full bg-[#6A5ACD]/10 text-[#6A5ACD]">
              {activity.icon}
            </div>
            
            <div className="flex-1">
              <p className={`font-medium ${textColor}`}>
                {activity.action}
              </p>
              <p className={`text-sm ${subTextColor}`}>
                {activity.target}
              </p>
              <div className="flex items-center mt-1 text-xs">
                <span className={`${subTextColor}`}>{activity.user}</span>
                <span className="mx-1">•</span>
                <span className={`${subTextColor}`}>{activity.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentActivityCard;