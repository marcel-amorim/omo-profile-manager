import React from 'react';
import { Settings, Bell, GitBranch, Globe, Zap, Shield, Bot, Cpu } from 'lucide-react';
import type { OMOSharedSettings, BrowserAutomationProvider, RuntimeFallbackSettings, SisyphusAgentSettings, ExperimentalSettings, NotificationSettings, GitMasterSettings, BackgroundTaskSettings, SisyphusSettings } from '../../../shared/types';
import { SectionHeader } from '../atoms/SectionHeader';
import { FieldHint } from '../atoms/FieldHint';

interface SharedSettingsEditorProps {
  settings: OMOSharedSettings;
  onChange: (settings: OMOSharedSettings) => void;
}

export const SharedSettingsEditor: React.FC<SharedSettingsEditorProps> = ({
  settings,
  onChange,
}) => {
  const parseOptionalInteger = (value: string): number | undefined => {
    if (!value) {
      return undefined;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const updateField = <K extends keyof OMOSharedSettings>(field: K, value: OMOSharedSettings[K]) => {
    onChange({ ...settings, [field]: value });
  };

  const updateSisyphusAgent = <K extends keyof SisyphusAgentSettings>(field: K, value: SisyphusAgentSettings[K]) => {
    updateField('sisyphus_agent', {
      ...(settings.sisyphus_agent ?? { default_builder_enabled: true, replace_plan: false }),
      [field]: value,
    });
  };

  const updateRuntimeFallback = <K extends keyof RuntimeFallbackSettings>(field: K, value: RuntimeFallbackSettings[K]) => {
    updateField('runtime_fallback', {
      ...(settings.runtime_fallback ?? { enabled: true, max_fallback_attempts: 3, cooldown_seconds: 60, timeout_seconds: 30, notify_on_fallback: true }),
      [field]: value,
    });
  };

  const updateNotification = <K extends keyof NotificationSettings>(field: K, value: NotificationSettings[K]) => {
    updateField('notification', { ...(settings.notification ?? {}), [field]: value });
  };

  const updateGitMaster = <K extends keyof GitMasterSettings>(field: K, value: GitMasterSettings[K]) => {
    updateField('git_master', { ...(settings.git_master ?? {}), [field]: value });
  };

  const updateExperimental = <K extends keyof ExperimentalSettings>(field: K, value: ExperimentalSettings[K]) => {
    updateField('experimental', { ...(settings.experimental ?? {}), [field]: value });
  };

  const updateBackgroundTask = <K extends keyof BackgroundTaskSettings>(field: K, value: BackgroundTaskSettings[K]) => {
    updateField('background_task', { ...(settings.background_task ?? {}), [field]: value });
  };

  const updateSisyphusTasks = <K extends keyof NonNullable<SisyphusSettings['tasks']>>(field: K, value: NonNullable<SisyphusSettings['tasks']>[K]) => {
    updateField('sisyphus', {
      ...(settings.sisyphus ?? {}),
      tasks: {
        ...(settings.sisyphus?.tasks ?? {}),
        [field]: value,
      },
    });
  };

  const handleDisabledItemsChange = (field: 'disabled_mcps' | 'disabled_agents' | 'disabled_skills' | 'disabled_hooks' | 'disabled_commands' | 'disabled_tools', value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    updateField(field, items.length > 0 ? items : undefined);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <SectionHeader
        icon={<Settings className="w-6 h-6" />}
        title="Shared Settings"
        description="Global configuration applied across all profiles"
        accent="blue"
      />

      <div className="space-y-6">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-500" />
              Sisyphus Agent
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Enable Sisyphus Agent</p>
                <FieldHint>Master agent orchestrating complex tasks and sub-agents</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={!(settings.sisyphus_agent?.disabled ?? false)}
                onChange={(e) => updateSisyphusAgent('disabled', !e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Enable Sisyphus Agent"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Default Builder Enabled</p>
                <FieldHint>Enables default builder behavior when Sisyphus runs</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.sisyphus_agent?.default_builder_enabled ?? true}
                onChange={(e) => updateSisyphusAgent('default_builder_enabled', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Default Builder Enabled"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Planner Enabled</p>
                <FieldHint>Enables planning capabilities for complex task orchestration</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.sisyphus_agent?.planner_enabled ?? true}
                onChange={(e) => updateSisyphusAgent('planner_enabled', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Planner Enabled"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Replace Plan</p>
                <FieldHint>Allows replacing existing plans during task execution</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.sisyphus_agent?.replace_plan ?? false}
                onChange={(e) => updateSisyphusAgent('replace_plan', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Replace Plan"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              Background Tasks & Sisyphus
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Enable Task System</p>
                <FieldHint>Enables the new task system for background operations</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.sisyphus?.tasks?.enabled ?? false}
                onChange={(e) => updateSisyphusTasks('enabled', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Enable Task System"
              />
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Task Storage Path</span>
              <input
                type="text"
                value={settings.sisyphus?.tasks?.storage_path ?? ''}
                onChange={(e) => updateSisyphusTasks('storage_path', e.target.value || undefined)}
                placeholder="Path for task storage..."
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                aria-label="Task Storage Path"
              />
              <FieldHint>Optional custom path for persistent task storage</FieldHint>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Claude Code Compatibility</p>
                <FieldHint>Maintains compatibility with Claude Code task format</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.sisyphus?.tasks?.claude_code_compat ?? false}
                onChange={(e) => updateSisyphusTasks('claude_code_compat', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Claude Code Compatibility"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Default Concurrency</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.background_task?.defaultConcurrency ?? ''}
                  onChange={(e) => updateBackgroundTask('defaultConcurrency', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="Default"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Default Concurrency"
                />
                <FieldHint>Maximum concurrent background tasks</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Stale Timeout (ms)</span>
                <input
                  type="number"
                  min="60000"
                  step="1000"
                  value={settings.background_task?.staleTimeoutMs ?? ''}
                  onChange={(e) => updateBackgroundTask('staleTimeoutMs', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="Default"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Stale Timeout in milliseconds"
                />
                <FieldHint>Milliseconds before tasks are considered stale</FieldHint>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Browser Automation
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Browser Provider</span>
              <select
                value={settings.browser_automation_engine?.provider ?? 'playwright'}
                onChange={(e) => updateField('browser_automation_engine', { provider: e.target.value as BrowserAutomationProvider })}
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                aria-label="Browser Provider"
              >
                <option value="playwright">Playwright</option>
                <option value="agent-browser">Agent Browser</option>
              </select>
              <FieldHint>Select the browser automation engine for web tasks</FieldHint>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Notifications
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Force Enable Notifications</p>
                <FieldHint>Enable notifications even when system Do Not Disturb is active</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.notification?.force_enable ?? false}
                onChange={(e) => updateNotification('force_enable', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Force Enable Notifications"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-500" />
              Git Integration
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Commit Footer</p>
                <FieldHint>Add a footer to generated commit messages</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.git_master?.commit_footer ?? false}
                onChange={(e) => updateGitMaster('commit_footer', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Commit Footer"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Include Co-Authored-By</p>
                <FieldHint>Automatically add Co-Authored-By trailer to commits</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.git_master?.include_co_authored_by ?? false}
                onChange={(e) => updateGitMaster('include_co_authored_by', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Include Co-Authored-By"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Runtime Fallback
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Enable Runtime Fallback</p>
                <FieldHint>Automatically fallback to alternative models on failures</FieldHint>
              </div>
              <input
                type="checkbox"
                checked={settings.runtime_fallback?.enabled ?? true}
                onChange={(e) => updateRuntimeFallback('enabled', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label="Enable Runtime Fallback"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Max Fallback Attempts</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.runtime_fallback?.max_fallback_attempts ?? 3}
                  onChange={(e) => updateRuntimeFallback('max_fallback_attempts', parseOptionalInteger(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Max Fallback Attempts"
                />
                <FieldHint>Maximum number of fallback attempts per request</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Cooldown (seconds)</span>
                <input
                  type="number"
                  min="0"
                  value={settings.runtime_fallback?.cooldown_seconds ?? 60}
                  onChange={(e) => updateRuntimeFallback('cooldown_seconds', parseOptionalInteger(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Cooldown in seconds"
                />
                <FieldHint>Cooldown period between fallback attempts</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Timeout (seconds)</span>
                <input
                  type="number"
                  min="0"
                  value={settings.runtime_fallback?.timeout_seconds ?? 30}
                  onChange={(e) => updateRuntimeFallback('timeout_seconds', parseOptionalInteger(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Timeout in seconds"
                />
                <FieldHint>Timeout for each fallback attempt</FieldHint>
              </div>

              <div className="flex items-center gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Notify on Fallback</p>
                  <FieldHint>Show notification when fallback occurs</FieldHint>
                </div>
                <input
                  type="checkbox"
                  checked={settings.runtime_fallback?.notify_on_fallback ?? true}
                  onChange={(e) => updateRuntimeFallback('notify_on_fallback', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Notify on Fallback"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500" />
              Feature Toggles
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Hashline Edit</p>
                  <FieldHint>Enable hashline editing functionality</FieldHint>
                </div>
                <input
                  type="checkbox"
                  checked={settings.hashline_edit ?? true}
                  onChange={(e) => updateField('hashline_edit', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Hashline Edit"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Model Fallback</p>
                  <FieldHint>Enable automatic model fallback on errors</FieldHint>
                </div>
                <input
                  type="checkbox"
                  checked={settings.model_fallback ?? true}
                  onChange={(e) => updateField('model_fallback', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Model Fallback"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">New Task System</p>
                  <FieldHint>Enable the new task system architecture</FieldHint>
                </div>
                <input
                  type="checkbox"
                  checked={settings.new_task_system_enabled ?? false}
                  onChange={(e) => updateField('new_task_system_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  aria-label="New Task System"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Disabled Agents</span>
                <input
                  type="text"
                  value={(settings.disabled_agents ?? []).join(', ')}
                  onChange={(e) => handleDisabledItemsChange('disabled_agents', e.target.value)}
                  placeholder="agent1, agent2, agent3..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Disabled Agents"
                />
                <FieldHint>Comma-separated list of agent names to disable globally</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Disabled Skills</span>
                <input
                  type="text"
                  value={(settings.disabled_skills ?? []).join(', ')}
                  onChange={(e) => handleDisabledItemsChange('disabled_skills', e.target.value)}
                  placeholder="skill1, skill2, skill3..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Disabled Skills"
                />
                <FieldHint>Comma-separated list of skill names to disable globally</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Disabled Tools</span>
                <input
                  type="text"
                  value={(settings.disabled_tools ?? []).join(', ')}
                  onChange={(e) => handleDisabledItemsChange('disabled_tools', e.target.value)}
                  placeholder="tool1, tool2, tool3..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Disabled Tools"
                />
                <FieldHint>Comma-separated list of tool names to disable globally</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Disabled Commands</span>
                <input
                  type="text"
                  value={(settings.disabled_commands ?? []).join(', ')}
                  onChange={(e) => handleDisabledItemsChange('disabled_commands', e.target.value)}
                  placeholder="command1, command2, command3..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Disabled Commands"
                />
                <FieldHint>Comma-separated list of command names to disable globally</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Disabled Hooks</span>
                <input
                  type="text"
                  value={(settings.disabled_hooks ?? []).join(', ')}
                  onChange={(e) => handleDisabledItemsChange('disabled_hooks', e.target.value)}
                  placeholder="hook1, hook2, hook3..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Disabled Hooks"
                />
                <FieldHint>Comma-separated list of hook names to disable globally</FieldHint>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Disabled MCPs</span>
                <input
                  type="text"
                  value={(settings.disabled_mcps ?? []).join(', ')}
                  onChange={(e) => handleDisabledItemsChange('disabled_mcps', e.target.value)}
                  placeholder="mcp1, mcp2, mcp3..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
                  aria-label="Disabled MCPs"
                />
                <FieldHint>Comma-separated list of MCP names to disable globally</FieldHint>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-500" />
              Experimental Features
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Auto Resume</p>
                  <FieldHint>Automatically resume interrupted sessions</FieldHint>
                </div>
                <input
                  type="checkbox"
                  checked={settings.experimental?.auto_resume ?? false}
                  onChange={(e) => updateExperimental('auto_resume', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Auto Resume"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Disable OMO Env</p>
                  <FieldHint>Disable OMO environment variable injection</FieldHint>
                </div>
                <input
                  type="checkbox"
                  checked={settings.experimental?.disable_omo_env ?? false}
                  onChange={(e) => updateExperimental('disable_omo_env', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Disable OMO Environment"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Task System</p>
                  <FieldHint>Enable experimental task system features</FieldHint>
                </div>
                <input
                  type="checkbox"
                  checked={settings.experimental?.task_system ?? false}
                  onChange={(e) => updateExperimental('task_system', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Experimental Task System"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Default Run Agent</span>
          <input
            type="text"
            value={settings.default_run_agent ?? ''}
            onChange={(e) => updateField('default_run_agent', e.target.value || undefined)}
            placeholder="Agent name for default run command..."
            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-sm"
            aria-label="Default Run Agent"
          />
          <FieldHint>Default agent to use for the run command</FieldHint>
        </div>
      </div>
    </div>
  );
};

export default SharedSettingsEditor;
