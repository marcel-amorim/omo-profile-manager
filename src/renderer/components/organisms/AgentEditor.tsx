import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, Shield, Zap, Cpu, MessageSquare, Ban, Layers } from 'lucide-react';
import type { OMOAgentConfig, PermissionLevel, AgentMode, TextVerbosity, ReasoningEffort, ThinkingConfig } from '../../../shared/types';
import type { ModelInfo } from '../../../shared/ipc';
import { DEFAULT_AGENTS, AgentName } from '../../../shared/constants';
import { ModelSelect } from '../molecules/ModelSelect';
import { SectionHeader } from '../atoms/SectionHeader';
import { FieldHint } from '../atoms/FieldHint';
import { AGENT_MODEL_RECOMMENDATIONS } from '../../../shared/model-recommendations';
import { getModelVariantDisplayLabel, getModelVariantOptions } from '../../../shared/model-variants';

interface AgentEditorProps {
  agents: Record<string, OMOAgentConfig>;
  onChange: (agentName: string, config: OMOAgentConfig) => void;
  availableModels?: string[];
  modelInfos?: Record<string, ModelInfo>;
}

export const AgentEditor: React.FC<AgentEditorProps> = ({ agents, onChange, availableModels = [], modelInfos = {} }) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean> >({});
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});

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
    permissionType: 'edit' | 'bash' | 'webfetch' | 'task' | 'doom_loop' | 'external_directory',
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

  const handleFallbackModelsChange = (agentName: string, modelsString: string) => {
    const modelsArray = modelsString.split(',').map(s => s.trim()).filter(Boolean);
    handleFieldChange(agentName, 'fallback_models', modelsArray.length > 0 ? modelsArray : undefined);
  };

  const handleToolsChange = (agentName: string, toolsString: string) => {
    const toolsArray = toolsString.split(',').map(s => s.trim()).filter(Boolean);
    const toolsConfig: Record<string, boolean> = {};
    toolsArray.forEach(tool => {
      toolsConfig[tool] = true;
    });
    handleFieldChange(agentName, 'tools', Object.keys(toolsConfig).length > 0 ? toolsConfig : undefined);
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
              className={`border rounded-xl transition-all duration-200 ${isExpanded ? 'relative z-30 overflow-visible' : 'overflow-hidden'} ${
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
                  {config.disable && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      Disabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] font-mono">
                    {config.model || 'No model set'}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {getModelVariantDisplayLabel(config.variant, modelInfos[config.model || ''])}
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
                      {(() => {
                        const modelInfo = modelInfos[config.model || ''];
                        const variantOptions = getModelVariantOptions(modelInfo);
                        if (variantOptions.length === 0) {
                          return (
                            <div className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm italic">
                              No variants available
                            </div>
                          );
                        }
                        return (
                          <select
                            id={`${agentName}-variant`}
                            value={config.variant || 'medium'}
                            onChange={(e) => handleFieldChange(agentName, 'variant', e.target.value as OMOAgentConfig['variant'])}
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                          >
                            {variantOptions.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(prev => ({ ...prev, [agentName]: !prev[agentName] }))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-slate-500" />
                        Additional Configuration
                      </span>
                      {detailsOpen[agentName] ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {detailsOpen[agentName] && (
                      <div className="mt-4 space-y-6">

                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 space-y-3">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Disable Agent</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Disable this agent</p>
                        <FieldHint>Prevent this agent from being invoked in task orchestration</FieldHint>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.disable ?? false}
                        onChange={(e) => handleFieldChange(agentName, 'disable', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Disable ${agentName} agent`}
                      />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen(prev => ({ ...prev, [agentName]: !prev[agentName] }))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-slate-500" />
                        Advanced Parameters
                      </span>
                      {advancedOpen[agentName] ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {advancedOpen[agentName] && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
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
                            <FieldHint>Controls randomness (0-2). Lower = more focused</FieldHint>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor={`${agentName}-top-p`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Top-p
                            </label>
                            <input
                              id={`${agentName}-top-p`}
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              value={config.top_p ?? ''}
                              onChange={(e) => handleFieldChange(agentName, 'top_p', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Default (1.0)"
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            />
                            <FieldHint>Nucleus sampling threshold (0-1)</FieldHint>
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
                            <FieldHint>Maximum tokens in the response</FieldHint>
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
                                  : (e.target.value as ReasoningEffort);
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
                            <FieldHint>Level of reasoning depth for this agent</FieldHint>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor={`${agentName}-textVerbosity`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Text Verbosity
                            </label>
                            <select
                              id={`${agentName}-textVerbosity`}
                              value={config.textVerbosity || ''}
                              onChange={(e) => {
                                const nextTextVerbosity = e.target.value === ''
                                  ? undefined
                                  : (e.target.value as TextVerbosity);
                                handleFieldChange(agentName, 'textVerbosity', nextTextVerbosity);
                              }}
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            >
                              <option value="">Default</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <FieldHint>Controls response length and detail level</FieldHint>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor={`${agentName}-mode`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Agent Mode
                            </label>
                            <select
                              id={`${agentName}-mode`}
                              value={config.mode || ''}
                              onChange={(e) => {
                                const nextMode = e.target.value === ''
                                  ? undefined
                                  : (e.target.value as AgentMode);
                                handleFieldChange(agentName, 'mode', nextMode);
                              }}
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            >
                              <option value="">Default</option>
                              <option value="subagent">Subagent</option>
                              <option value="primary">Primary</option>
                              <option value="all">All</option>
                            </select>
                            <FieldHint>How this agent participates in orchestration</FieldHint>
                          </div>
                        </div>

                        <div className="mt-5 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 space-y-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Thinking Configuration</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label htmlFor={`${agentName}-thinking-type`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Thinking Mode
                              </label>
                              <select
                                id={`${agentName}-thinking-type`}
                                value={config.thinking?.type || ''}
                                onChange={(e) => {
                                  const currentThinking = config.thinking;
                                  const newType = e.target.value as ThinkingConfig['type'] | '';
                                  if (newType === '') {
                                    handleFieldChange(agentName, 'thinking', undefined);
                                  } else {
                                    handleFieldChange(agentName, 'thinking', {
                                      type: newType,
                                      budgetTokens: currentThinking?.budgetTokens,
                                    });
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                              >
                                <option value="">Disabled</option>
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Force Disabled</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor={`${agentName}-thinking-budget`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Budget Tokens
                              </label>
                              <input
                                id={`${agentName}-thinking-budget`}
                                type="number"
                                min="1"
                                value={config.thinking?.budgetTokens ?? ''}
                                onChange={(e) => {
                                  const currentThinking = config.thinking;
                                  const budgetTokens = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                  if (currentThinking?.type) {
                                    handleFieldChange(agentName, 'thinking', {
                                      type: currentThinking.type,
                                      budgetTokens,
                                    });
                                  }
                                }}
                                placeholder="Default"
                                disabled={!config.thinking?.type}
                                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <FieldHint>Token budget for thinking/reasoning</FieldHint>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-500" />
                        Fallback Models
                      </h3>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={Array.isArray(config.fallback_models) ? config.fallback_models.join(', ') : (config.fallback_models || '')}
                          onChange={(e) => handleFallbackModelsChange(agentName, e.target.value)}
                          placeholder="model1, model2, model3..."
                          className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow"
                        />
                        <FieldHint>Alternative models to use if primary is unavailable</FieldHint>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Skills & Tools
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label htmlFor={`${agentName}-skills`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Skills (comma-separated)
                          </label>
                          <input
                            id={`${agentName}-skills`}
                            type="text"
                            value={(config.skills || []).join(', ')}
                            onChange={(e) => handleSkillsChange(agentName, e.target.value)}
                            placeholder="e.g., react, typescript, tailwind"
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow"
                          />
                          <FieldHint>Skills this agent specializes in</FieldHint>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor={`${agentName}-tools`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Tools (comma-separated)
                          </label>
                          <input
                            id={`${agentName}-tools`}
                            type="text"
                            value={config.tools ? Object.keys(config.tools).join(', ') : ''}
                            onChange={(e) => handleToolsChange(agentName, e.target.value)}
                            placeholder="e.g., git, npm, docker"
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow"
                          />
                          <FieldHint>Tools this agent is permitted to use</FieldHint>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        Prompt Configuration
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label htmlFor={`${agentName}-prompt`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Custom System Prompt
                          </label>
                          <textarea
                            id={`${agentName}-prompt`}
                            value={config.prompt || ''}
                            onChange={(e) => handleFieldChange(agentName, 'prompt', e.target.value || undefined)}
                            placeholder="Enter custom system prompt for this agent..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow resize-y"
                          />
                          <FieldHint>Override the default system prompt</FieldHint>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor={`${agentName}-prompt-append`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Prompt Append
                          </label>
                          <textarea
                            id={`${agentName}-prompt-append`}
                            value={config.prompt_append || ''}
                            onChange={(e) => handleFieldChange(agentName, 'prompt_append', e.target.value || undefined)}
                            placeholder="Text to append to all prompts..."
                            rows={2}
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow resize-y"
                          />
                          <FieldHint>Additional context appended to every prompt</FieldHint>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        Permissions
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${agentName}-shell`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Shell Access</label>
                          <select
                            id={`${agentName}-shell`}
                            value={(config.permission?.bash as string) || 'ask'}
                            onChange={(e) => handlePermissionChange(agentName, 'bash', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
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
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${agentName}-edit`} className="text-sm font-medium text-slate-700 dark:text-slate-300">File Edit</label>
                          <select
                            id={`${agentName}-edit`}
                            value={config.permission?.edit || 'ask'}
                            onChange={(e) => handlePermissionChange(agentName, 'edit', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${agentName}-task`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Creation</label>
                          <select
                            id={`${agentName}-task`}
                            value={config.permission?.task || 'ask'}
                            onChange={(e) => handlePermissionChange(agentName, 'task', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${agentName}-doom-loop`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Doom Loop</label>
                          <select
                            id={`${agentName}-doom-loop`}
                            value={config.permission?.doom_loop || 'ask'}
                            onChange={(e) => handlePermissionChange(agentName, 'doom_loop', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${agentName}-ext-dir`} className="text-sm font-medium text-slate-700 dark:text-slate-300">External Directory</label>
                          <select
                            id={`${agentName}-ext-dir`}
                            value={config.permission?.external_directory || 'ask'}
                            onChange={(e) => handlePermissionChange(agentName, 'external_directory', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>
                      </div>
                    )}
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

export default AgentEditor;
