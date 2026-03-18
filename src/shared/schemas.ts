import { z } from 'zod';
import {
  DEFAULT_AGENTS,
  DEFAULT_CATEGORIES,
} from './constants';

export const PermissionLevelSchema = z.enum(['ask', 'allow', 'deny']);
export type PermissionLevel = z.infer<typeof PermissionLevelSchema>;

export const BashPermissionSchema = z.union([
  PermissionLevelSchema,
  z.record(z.string(), PermissionLevelSchema),
]);
export type BashPermission = z.infer<typeof BashPermissionSchema>;

export const AgentPermissionSchema = z.object({
  edit: PermissionLevelSchema.optional(),
  bash: BashPermissionSchema.optional(),
  webfetch: PermissionLevelSchema.optional(),
  task: PermissionLevelSchema.optional(),
  doom_loop: PermissionLevelSchema.optional(),
  external_directory: PermissionLevelSchema.optional(),
});
export type AgentPermission = z.infer<typeof AgentPermissionSchema>;

export const ThinkingConfigSchema = z.object({
  type: z.enum(['enabled', 'disabled']),
  budgetTokens: z.number().positive().optional(),
});
export type ThinkingConfig = z.infer<typeof ThinkingConfigSchema>;

export const UltraworkConfigSchema = z.object({
  model: z.string().optional(),
  variant: z.string().optional(),
});
export type UltraworkConfig = z.infer<typeof UltraworkConfigSchema>;

export const CompactionConfigSchema = z.object({
  model: z.string().optional(),
  variant: z.string().optional(),
});
export type CompactionConfig = z.infer<typeof CompactionConfigSchema>;

export const AgentModeSchema = z.enum(['subagent', 'primary', 'all']);
export type AgentMode = z.infer<typeof AgentModeSchema>;

export const TextVerbositySchema = z.enum(['low', 'medium', 'high']);
export type TextVerbosity = z.infer<typeof TextVerbositySchema>;

export const ReasoningEffortSchema = z.enum(['low', 'medium', 'high', 'xhigh']);
export type ReasoningEffort = z.infer<typeof ReasoningEffortSchema>;

export const ToolsConfigSchema = z.record(z.string(), z.boolean());
export type ToolsConfig = z.infer<typeof ToolsConfigSchema>;

export const ProviderOptionsSchema = z.record(z.string(), z.unknown());
export type ProviderOptions = z.infer<typeof ProviderOptionsSchema>;

export const VariantOptionSchema = z.enum(['low', 'medium', 'high', 'xhigh']);
export type VariantOption = z.infer<typeof VariantOptionSchema>;

export const OMOBaseConfigSchema = z.object({
  model: z.string(),
  variant: VariantOptionSchema,
});
export type OMOBaseConfig = z.infer<typeof OMOBaseConfigSchema>;

export const OMOAgentConfigSchema = OMOBaseConfigSchema.extend({
  fallback_models: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  prompt: z.string().optional(),
  prompt_append: z.string().optional(),
  tools: ToolsConfigSchema.optional(),
  disable: z.boolean().optional(),
  description: z.string().optional(),
  mode: AgentModeSchema.optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  permission: AgentPermissionSchema.optional(),
  maxTokens: z.number().positive().optional(),
  thinking: ThinkingConfigSchema.optional(),
  reasoningEffort: ReasoningEffortSchema.optional(),
  textVerbosity: TextVerbositySchema.optional(),
  providerOptions: ProviderOptionsSchema.optional(),
  ultrawork: UltraworkConfigSchema.optional(),
  compaction: CompactionConfigSchema.optional(),
});
export type OMOAgentConfig = z.infer<typeof OMOAgentConfigSchema>;

export const OMOCategoryConfigSchema = OMOAgentConfigSchema;
export type OMOCategoryConfig = z.infer<typeof OMOCategoryConfigSchema>;

