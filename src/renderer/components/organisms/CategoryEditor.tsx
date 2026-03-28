import React, { useState } from 'react';
import { Settings2, ChevronDown, ChevronUp, MessageSquare, Ban, Layers, Zap, Shield } from 'lucide-react';
import type { OMOCategoryConfig, PermissionLevel, TextVerbosity, ReasoningEffort, ThinkingConfig } from '../../../shared/types';
import type { ModelInfo } from '../../../shared/ipc';
import { CategoryName, DEFAULT_CATEGORIES } from '../../../shared/constants';
import { ModelSelect } from '../molecules/ModelSelect';
import { SectionHeader } from '../atoms/SectionHeader';
import { FieldHint } from '../atoms/FieldHint';
import { CATEGORY_MODEL_RECOMMENDATIONS } from '../../../shared/model-recommendations';
import { getModelVariantDisplayLabel, getModelVariantOptions } from '../../../shared/model-variants';

interface CategoryEditorProps {
  categories: Record<CategoryName, OMOCategoryConfig>;
  onChange: <K extends keyof OMOCategoryConfig>(
    category: CategoryName,
    field: K,
    value: OMOCategoryConfig[K]
  ) => void;
  className?: string;
  availableModels?: string[];
  modelInfos?: Record<string, ModelInfo>;
}

const CATEGORY_DESCRIPTIONS: Record<CategoryName, string> = {
  'visual-engineering': "Frontend, UI/UX, design, styling, animation",
  'ultrabrain': "Hard logic, architecture decisions, algorithms",
  'deep': "Autonomous research, complex problem-solving",
  'artistry': "Creative, unconventional approaches",
  'quick': "Trivial tasks, single-file changes",
  'unspecified-low': "Low effort miscellaneous tasks",
  'unspecified-high': "High effort miscellaneous tasks",
  'writing': "Documentation, prose, technical writing"
};

