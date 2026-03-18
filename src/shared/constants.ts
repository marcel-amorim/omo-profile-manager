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

export type AgentName = typeof DEFAULT_AGENTS[number];
export type CategoryName = typeof DEFAULT_CATEGORIES[number];
export type VariantOption = typeof VARIANT_OPTIONS[number];
