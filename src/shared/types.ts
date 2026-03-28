/**
 * Type definitions for OMO (Oh My OpenCode) configuration
 * 
 * This file contains TypeScript interfaces for the OMO configuration structure,
 * including agents, categories, profiles, and backup information.
 */

import type { AgentName, CategoryName, VariantOption } from './constants';
import {
  DEFAULT_AGENTS,
  DEFAULT_CATEGORIES,
  DEFAULT_SISYPHUS_AGENT_SETTINGS,
  OMO_SCHEMA_URL,
} from './constants';
import { AGENT_MODEL_RECOMMENDATIONS, CATEGORY_MODEL_RECOMMENDATIONS } from './model-recommendations';

/**
 * Permission levels for various operations
 */
export type PermissionLevel = 'ask' | 'allow' | 'deny';

/**
 * Bash permission can be a single level or per-directory mapping
 */
export type BashPermission = PermissionLevel | Record<string, PermissionLevel>;

/**
 * Permission configuration for an agent
 */
export interface AgentPermission {
  edit?: PermissionLevel;
  bash?: BashPermission;
  webfetch?: PermissionLevel;
  task?: PermissionLevel;
  doom_loop?: PermissionLevel;
  external_directory?: PermissionLevel;
}

/**
 * Thinking configuration for agents that support it
 */
export interface ThinkingConfig {
  type: 'enabled' | 'disabled';
  budgetTokens?: number;
}

/**
 * Ultrawork mode configuration
 */
export interface UltraworkConfig {
  model?: string;
  variant?: string;
}

/**
 * Compaction mode configuration
 */
export interface CompactionConfig {
  model?: string;
  variant?: string;
}

/**
 * Agent mode - determines how the agent operates
 */
export type AgentMode = 'subagent' | 'primary' | 'all';

/**
 * Text verbosity level
 */
export type TextVerbosity = 'low' | 'medium' | 'high';

/**
 * Reasoning effort level
 */
export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh';

/**
 * Tool configuration map
 */
export type ToolsConfig = Record<string, boolean>;

/**
 * Provider-specific options
 */
export type ProviderOptions = Record<string, unknown>;

/**
 * Base configuration shared between agents and categories
 */
export interface OMOBaseConfig {
  /** Model identifier (e.g., 'opencode-go/gpt-5.5', 'anthropic/claude-4') */
  model: string;
  
  /** Model variant: low (faster), medium (balanced), high (better quality), xhigh (best quality) */
  variant: VariantOption;
}

/**
 * Extended configuration options for agents
 */
export interface OMOAgentConfig extends OMOBaseConfig {
  /** Fallback model(s) to use if primary is unavailable */
  fallback_models?: string | string[];
  
  /** Category assignment for this agent */
  category?: string;
  
  /** Skills enabled for this agent */
  skills?: string[];
  
  /** Temperature for model responses (0-2) */
  temperature?: number;
  
  /** Top-p sampling parameter (0-1) */
  top_p?: number;
  
  /** Custom system prompt */
  prompt?: string;
  
  /** Text to append to prompts */
  prompt_append?: string;
  
  /** Tool availability configuration */
  tools?: ToolsConfig;
  
  /** Whether this agent is disabled */
  disable?: boolean;
  
  /** Agent description */
  description?: string;
  
  /** Agent operating mode */
  mode?: AgentMode;
  
  /** Agent color in hex format (e.g., '#FF5733') */
  color?: string;
  
  /** Permission settings */
  permission?: AgentPermission;
  
  /** Maximum tokens for responses */
  maxTokens?: number;
  
  /** Thinking mode configuration */
  thinking?: ThinkingConfig;
  
  /** Reasoning effort level */
  reasoningEffort?: ReasoningEffort;
  
  /** Text verbosity preference */
  textVerbosity?: TextVerbosity;
  
  /** Provider-specific options */
  providerOptions?: ProviderOptions;
  
  /** Ultrawork mode configuration */
  ultrawork?: UltraworkConfig;
  
  /** Compaction mode configuration */
  compaction?: CompactionConfig;
}

/**
 * Category configuration (same structure as agent config)
 */
export type OMOCategoryConfig = OMOAgentConfig;

export interface BackgroundTaskSettings {
  defaultConcurrency?: number;
  staleTimeoutMs?: number;
}

export interface SisyphusTaskSettings {
  enabled?: boolean;
  storage_path?: string;
  claude_code_compat?: boolean;
}

export interface SisyphusSettings {
  tasks?: SisyphusTaskSettings;
}

export type BrowserAutomationProvider = 'playwright' | 'agent-browser';

export interface BrowserAutomationEngineSettings {
  provider?: BrowserAutomationProvider;
}

export interface NotificationSettings {
  force_enable?: boolean;
}

export interface GitMasterSettings {
  commit_footer?: boolean;
  include_co_authored_by?: boolean;
}

export interface RuntimeFallbackSettings {
  enabled?: boolean;
  max_fallback_attempts?: number;
  cooldown_seconds?: number;
  timeout_seconds?: number;
  notify_on_fallback?: boolean;
}

