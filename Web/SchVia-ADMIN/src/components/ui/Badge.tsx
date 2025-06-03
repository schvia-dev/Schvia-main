import React from 'react';
import { useTheme } from '../../context/ThemeContext';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  
  const variantClasses = {
    default: {
      light: 'bg-gray-100 text-gray-800',
      dark: 'bg-gray-700 text-gray-200',
    },
    primary: {
      light: 'bg-[#6A5ACD]/10 text-[#6A5ACD]',
      dark: 'bg-[#cbd5ff] text-[#cbd5ff ]',
    },
    success: {
      light: 'bg-[#4CAF50]/10 text-[#4CAF50]',
      dark: 'bg-[#4CAF50]/20 text-[#4CAF50]',
    },
    warning: {
      light: 'bg-[#FFC107]/10 text-[#FFC107]',
      dark: 'bg-[#FFC107]/20 text-[#FFC107]',
    },
    danger: {
      light: 'bg-[#FF4C4C]/10 text-[#FF4C4C]',
      dark: 'bg-[#FF4C4C]/20 text-[#FF4C4C]',
    },
    info: {
      light: 'bg-blue-100 text-blue-800',
      dark: 'bg-blue-900/30 text-blue-300',
    },
  };
  
  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-medium
        ${sizeClasses[size]}
        ${variantClasses[variant][theme]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;