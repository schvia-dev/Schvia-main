import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
}) => {
  const { theme } = useTheme();
  
  const baseClasses = 'rounded-md font-medium transition-all duration-200 flex items-center justify-center';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: {
      light: 'bg-[#6A5ACD] hover:bg-[#5D4BB8] text-white',
      dark:  'bg-[#6A5ACD] hover:bg-[#7B6BDE] text-white',
    },
    secondary: {
      light: 'bg-[#cbd5ff] hover:bg-[#B8C2EC] text-[#333]',
      dark:  'bg-[#3F3D56] hover:bg-[#504E6D] text-[#E5E5E5]',
    },
    outline: {
      light: 'border border-[#6A5ACD] text-[#6A5ACD] hover:bg-[#6A5ACD]/10',
      dark:  'border border-white text-white hover:bg-white/20',
    },
    danger: {
      light: 'bg-[#FF4C4C] hover:bg-[#E03939] text-white',
      dark:  'bg-[#FF4C4C] hover:bg-[#FF6B6B] text-white',
    },
    success: {
      light: 'bg-[#4CAF50] hover:bg-[#3D9A41] text-white',
      dark:  'bg-[#4CAF50] hover:bg-[#5DBF61] text-white',
    },
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant][theme]} ${disabled ? disabledClasses : ''} ${widthClasses} ${className}`}  
    >
      {icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
