import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const { id, type, message, duration = 5000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 10));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 10);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [id, duration, onRemove]);

  return (
    <div
      data-testid={`toast-${type}`}
      className={`relative flex items-start p-4 mb-3 border rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out transform translate-x-0 opacity-100 ${bgColors[type]}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">{icons[type]}</div>
      <div className="flex-1 mr-2 text-sm font-medium text-gray-800">{message}</div>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="flex-shrink-0 ml-auto text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
      <div
        className={`absolute bottom-0 left-0 h-1 ${
          type === 'success' ? 'bg-green-500' :
          type === 'error' ? 'bg-red-500' :
          type === 'warning' ? 'bg-yellow-500' :
          'bg-blue-500'
        }`}
        style={{ width: `${progress}%`, transition: 'width 10ms linear' }}
      />
    </div>
  );
};
