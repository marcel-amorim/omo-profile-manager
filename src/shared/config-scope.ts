import {
  DEFAULT_BROWSER_AUTOMATION_PROVIDER,
  DEFAULT_RUNTIME_FALLBACK_SETTINGS,
  DEFAULT_SISYPHUS_AGENT_SETTINGS,
  OMO_SCHEMA_URL,
} from './constants';
import type {
  BackgroundTaskSettings,
  BrowserAutomationEngineSettings,
  ExperimentalSettings,
  GitMasterSettings,
  NotificationSettings,
  OMOAgentConfig,
  OMOConfig,
  OMOGlobalSettings,
  OMOSharedSettings,
  RuntimeFallbackSettings,
  SisyphusAgentSettings,
  SisyphusSettings,
  ThinkingConfig,
} from './types';
type SharedConfigKey = Exclude<keyof OMOGlobalSettings, '$schema'>;

const SHARED_CONFIG_KEYS: SharedConfigKey[] = [
  'new_task_system_enabled',
  'sisyphus_agent',
  'sisyphus',
  'background_task',
  'default_run_agent',
  'disabled_mcps',
  'disabled_agents',
  'disabled_skills',
  'disabled_hooks',
  'disabled_commands',
  'disabled_tools',
  'hashline_edit',
  'model_fallback',
  'browser_automation_engine',
  'notification',
  'git_master',
  'runtime_fallback',
  'experimental',
];

function normalizeSisyphusAgentSettings(
  settings?: Partial<SisyphusAgentSettings>
): SisyphusAgentSettings {
  return {
    ...DEFAULT_SISYPHUS_AGENT_SETTINGS,
    ...settings,
  };
}

function normalizeBackgroundTaskSettings(
  settings?: BackgroundTaskSettings
): BackgroundTaskSettings | undefined {
  if (!settings) {
    return undefined;
  }

  return {
    defaultConcurrency: settings.defaultConcurrency,
    staleTimeoutMs: settings.staleTimeoutMs,
  };
}

function normalizeSisyphusSettings(settings?: SisyphusSettings): SisyphusSettings | undefined {
  if (!settings?.tasks) {
    return undefined;
  }

  return {
    tasks: {
      enabled: settings.tasks.enabled,
      storage_path: settings.tasks.storage_path,
      claude_code_compat: settings.tasks.claude_code_compat,
    },
  };
}

function normalizeBrowserAutomationEngineSettings(
  settings?: BrowserAutomationEngineSettings
): BrowserAutomationEngineSettings | undefined {
  if (!settings) {
    return undefined;
  }

  return {
    provider: settings.provider ?? DEFAULT_BROWSER_AUTOMATION_PROVIDER,
  };
}

function normalizeNotificationSettings(
  settings?: NotificationSettings
): NotificationSettings | undefined {
  if (!settings) {
    return undefined;
  }

  return {
    force_enable: settings.force_enable,
  };
}

function normalizeGitMasterSettings(settings?: GitMasterSettings): GitMasterSettings | undefined {
  if (!settings) {
    return undefined;
  }

  return {
    commit_footer: settings.commit_footer,
    include_co_authored_by: settings.include_co_authored_by,
  };
}

function normalizeRuntimeFallbackSettings(
  settings?: RuntimeFallbackSettings
): RuntimeFallbackSettings | undefined {
  if (!settings) {
    return undefined;
  }

  return {
    ...DEFAULT_RUNTIME_FALLBACK_SETTINGS,
    ...settings,
  };
}

function normalizeExperimentalSettings(
  settings?: ExperimentalSettings
): ExperimentalSettings | undefined {
  if (!settings) {
    return undefined;
  }

  return {
    auto_resume: settings.auto_resume,
    disable_omo_env: settings.disable_omo_env,
    task_system: settings.task_system,
  };
}

export function createDefaultSharedSettings(): OMOSharedSettings {
  return {
    $schema: OMO_SCHEMA_URL,
    sisyphus_agent: normalizeSisyphusAgentSettings(),
    browser_automation_engine: {
      provider: DEFAULT_BROWSER_AUTOMATION_PROVIDER,
    },
    runtime_fallback: {
      ...DEFAULT_RUNTIME_FALLBACK_SETTINGS,
    },
    hashline_edit: true,
    model_fallback: true,
  };
}

export function extractSharedSettings(config?: Partial<OMOGlobalSettings> | null): OMOSharedSettings {
  const defaults = createDefaultSharedSettings();
  const source = config ?? {};

  return {
    $schema: source.$schema ?? defaults.$schema,
    new_task_system_enabled: source.new_task_system_enabled,
    sisyphus_agent: normalizeSisyphusAgentSettings(source.sisyphus_agent),
    sisyphus: normalizeSisyphusSettings(source.sisyphus),
    background_task: normalizeBackgroundTaskSettings(source.background_task),
    default_run_agent: source.default_run_agent,
    disabled_mcps: source.disabled_mcps,
    disabled_agents: source.disabled_agents,
    disabled_skills: source.disabled_skills,
    disabled_hooks: source.disabled_hooks,
    disabled_commands: source.disabled_commands,
    disabled_tools: source.disabled_tools,
    hashline_edit: source.hashline_edit ?? defaults.hashline_edit,
    model_fallback: source.model_fallback ?? defaults.model_fallback,
    browser_automation_engine: normalizeBrowserAutomationEngineSettings(
      source.browser_automation_engine ?? defaults.browser_automation_engine
    ),
    notification: normalizeNotificationSettings(source.notification),
    git_master: normalizeGitMasterSettings(source.git_master),
    runtime_fallback: normalizeRuntimeFallbackSettings(
      source.runtime_fallback ?? defaults.runtime_fallback
    ),
    experimental: normalizeExperimentalSettings(source.experimental),
  };
}

