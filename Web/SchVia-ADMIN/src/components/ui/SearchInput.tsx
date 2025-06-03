import React from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSubmit,
  className = '',
}) => {
  const { theme } = useTheme();
  
  const bgColor = theme === 'light' ? 'bg-white' : 'bg-[#2F2D46]';
  const borderColor = theme === 'light' ? 'border-gray-300' : 'border-gray-600';
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const placeholderColor = theme === 'light' ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const iconColor = theme === 'light' ? 'text-gray-400' : 'text-gray-500';
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };
  
  return (
    <form
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className={iconColor} size={18} />
      </div>
      
      <input
        type="search"
        className={`
          block w-full rounded-md
          pl-10 pr-3 py-2
          ${bgColor}
          ${borderColor}
          ${textColor}
          ${placeholderColor}
          border focus:outline-none
          focus:ring-2 focus:ring-[#6A5ACD]/30
          focus:border-[#6A5ACD]
          transition duration-200
        `}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </form>
  );
};

export default SearchInput;