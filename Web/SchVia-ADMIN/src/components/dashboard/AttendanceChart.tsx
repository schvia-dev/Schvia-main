import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

interface AttendanceData {
  name: string;
  present: number;
  absent: number;
  leave: number;
}

interface AttendanceChartProps {
  data: AttendanceData[];
  title: string;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ data, title }) => {
  const { theme } = useTheme();

  const textColor = theme === 'light' ? '#333' : '#E5E5E5';
  const gridColor = theme === 'light' ? '#e0e0e0' : '#444444';
  
  return (
    <Card title={title} className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: textColor }}
          />
          <YAxis 
            tick={{ fill: textColor }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'light' ? '#fff' : '#3F3D56',
              borderColor: theme === 'light' ? '#e0e0e0' : '#555',
              color: textColor,
            }}
          />
          <Legend />
          <Bar dataKey="present" stackId="a" fill="#4CAF50" />
          <Bar dataKey="leave" stackId="a" fill="#FFC107" />
          <Bar dataKey="absent" stackId="a" fill="#FF4C4C" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default AttendanceChart;