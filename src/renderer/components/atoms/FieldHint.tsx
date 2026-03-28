import React from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldHintProps {
  children: React.ReactNode;
  className?: string;
}

export const FieldHint: React.FC<FieldHintProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1 ${className}`}>
      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
      <span>{children}</span>
    </p>
  );
};

export default FieldHint;
