import React from 'react';
import { CheckCircle, Copy, Download, Trash2 } from 'lucide-react';
import { IconActionButton } from '../atoms/IconActionButton';

interface ProfileCardActionsProps {
  isActive: boolean;
  isSelected: boolean;
  onExport: () => void;
  onApply: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const ProfileCardActions: React.FC<ProfileCardActionsProps> = ({
  isActive,
  isSelected,
  onExport,
  onApply,
  onDuplicate,
  onDelete,
}) => {
  return (
    <div className={`absolute top-3 right-3 flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
      <IconActionButton
        onClick={onExport}
        icon={<Download size={16} />}
        title="Export Profile"
        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      />
      <IconActionButton
        onClick={onApply}
        testId="apply-profile-btn"
        icon={<CheckCircle size={16} />}
        title={isActive ? 'Reapply Profile' : 'Apply Profile'}
        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      />
      <IconActionButton
        onClick={onDuplicate}
        testId="duplicate-profile-btn"
        icon={<Copy size={16} />}
        title="Duplicate Profile"
        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      />
      <IconActionButton
        onClick={onDelete}
        testId="delete-profile-btn"
        icon={<Trash2 size={16} />}
        title={isActive ? 'Cannot delete active profile' : 'Delete Profile'}
        className={`p-1.5 rounded-md transition-colors ${
          isActive
            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            : 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        }`}
        disabled={isActive}
      />
    </div>
  );
};

export default ProfileCardActions;
