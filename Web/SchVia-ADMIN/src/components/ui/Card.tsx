import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'hoverable';
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  variant = 'default',
  noPadding = false,
}) => {
  const { theme } = useTheme();
  
  const baseClasses = 'rounded-lg transition-all duration-200';
  const bgColor = theme === 'light' ? 'bg-white' : 'bg-[#3F3D56]';
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const shadowClasses = theme === 'light' 
    ? 'shadow-md shadow-gray-200/50' 
    : 'shadow-md shadow-black/30';
  
  const hoverClasses = variant === 'hoverable' 
    ? 'hover:shadow-lg hover:scale-[1.01] cursor-pointer' 
    : '';
  
  const paddingClasses = noPadding ? '' : 'p-4';
  
  return (
    <div 
      className={`
        ${baseClasses}
        ${bgColor}
        ${shadowClasses}
        ${hoverClasses}
        ${paddingClasses}
        ${className}
      `}
    >
      {title && (
        <h3 className={`font-semibold text-lg mb-3 ${textColor}`}>{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;