import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  const bgColor = theme === 'light' ? 'bg-white' : 'bg-[#3F3D56]';
  const textColor = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        <div
          ref={modalRef}
          className={`relative ${bgColor} rounded-lg shadow-xl transform transition-all ${sizeClasses[size]} w-full`}
        >
          <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
            <h3 className={`text-lg font-medium ${textColor}`}>
              {title}
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="p-1 w-8 h-8 rounded-full"
              onClick={onClose}
              icon={<X size={16} />}
            />
          </div>
          
          <div className="px-6 py-4">
            {children}
          </div>
          
          {footer && (
            <div className={`px-6 py-3 border-t ${borderColor} flex items-center justify-end space-x-3`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;