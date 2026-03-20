import React from 'react';
import { Bot } from 'lucide-react';
import type { SisyphusAgentSettings } from '../../../shared/types';
import { SectionHeader } from '../atoms/SectionHeader';

interface ProfileGlobalSettingsEditorProps {
  settings: SisyphusAgentSettings;
  onChange: <K extends keyof SisyphusAgentSettings>(field: K, value: SisyphusAgentSettings[K]) => void;
}

export const ProfileGlobalSettingsEditor: React.FC<ProfileGlobalSettingsEditorProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <SectionHeader
        icon={<Bot className="w-6 h-6" />}
        title="Profile Settings"
        description="Global config keys applied before agents and categories"
        accent="blue"
      />

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 space-y-5">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">sisyphus_agent</h3>

          <label className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                default_builder_enabled
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enables default builder behavior when Sisyphus runs.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.default_builder_enabled}
              onChange={(event) => onChange('default_builder_enabled', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">replace_plan</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allows replacing existing plans during task orchestration.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.replace_plan}
              onChange={(event) => onChange('replace_plan', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProfileGlobalSettingsEditor;
