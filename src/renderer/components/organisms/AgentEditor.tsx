import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, Shield, Zap, Cpu } from 'lucide-react';
import { OMOAgentConfig, PermissionLevel } from '../../../shared/types';
import { DEFAULT_AGENTS, VARIANT_OPTIONS, VariantOption, AgentName } from '../../../shared/constants';
import { ModelSelect } from '../molecules/ModelSelect';
import { SectionHeader } from '../atoms/SectionHeader';
import { AGENT_MODEL_RECOMMENDATIONS } from '../../../shared/model-recommendations';

interface AgentEditorProps {
  agents: Record<string, OMOAgentConfig>;
  onChange: (agentName: string, config: OMOAgentConfig) => void;
  availableModels?: string[];
}

export const AgentEditor: React.FC<AgentEditorProps> = ({ agents, onChange, availableModels = [] }) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const toggleAgent = (agentName: string) => {
    setExpandedAgent(expandedAgent === agentName ? null : agentName);
  };

  const handleFieldChange = <K extends keyof OMOAgentConfig>(
    agentName: string,
    field: K,
    value: OMOAgentConfig[K]
  ) => {
    const currentConfig = agents[agentName] || { model: '', variant: 'medium' };
    onChange(agentName, { ...currentConfig, [field]: value });
  };

  const handlePermissionChange = (
    agentName: string,
    permissionType: 'bash' | 'webfetch',
    value: PermissionLevel
  ) => {
    const currentConfig = agents[agentName] || { model: '', variant: 'medium' };
    const currentPermissions = currentConfig.permission || {};
    
    onChange(agentName, {
      ...currentConfig,
      permission: {
        ...currentPermissions,
        [permissionType]: value
      }
    });
  };

  const handleSkillsChange = (agentName: string, skillsString: string) => {
    const skillsArray = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    handleFieldChange(agentName, 'skills', skillsArray);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <SectionHeader
        icon={<Cpu className="w-6 h-6" />}
        title="Agent Configuration"
        description="Configure models and parameters for specific agents"
        accent="blue"
      />
      
      <div className="space-y-3">
        {DEFAULT_AGENTS.map((agentName) => {
          const config = agents[agentName] || { model: '', variant: 'medium' };
          const isExpanded = expandedAgent === agentName;
          const hasError = !config.model || config.model.trim() === '';

          return (
            <div 
              key={agentName} 
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                hasError 
                  ? 'border-red-200 dark:border-red-900/50 shadow-sm shadow-red-100 dark:shadow-none' 
                  : isExpanded 
                    ? 'border-blue-200 dark:border-blue-800/50 shadow-md shadow-blue-50 dark:shadow-none' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              } bg-white dark:bg-slate-900`}
            >
              <button
                type="button"
                onClick={() => toggleAgent(agentName)}
                className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                  isExpanded 
                    ? 'bg-slate-50/50 dark:bg-slate-800/30' 
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg capitalize text-slate-800 dark:text-slate-200">
                    {agentName}
                  </span>
                  {hasError && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Model required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] font-mono">
                    {config.model || 'No model set'}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {config.variant}
                  </span>
                  <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-slate-200 dark:bg-slate-700' : 'bg-transparent'}`}>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-6 bg-slate-50/30 dark:bg-slate-900/50">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor={`${agentName}-model`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <ModelSelect
                        id={`${agentName}-model`}
                        value={config.model || ''}
                        onChange={(value) => handleFieldChange(agentName, 'model', value)}
                        availableModels={availableModels}
                        recommendedModels={AGENT_MODEL_RECOMMENDATIONS[agentName as AgentName]}
                        hasError={hasError}
                      />
                      {hasError && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">Model identifier is required</p>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <label htmlFor={`${agentName}-variant`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Variant
                      </label>
                      <select
                        id={`${agentName}-variant`}
                        value={config.variant || 'medium'}
                        onChange={(e) => handleFieldChange(agentName, 'variant', e.target.value as VariantOption)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                      >
                        {VARIANT_OPTIONS.map(v => (
                          <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-500" />
                      Advanced Parameters
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor={`${agentName}-temperature`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Temperature
                        </label>
                        <input
                          id={`${agentName}-temperature`}
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={config.temperature ?? ''}
                          onChange={(e) => handleFieldChange(agentName, 'temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Default (0.7)"
                          className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label htmlFor={`${agentName}-maxTokens`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Max Tokens
                        </label>
                        <input
                          id={`${agentName}-maxTokens`}
                          type="number"
                          min="1"
                          value={config.maxTokens ?? ''}
                          onChange={(e) => handleFieldChange(agentName, 'maxTokens', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          placeholder="Default"
                          className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor={`${agentName}-reasoningEffort`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Reasoning Effort
                        </label>
                        <select
                          id={`${agentName}-reasoningEffort`}
                          value={config.reasoningEffort || ''}
                          onChange={(e) => {
                            const nextReasoningEffort = e.target.value === ''
                              ? undefined
                              : (e.target.value as OMOAgentConfig['reasoningEffort']);
                            handleFieldChange(agentName, 'reasoningEffort', nextReasoningEffort);
                          }}
                          className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                        >
                          <option value="">Default</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="xhigh">Extra High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Skills
                      </h3>
                      <div className="space-y-1.5">
                        <label htmlFor={`${agentName}-skills`} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Comma-separated list of skills
                        </label>
                        <input
                          id={`${agentName}-skills`}
                          type="text"
                          value={(config.skills || []).join(', ')}
                          onChange={(e) => handleSkillsChange(agentName, e.target.value)}
                          placeholder="e.g., react, typescript, tailwind"
                          className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow"
                        />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        Permissions
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${agentName}-shell`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Shell Access</label>
                          <select
                            id={`${agentName}-shell`}
                            value={(config.permission?.bash as string) || 'ask'}
                            onChange={(e) => handlePermissionChange(agentName, 'bash', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="allow">Always (Allow)</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never (Deny)</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${agentName}-web`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Web Access</label>
                          <select
                            id={`${agentName}-web`}
                            value={config.permission?.webfetch || 'ask'}
                            onChange={(e) => handlePermissionChange(agentName, 'webfetch', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="allow">Always (Allow)</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never (Deny)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