export const CategoryEditor: React.FC<CategoryEditorProps> = ({ 
  categories, 
  onChange, 
  className = '',
  availableModels = [],
  modelInfos = {}
}) => {
  const [expandedCategory, setExpandedCategory] = useState<CategoryName | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState<Partial<Record<CategoryName, boolean>>>({});
  const [detailsOpen, setDetailsOpen] = useState<Partial<Record<CategoryName, boolean>>>({});

  const toggleCategory = (category: CategoryName) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleFieldChange = <K extends keyof OMOCategoryConfig>(
    category: CategoryName,
    field: K,
    value: OMOCategoryConfig[K]
  ) => {
    onChange(category, field, value);
  };

  const handlePermissionChange = (
    category: CategoryName,
    permissionType: 'edit' | 'bash' | 'webfetch' | 'task' | 'doom_loop' | 'external_directory',
    value: PermissionLevel
  ) => {
    const currentConfig = categories[category] || { model: '', variant: 'medium' };
    const currentPermissions = currentConfig.permission || {};
    
    handleFieldChange(category, 'permission', {
      ...currentPermissions,
      [permissionType]: value
    });
  };

  const handleSkillsChange = (category: CategoryName, skillsString: string) => {
    const skillsArray = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    handleFieldChange(category, 'skills', skillsArray.length > 0 ? skillsArray : undefined);
  };

  const handleFallbackModelsChange = (category: CategoryName, modelsString: string) => {
    const modelsArray = modelsString.split(',').map(s => s.trim()).filter(Boolean);
    handleFieldChange(category, 'fallback_models', modelsArray.length > 0 ? modelsArray : undefined);
  };

  const handleToolsChange = (category: CategoryName, toolsString: string) => {
    const toolsArray = toolsString.split(',').map(s => s.trim()).filter(Boolean);
    const toolsConfig: Record<string, boolean> = {};
    toolsArray.forEach(tool => {
      toolsConfig[tool] = true;
    });
    handleFieldChange(category, 'tools', Object.keys(toolsConfig).length > 0 ? toolsConfig : undefined);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
      <SectionHeader
        icon={<Settings2 className="w-6 h-6" />}
        title="Category Configuration"
        description="Set default models and parameters for different task categories"
        accent="purple"
      />

      <div className="space-y-3">
        {DEFAULT_CATEGORIES.map(category => {
          const config = categories[category] || { model: '', variant: 'medium' };
          const isExpanded = expandedCategory === category;
          const hasError = !config.model || config.model.trim() === '';

          return (
            <div 
              key={category} 
              className={`border rounded-xl transition-all duration-200 ${isExpanded ? 'relative z-30 overflow-visible' : 'overflow-hidden'} ${
                hasError 
                  ? 'border-red-200 dark:border-red-900/50 shadow-sm shadow-red-100 dark:shadow-none' 
                  : isExpanded 
                    ? 'border-purple-200 dark:border-purple-800/50 shadow-md shadow-purple-50 dark:shadow-none' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              } bg-white dark:bg-slate-900`}
            >
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                  isExpanded 
                    ? 'bg-slate-50/50 dark:bg-slate-800/30' 
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg capitalize text-slate-800 dark:text-slate-200">
                    {category.replace(/-/g, ' ')}
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
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor={`${category}-model`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <ModelSelect
                        id={`${category}-model`}
                        value={config.model || ''}
                        onChange={(value) => handleFieldChange(category, 'model', value)}
                        availableModels={availableModels}
                        recommendedModels={CATEGORY_MODEL_RECOMMENDATIONS[category]}
                        hasError={hasError}
                      />
                      {hasError && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">Model identifier is required</p>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <label htmlFor={`${category}-variant`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                            id={`${category}-variant`}
                            value={config.variant || 'medium'}
                            onChange={(e) => handleFieldChange(category, 'variant', e.target.value as OMOCategoryConfig['variant'])}
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-slate-100 transition-shadow shadow-sm"
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
                      onClick={() => setDetailsOpen(prev => ({ ...prev, [category]: !prev[category] }))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-slate-500" />
                        Additional Configuration
                      </span>
                      {detailsOpen[category] ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {detailsOpen[category] && (
                      <div className="mt-4 space-y-6">

                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 space-y-3">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Disable Category</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Disable this category</p>
                        <FieldHint>Prevent agents in this category from being invoked</FieldHint>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.disable ?? false}
                        onChange={(e) => handleFieldChange(category, 'disable', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        aria-label={`Disable ${category} category`}
                      />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen(prev => ({ ...prev, [category]: !prev[category] }))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-500" />
                        Advanced Parameters
                      </span>
                      {advancedOpen[category] ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {advancedOpen[category] && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-1.5">
                            <label htmlFor={`${category}-temperature`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Temperature
                            </label>
                            <input
                              id={`${category}-temperature`}
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              value={config.temperature ?? ''}
                              onChange={(e) => handleFieldChange(category, 'temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Default (0.7)"
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            />
                            <FieldHint>Controls randomness (0-2). Lower = more focused</FieldHint>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor={`${category}-top-p`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Top-p
                            </label>
                            <input
                              id={`${category}-top-p`}
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              value={config.top_p ?? ''}
                              onChange={(e) => handleFieldChange(category, 'top_p', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Default (1.0)"
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            />
                            <FieldHint>Nucleus sampling threshold (0-1)</FieldHint>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor={`${category}-maxTokens`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Max Tokens
                            </label>
                            <input
                              id={`${category}-maxTokens`}
                              type="number"
                              min="1"
                              value={config.maxTokens ?? ''}
                              onChange={(e) => handleFieldChange(category, 'maxTokens', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                              placeholder="Default"
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            />
                            <FieldHint>Maximum tokens in the response</FieldHint>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor={`${category}-reasoningEffort`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Reasoning Effort
                            </label>
                            <select
                              id={`${category}-reasoningEffort`}
                              value={config.reasoningEffort || ''}
                              onChange={(e) => {
                                const nextReasoningEffort = e.target.value === ''
                                  ? undefined
                                  : (e.target.value as ReasoningEffort);
                                handleFieldChange(category, 'reasoningEffort', nextReasoningEffort);
                              }}
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            >
                              <option value="">Default</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="xhigh">Extra High</option>
                            </select>
                            <FieldHint>Level of reasoning depth</FieldHint>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor={`${category}-textVerbosity`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Text Verbosity
                            </label>
                            <select
                              id={`${category}-textVerbosity`}
                              value={config.textVerbosity || ''}
                              onChange={(e) => {
                                const nextTextVerbosity = e.target.value === ''
                                  ? undefined
                                  : (e.target.value as TextVerbosity);
                                handleFieldChange(category, 'textVerbosity', nextTextVerbosity);
                              }}
                              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                            >
                              <option value="">Default</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <FieldHint>Controls response length and detail</FieldHint>
                          </div>
                        </div>

                        <div className="mt-5 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 space-y-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Thinking Configuration</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label htmlFor={`${category}-thinking-type`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Thinking Mode
                              </label>
                              <select
                                id={`${category}-thinking-type`}
                                value={config.thinking?.type || ''}
                                onChange={(e) => {
                                  const currentThinking = config.thinking;
                                  const newType = e.target.value as ThinkingConfig['type'] | '';
                                  if (newType === '') {
                                    handleFieldChange(category, 'thinking', undefined);
                                  } else {
                                    handleFieldChange(category, 'thinking', {
                                      type: newType,
                                      budgetTokens: currentThinking?.budgetTokens,
                                    });
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow"
                              >
                                <option value="">Disabled</option>
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Force Disabled</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor={`${category}-thinking-budget`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Budget Tokens
                              </label>
                              <input
                                id={`${category}-thinking-budget`}
                                type="number"
                                min="1"
                                value={config.thinking?.budgetTokens ?? ''}
                                onChange={(e) => {
                                  const currentThinking = config.thinking;
                                  const budgetTokens = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                  if (currentThinking?.type) {
                                    handleFieldChange(category, 'thinking', {
                                      type: currentThinking.type,
                                      budgetTokens,
                                    });
                                  }
                                }}
                                placeholder="Default"
                                disabled={!config.thinking?.type}
                                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
                          onChange={(e) => handleFallbackModelsChange(category, e.target.value)}
                          placeholder="model1, model2, model3..."
                          className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow"
                        />
                        <FieldHint>Alternative models if primary is unavailable</FieldHint>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Skills & Tools
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label htmlFor={`${category}-skills`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Skills (comma-separated)
                          </label>
                          <input
                            id={`${category}-skills`}
                            type="text"
                            value={(config.skills || []).join(', ')}
                            onChange={(e) => handleSkillsChange(category, e.target.value)}
                            placeholder="e.g., react, typescript, tailwind"
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow"
                          />
                          <FieldHint>Default skills for this category</FieldHint>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor={`${category}-tools`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Tools (comma-separated)
                          </label>
                          <input
                            id={`${category}-tools`}
                            type="text"
                            value={config.tools ? Object.keys(config.tools).join(', ') : ''}
                            onChange={(e) => handleToolsChange(category, e.target.value)}
                            placeholder="e.g., git, npm, docker"
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow"
                          />
                          <FieldHint>Default tools for this category</FieldHint>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        Prompt Configuration
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label htmlFor={`${category}-prompt`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Custom System Prompt
                          </label>
                          <textarea
                            id={`${category}-prompt`}
                            value={config.prompt || ''}
                            onChange={(e) => handleFieldChange(category, 'prompt', e.target.value || undefined)}
                            placeholder="Enter custom system prompt for this category..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow resize-y"
                          />
                          <FieldHint>Override the default system prompt for this category</FieldHint>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor={`${category}-prompt-append`} className="block text-xs text-slate-500 dark:text-slate-400">
                            Prompt Append
                          </label>
                          <textarea
                            id={`${category}-prompt-append`}
                            value={config.prompt_append || ''}
                            onChange={(e) => handleFieldChange(category, 'prompt_append', e.target.value || undefined)}
                            placeholder="Text to append to all prompts..."
                            rows={2}
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow resize-y"
                          />
                          <FieldHint>Additional context appended to prompts in this category</FieldHint>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        Default Permissions
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${category}-shell`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Shell Access</label>
                          <select
                            id={`${category}-shell`}
                            value={(config.permission?.bash as string) || 'ask'}
                            onChange={(e) => handlePermissionChange(category, 'bash', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${category}-web`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Web Access</label>
                          <select
                            id={`${category}-web`}
                            value={config.permission?.webfetch || 'ask'}
                            onChange={(e) => handlePermissionChange(category, 'webfetch', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${category}-edit`} className="text-sm font-medium text-slate-700 dark:text-slate-300">File Edit</label>
                          <select
                            id={`${category}-edit`}
                            value={config.permission?.edit || 'ask'}
                            onChange={(e) => handlePermissionChange(category, 'edit', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${category}-task`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Creation</label>
                          <select
                            id={`${category}-task`}
                            value={config.permission?.task || 'ask'}
                            onChange={(e) => handlePermissionChange(category, 'task', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${category}-doom-loop`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Doom Loop</label>
                          <select
                            id={`${category}-doom-loop`}
                            value={config.permission?.doom_loop || 'ask'}
                            onChange={(e) => handlePermissionChange(category, 'doom_loop', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="allow">Always</option>
                            <option value="ask">Ask</option>
                            <option value="deny">Never</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <label htmlFor={`${category}-ext-dir`} className="text-sm font-medium text-slate-700 dark:text-slate-300">External Directory</label>
                          <select
                            id={`${category}-ext-dir`}
                            value={config.permission?.external_directory || 'ask'}
                            onChange={(e) => handlePermissionChange(category, 'external_directory', e.target.value as PermissionLevel)}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

export default CategoryEditor;
