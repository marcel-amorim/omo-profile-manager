import React from 'react';
import { Info } from 'lucide-react';
import { SectionHeader } from '../atoms/SectionHeader';

interface ProfileGlobalSettingsEditorProps {
  className?: string;
}

export const ProfileGlobalSettingsEditor: React.FC<ProfileGlobalSettingsEditorProps> = ({
  className = '',
}) => {
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
      <SectionHeader
        icon={<Info className="w-6 h-6" />}
        title="Profile Settings"
        description="Profile-specific configuration for agents and categories"
        accent="blue"
      />

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 p-5 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Global settings have been moved to Shared Settings. 
          This profile now contains only agent and category configurations.
        </p>
      </div>
    </div>
  );
};

export default ProfileGlobalSettingsEditor;
