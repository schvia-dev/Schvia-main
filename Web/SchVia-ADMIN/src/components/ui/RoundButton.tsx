// src/components/ui/RoundButton.tsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

interface RoundButtonProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const RoundButton: React.FC<RoundButtonProps> = ({
  icon,
  variant  = 'primary',
  size     = 'md',
  disabled = false,
  onClick,
  type     = 'button',
  className = '',
}) => {
  const { theme } = useTheme();

  const sizeClasses: Record<string,string> = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const variantClasses = {
    primary: {
      light: 'bg-[#6A5ACD] hover:bg-[#5D4BB8] text-white',
      dark:  'bg-[#6A5ACD] hover:bg-[#7B6BDE] text-white',
    },
    secondary: {
      light: 'bg-[#cbd5ff] hover:bg-[#B8C2EC] text-[#333]',
      dark:  'bg-[#cbd5ff] hover:bg-[#cbd5ff] text-[#E5E5E5]',
    },
    outline: {
      light: 'border border-[#6A5ACD] text-[#6A5ACD] hover:bg-[#6A5ACD]/10',
      dark:  'border border-[#E5E5E5] text-[#6A5ACD] hover:bg-[#cbd5ff]/20',
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

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const themeClasses = variantClasses[variant][theme];

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled   ? {} : { scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        flex items-center justify-center
        rounded-full   /* fully circular */
        ${sizeClasses[size]}
        ${themeClasses}
        ${disabledClasses}
        ${className}
      `}
    >
      {icon}
    </motion.button>
  );
};

export default RoundButton;