export function stripSharedSettingsFromConfig(config: OMOConfig): OMOConfig {
  return {
    $schema: config.$schema ?? OMO_SCHEMA_URL,
    agents: config.agents,
    categories: config.categories,
  };
}

export function mergeSharedSettingsIntoConfig(
  profileConfig: OMOConfig,
  sharedSettings: OMOSharedSettings
): OMOConfig {
  const baseConfig = stripSharedSettingsFromConfig(profileConfig);
  const normalizedSharedSettings = extractSharedSettings(sharedSettings);

  return {
    ...baseConfig,
    ...normalizedSharedSettings,
    agents: baseConfig.agents,
    categories: baseConfig.categories,
  };
}

export function isSharedConfigKey(key: string): key is SharedConfigKey {
  return SHARED_CONFIG_KEYS.includes(key as SharedConfigKey);
}

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P = 1;
const DEFAULT_DISABLE = false;
const DEFAULT_MODE = 'subagent';
const DEFAULT_TEXT_VERBOSITY = 'medium';
const DEFAULT_REASONING_EFFORT = 'medium';

function stripAgentDefaults(config: OMOAgentConfig): OMOAgentConfig {
  const result: OMOAgentConfig = { model: config.model, variant: config.variant };

  if (config.fallback_models !== undefined) {
    const fm = Array.isArray(config.fallback_models) ? config.fallback_models : [config.fallback_models];
    if (fm.length > 0) result.fallback_models = config.fallback_models;
  }

  if (config.category !== undefined) result.category = config.category;
  if (config.skills !== undefined && config.skills.length > 0) result.skills = config.skills;
  if (config.prompt !== undefined) result.prompt = config.prompt;
  if (config.prompt_append !== undefined) result.prompt_append = config.prompt_append;
  if (config.tools !== undefined) result.tools = config.tools;
  if (config.description !== undefined) result.description = config.description;
  if (config.color !== undefined) result.color = config.color;
  if (config.providerOptions !== undefined) result.providerOptions = config.providerOptions;
  if (config.ultrawork !== undefined) result.ultrawork = config.ultrawork;
  if (config.compaction !== undefined) result.compaction = config.compaction;

  if (config.permission !== undefined) {
    const stripped: OMOAgentConfig['permission'] = {};
    if (config.permission.edit !== undefined && config.permission.edit !== 'ask') stripped.edit = config.permission.edit;
    if (config.permission.bash !== undefined && config.permission.bash !== 'ask') stripped.bash = config.permission.bash;
    if (config.permission.webfetch !== undefined && config.permission.webfetch !== 'ask') stripped.webfetch = config.permission.webfetch;
    if (config.permission.task !== undefined && config.permission.task !== 'ask') stripped.task = config.permission.task;
    if (config.permission.doom_loop !== undefined && config.permission.doom_loop !== 'ask') stripped.doom_loop = config.permission.doom_loop;
    if (config.permission.external_directory !== undefined && config.permission.external_directory !== 'ask') stripped.external_directory = config.permission.external_directory;
    if (Object.keys(stripped).length > 0) result.permission = stripped;
  }

  if (config.temperature !== undefined && config.temperature !== DEFAULT_TEMPERATURE) result.temperature = config.temperature;
  if (config.top_p !== undefined && config.top_p !== DEFAULT_TOP_P) result.top_p = config.top_p;
  if (config.disable !== undefined && config.disable !== DEFAULT_DISABLE) result.disable = config.disable;
  if (config.maxTokens !== undefined) result.maxTokens = config.maxTokens;
  if (config.reasoningEffort !== undefined && config.reasoningEffort !== DEFAULT_REASONING_EFFORT) result.reasoningEffort = config.reasoningEffort;
  if (config.textVerbosity !== undefined && config.textVerbosity !== DEFAULT_TEXT_VERBOSITY) result.textVerbosity = config.textVerbosity;
  if (config.mode !== undefined && config.mode !== DEFAULT_MODE) result.mode = config.mode;

  if (config.thinking !== undefined) {
    const t = config.thinking;
    const shouldStripThinking = t.type === 'disabled' && t.budgetTokens === undefined;
    if (!shouldStripThinking) {
      const strippedThinking: ThinkingConfig = { type: t.type };
      if (t.budgetTokens !== undefined) strippedThinking.budgetTokens = t.budgetTokens;
      result.thinking = strippedThinking;
    }
  }

  return result;
}

export function stripDefaultValuesFromConfig(
  config: OMOConfig
): OMOConfig {
  const strippedAgents: Record<string, OMOAgentConfig> = {};
  for (const [name, agentConfig] of Object.entries(config.agents)) {
    strippedAgents[name] = stripAgentDefaults(agentConfig);
  }

  const strippedCategories: Record<string, OMOAgentConfig> = {};
  for (const [name, categoryConfig] of Object.entries(config.categories)) {
    strippedCategories[name] = stripAgentDefaults(categoryConfig);
  }

  return {
    ...config,
    agents: strippedAgents,
    categories: strippedCategories,
  };
}
