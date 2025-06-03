import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Option {
  value: string | number;
  label: string;
}

interface SelectInputProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  name,
  id,
  required = false,
  disabled = false,
  error,
  className = '',
}) => {
  const { theme } = useTheme();
  const inputId = id || name || Math.random().toString(36).substring(2, 9);
  
  const borderClasses = error
    ? 'border-[#FF4C4C] focus:border-[#FF4C4C] focus:ring-[#FF4C4C]/30'
    : theme === 'light'
    ? 'border-gray-300 focus:border-[#6A5ACD] focus:ring-[#6A5ACD]/30'
    : 'border-gray-600 focus:border-[#6A5ACD] focus:ring-[#6A5ACD]/30';
  
  const bgColor = theme === 'light' 
    ? 'bg-white' 
    : 'bg-[#2F2D46] text-[#E5E5E5]';
  
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
      
      <select
        id={inputId}
        name={name}
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
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className={`mt-1 text-sm ${errorColor}`}>{error}</p>
      )}
    </div>
  );
};

export default SelectInput;