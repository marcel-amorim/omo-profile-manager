import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className={`p-2 rounded-md opacity-50 cursor-not-allowed ${className}`}
        aria-label="Loading theme"
      >
        <Sun size={20} className="text-gray-400" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      data-testid="theme-toggle-btn"
      onClick={toggleTheme}
      className={`
        p-2 rounded-md transition-all duration-200
        hover:bg-gray-200 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun
          size={20}
          className="text-yellow-400 transition-transform duration-200"
        />
      ) : (
        <Moon
          size={20}
          className="text-gray-600 dark:text-gray-400 transition-transform duration-200"
        />
      )}
    </button>
  );
};

export default ThemeToggle;
