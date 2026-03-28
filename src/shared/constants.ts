export const DEFAULT_AGENTS = [
  'sisyphus',
  'oracle',
  'librarian',
  'explore',
  'multimodal-looker',
  'prometheus',
  'metis',
  'momus',
  'atlas',
  'hephaestus',
] as const;

export const DEFAULT_CATEGORIES = [
  'visual-engineering',
  'ultrabrain',
  'deep',
  'artistry',
  'quick',
  'unspecified-low',
  'unspecified-high',
  'writing',
] as const;

export const VARIANT_OPTIONS = ['low', 'medium', 'high', 'xhigh'] as const;

export const OMO_SCHEMA_URL =
  'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/dev/assets/oh-my-opencode.schema.json';

export const DEFAULT_SISYPHUS_AGENT_SETTINGS = {
  disabled: false,
  default_builder_enabled: true,
  planner_enabled: true,
  replace_plan: false,
};

export const DEFAULT_RUNTIME_FALLBACK_SETTINGS = {
  enabled: true,
  max_fallback_attempts: 3,
  cooldown_seconds: 60,
  timeout_seconds: 30,
  notify_on_fallback: true,
};

export const DEFAULT_BROWSER_AUTOMATION_PROVIDER = 'playwright' as const;

export type AgentName = typeof DEFAULT_AGENTS[number];
export type CategoryName = typeof DEFAULT_CATEGORIES[number];
export type VariantOption = typeof VARIANT_OPTIONS[number];
