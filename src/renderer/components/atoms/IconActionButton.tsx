import React from 'react';

interface IconActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  className: string;
  disabled?: boolean;
  testId?: string;
}

export const IconActionButton: React.FC<IconActionButtonProps> = ({
  onClick,
  icon,
  title,
  className,
  disabled = false,
  testId,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={className}
      disabled={disabled}
      data-testid={testId}
    >
      {icon}
    </button>
  );
};

export default IconActionButton;