export interface ExperimentalSettings {
  auto_resume?: boolean;
  disable_omo_env?: boolean;
  task_system?: boolean;
}

/**
 * Global settings for OMO configuration
 */
export interface OMOGlobalSettings {
  /** Schema reference */
  $schema?: string;
  
  /** Whether new task system is enabled */
  new_task_system_enabled?: boolean;

  sisyphus_agent?: SisyphusAgentSettings;

  sisyphus?: SisyphusSettings;

  background_task?: BackgroundTaskSettings;
  
  /** Default agent to run */
  default_run_agent?: string;
  
  /** List of disabled MCPs */
  disabled_mcps?: string[];
  
  /** List of disabled agents */
  disabled_agents?: string[];
  
  /** List of disabled skills */
  disabled_skills?: string[];
  
  /** List of disabled hooks */
  disabled_hooks?: string[];
  
  /** List of disabled commands */
  disabled_commands?: string[];
  
  /** List of disabled tools */
  disabled_tools?: string[];
  
  /** Enable hashline editing */
  hashline_edit?: boolean;
  
  /** Enable model fallback */
  model_fallback?: boolean;

  browser_automation_engine?: BrowserAutomationEngineSettings;

  notification?: NotificationSettings;

  git_master?: GitMasterSettings;

  runtime_fallback?: RuntimeFallbackSettings;

  experimental?: ExperimentalSettings;
}

export interface SisyphusAgentSettings {
  disabled?: boolean;
  default_builder_enabled: boolean;
  planner_enabled?: boolean;
  replace_plan: boolean;
}

export type OMOSharedSettings = OMOGlobalSettings;

/**
 * Complete OMO configuration structure
 */
export interface OMOConfig extends OMOGlobalSettings {
  /** Agent configurations keyed by agent name */
  agents: Record<AgentName, OMOAgentConfig>;
  
  /** Category configurations keyed by category name */
  categories: Record<CategoryName, OMOCategoryConfig>;
}

/**
 * Profile structure for storing named configurations
 */
export interface Profile {
  /** Unique profile identifier */
  id: string;
  
  /** Profile display name */
  name: string;
  
  /** Optional profile description */
  description?: string;
  
  /** The OMO configuration for this profile */
  config: OMOConfig;
  
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  
  /** Last update timestamp (Unix ms) */
  updatedAt: number;
}

/**
 * Backup information structure
 */
export interface BackupInfo {
  /** Backup creation timestamp */
  timestamp: number;
  
  /** Original configuration file path */
  originalPath: string;
  
  /** Backup file path */
  backupPath: string;
}

/**
 * Type guard to check if a value is a valid PermissionLevel
 */
export function isPermissionLevel(value: unknown): value is PermissionLevel {
  return value === 'ask' || value === 'allow' || value === 'deny';
}

/**
 * Type guard to check if a value is a valid VariantOption
 */
export function isVariantOption(value: unknown): value is VariantOption {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'xhigh';
}

/**
 * Type guard to check if a value is a valid ReasoningEffort
 */
export function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'xhigh';
}

/**
 * Type guard to check if a value is a valid TextVerbosity
 */
export function isTextVerbosity(value: unknown): value is TextVerbosity {
  return value === 'low' || value === 'medium' || value === 'high';
}

/**
 * Type guard to check if a value is a valid AgentMode
 */
export function isAgentMode(value: unknown): value is AgentMode {
  return value === 'subagent' || value === 'primary' || value === 'all';
}

/**
 * Default OMO configuration values
 */
export const DEFAULT_AGENT_CONFIG: Omit<OMOAgentConfig, 'model' | 'variant'> = {
  temperature: 0.7,
  top_p: 1,
  disable: false,
  mode: 'subagent',
  textVerbosity: 'medium',
  reasoningEffort: 'medium',
};

/**
 * Creates a default OMO config with all agents and categories
 */
export function createDefaultOMOConfig(
  defaultModel?: string,
  defaultVariant: VariantOption = 'medium'
): OMOConfig {
  const agents: Record<string, OMOAgentConfig> = {};
  const categories: Record<string, OMOCategoryConfig> = {};
  
  for (const agent of DEFAULT_AGENTS) {
    agents[agent] = {
      model: defaultModel || AGENT_MODEL_RECOMMENDATIONS[agent]?.[0] || 'opencode-go/gpt-5.5',
      variant: defaultVariant,
      ...DEFAULT_AGENT_CONFIG,
    };
  }
  
  for (const category of DEFAULT_CATEGORIES) {
    categories[category] = {
      model: defaultModel || CATEGORY_MODEL_RECOMMENDATIONS[category]?.[0] || 'opencode-go/gpt-5.5',
      variant: defaultVariant,
      ...DEFAULT_AGENT_CONFIG,
    };
  }
  
  return {
    $schema: OMO_SCHEMA_URL,
    sisyphus_agent: { ...DEFAULT_SISYPHUS_AGENT_SETTINGS },
    agents,
    categories,
    model_fallback: true,
    hashline_edit: true,
  };
}
