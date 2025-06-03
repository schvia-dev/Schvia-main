// src/components/ui/Input.tsx
import React, { useState, InputHTMLAttributes } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Additional container class names */
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  type = 'text',
  name,
  id,
  required = false,
  disabled = false,
  placeholder,
  value,
  onChange,
  ...rest
}) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name || Math.random().toString(36).substring(2, 9);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const borderClasses = error
    ? 'border-[#FF4C4C] focus:border-[#FF4C4C] focus:ring-[#FF4C4C]/30'
    : theme === 'light'
    ? 'border-gray-300 focus:border-[#6A5ACD] focus:ring-[#6A5ACD]/30'
    : 'border-gray-600 focus:border-[#6A5ACD] focus:ring-[#6A5ACD]/30';

  const bgColor = theme === 'light'
    ? 'bg-white'
    : 'bg-[#2F2D46] text-[#E5E5E5]';

  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const labelColor = theme === 'light' ? 'text-[#666]' : 'text-[#A0A0A0]';
  const errorColor = 'text-[#FF4C4C]';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block mb-1 text-sm font-medium ${labelColor}`}
        >
          {label}
          {required && <span className="text-[#FF4C4C] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={type === 'password' && showPassword ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`
            block w-full px-3 py-2 rounded-md
            ${borderClasses}
            ${bgColor}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2
            transition duration-200
            ${type === 'password' ? 'pr-10' : ''}
          `}
          {...rest}
        />

        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff size={18} className={textColor} />
            ) : (
              <Eye size={18} className={textColor} />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className={`mt-1 text-sm ${errorColor}`}>{error}</p>
      )}
    </div>
  );
};

export default Input;
