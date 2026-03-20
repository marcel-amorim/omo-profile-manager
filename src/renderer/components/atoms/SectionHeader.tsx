import React from 'react';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: 'blue' | 'purple';
}

const accentStyles = {
  blue: {
    iconContainer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  purple: {
    iconContainer: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
} as const;

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
  accent = 'blue',
}) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-lg ${accentStyles[accent].iconContainer}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
};

export default SectionHeader;