export const OMOGlobalSettingsSchema = z.object({
  $schema: z.string().optional(),
  new_task_system_enabled: z.boolean().optional(),
  default_run_agent: z.string().optional(),
  disabled_mcps: z.array(z.string().min(1)).optional(),
  disabled_agents: z.array(z.string()).optional(),
  disabled_skills: z.array(z.string()).optional(),
  disabled_hooks: z.array(z.string()).optional(),
  disabled_commands: z.array(z.string()).optional(),
  disabled_tools: z.array(z.string()).optional(),
  hashline_edit: z.boolean().optional(),
  model_fallback: z.boolean().optional(),
});
export type OMOGlobalSettings = z.infer<typeof OMOGlobalSettingsSchema>;

export const AgentNameSchema = z.enum(DEFAULT_AGENTS);
export type AgentName = z.infer<typeof AgentNameSchema>;

export const CategoryNameSchema = z.enum(DEFAULT_CATEGORIES);
export type CategoryName = z.infer<typeof CategoryNameSchema>;

export const OMOConfigSchema = OMOGlobalSettingsSchema.extend({
  agents: z.record(AgentNameSchema, OMOAgentConfigSchema),
  categories: z.record(CategoryNameSchema, OMOCategoryConfigSchema),
});
export type OMOConfig = z.infer<typeof OMOConfigSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  config: OMOConfigSchema,
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const BackupInfoSchema = z.object({
  timestamp: z.number().positive(),
  originalPath: z.string(),
  backupPath: z.string(),
});
export type BackupInfo = z.infer<typeof BackupInfoSchema>;

export function validateOMOConfig(data: unknown): OMOConfig {
  return OMOConfigSchema.parse(data);
}

export function validateOMOConfigSafe(
  data: unknown
): { success: true; data: OMOConfig } | { success: false; error: z.ZodError } {
  const result = OMOConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validatePartialConfig(data: unknown): Partial<OMOConfig> {
  return OMOConfigSchema.partial().parse(data);
}

export function validatePartialConfigSafe(
  data: unknown
): { success: true; data: Partial<OMOConfig> } | { success: false; error: z.ZodError } {
  const result = OMOConfigSchema.partial().safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateProfile(data: unknown): Profile {
  return ProfileSchema.parse(data);
}

export function validateProfileSafe(
  data: unknown
): { success: true; data: Profile } | { success: false; error: z.ZodError } {
  const result = ProfileSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateAgentConfig(data: unknown): OMOAgentConfig {
  return OMOAgentConfigSchema.parse(data);
}

export function validateAgentConfigSafe(
  data: unknown
): { success: true; data: OMOAgentConfig } | { success: false; error: z.ZodError } {
  const result = OMOAgentConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateCategoryConfig(data: unknown): OMOCategoryConfig {
  return OMOCategoryConfigSchema.parse(data);
}

export function validateCategoryConfigSafe(
  data: unknown
): { success: true; data: OMOCategoryConfig } | { success: false; error: z.ZodError } {
  const result = OMOCategoryConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function isValidVariant(value: unknown): value is VariantOption {
  return VariantOptionSchema.safeParse(value).success;
}

export function isValidPermissionLevel(value: unknown): value is PermissionLevel {
  return PermissionLevelSchema.safeParse(value).success;
}

export function isValidReasoningEffort(value: unknown): value is ReasoningEffort {
  return ReasoningEffortSchema.safeParse(value).success;
}

export function isValidTextVerbosity(value: unknown): value is TextVerbosity {
  return TextVerbositySchema.safeParse(value).success;
}

export function isValidAgentMode(value: unknown): value is AgentMode {
  return AgentModeSchema.safeParse(value).success;
}

export function isValidAgentName(value: unknown): value is AgentName {
  return AgentNameSchema.safeParse(value).success;
}

export function isValidCategoryName(value: unknown): value is CategoryName {
  return CategoryNameSchema.safeParse(value).success;
}
