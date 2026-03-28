import { describe, it, expect } from 'vitest';
import {
  PermissionLevelSchema,
  BashPermissionSchema,
  AgentPermissionSchema,
  ThinkingConfigSchema,
  AgentModeSchema,
  TextVerbositySchema,
  ReasoningEffortSchema,
  ToolsConfigSchema,
  ProviderOptionsSchema,
  VariantOptionSchema,
  OMOBaseConfigSchema,
  OMOAgentConfigSchema,
  OMOGlobalSettingsSchema,
  AgentNameSchema,
  CategoryNameSchema,
  OMOConfigSchema,
  ProfileSchema,
  validateOMOConfig,
  validateOMOConfigSafe,
  validateProfile,
  validateProfileSafe,
  validateAgentConfig,
  validateCategoryConfig,
  isValidVariant,
  isValidPermissionLevel,
  isValidReasoningEffort,
  isValidTextVerbosity,
  isValidAgentMode,
  isValidAgentName,
  isValidCategoryName,
} from '../../shared/schemas';
import { DEFAULT_AGENTS, DEFAULT_CATEGORIES } from '../../shared/constants';

const createMockAgentConfig = () => ({ model: 'gpt-4', variant: 'medium' as const });

const createMockOMOConfig = () => ({
  agents: Object.fromEntries(DEFAULT_AGENTS.map(agent => [agent, createMockAgentConfig()])),
  categories: Object.fromEntries(DEFAULT_CATEGORIES.map(cat => [cat, createMockAgentConfig()])),
});

const createMockProfile = () => ({
  id: 'profile-1',
  name: 'Test Profile',
  description: 'A test profile',
  config: createMockOMOConfig(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('Schemas', () => {
  describe('PermissionLevelSchema', () => {
    it('should accept valid permission levels', () => {
      expect(PermissionLevelSchema.parse('ask')).toBe('ask');
      expect(PermissionLevelSchema.parse('allow')).toBe('allow');
      expect(PermissionLevelSchema.parse('deny')).toBe('deny');
    });

    it('should reject invalid permission levels', () => {
      expect(() => PermissionLevelSchema.parse('invalid')).toThrow();
      expect(() => PermissionLevelSchema.parse(123)).toThrow();
      expect(() => PermissionLevelSchema.parse(null)).toThrow();
    });
  });

  describe('BashPermissionSchema', () => {
    it('should accept simple permission level', () => {
      expect(BashPermissionSchema.parse('allow')).toBe('allow');
    });

    it('should accept record of permission levels', () => {
      const record = { read: 'allow', write: 'ask', delete: 'deny' };
      expect(BashPermissionSchema.parse(record)).toEqual(record);
    });

    it('should reject invalid values', () => {
      expect(() => BashPermissionSchema.parse('invalid')).toThrow();
      expect(() => BashPermissionSchema.parse({ read: 'invalid' })).toThrow();
    });
  });

  describe('AgentPermissionSchema', () => {
    it('should accept valid permissions', () => {
      const permissions = {
        edit: 'allow',
        bash: 'ask',
        webfetch: 'deny',
      };
      expect(AgentPermissionSchema.parse(permissions)).toEqual(permissions);
    });

    it('should accept empty object', () => {
      expect(AgentPermissionSchema.parse({})).toEqual({});
    });

    it('should accept partial permissions', () => {
      expect(AgentPermissionSchema.parse({ edit: 'allow' })).toEqual({ edit: 'allow' });
    });

    it('should reject invalid permission values', () => {
      expect(() => AgentPermissionSchema.parse({ edit: 'invalid' })).toThrow();
    });
  });

  describe('ThinkingConfigSchema', () => {
    it('should accept enabled with budget tokens', () => {
      const config = { type: 'enabled', budgetTokens: 1000 };
      expect(ThinkingConfigSchema.parse(config)).toEqual(config);
    });

    it('should accept disabled without budget tokens', () => {
      const config = { type: 'disabled' };
      expect(ThinkingConfigSchema.parse(config)).toEqual(config);
    });

    it('should reject invalid type', () => {
      expect(() => ThinkingConfigSchema.parse({ type: 'invalid' })).toThrow();
    });
  });

  describe('VariantOptionSchema', () => {
    it('should accept valid variants', () => {
      expect(VariantOptionSchema.parse('low')).toBe('low');
      expect(VariantOptionSchema.parse('medium')).toBe('medium');
      expect(VariantOptionSchema.parse('high')).toBe('high');
      expect(VariantOptionSchema.parse('xhigh')).toBe('xhigh');
    });

    it('should reject invalid variants', () => {
      expect(() => VariantOptionSchema.parse('invalid')).toThrow();
      expect(() => VariantOptionSchema.parse(1)).toThrow();
    });
  });

  describe('AgentModeSchema', () => {
    it('should accept valid modes', () => {
      expect(AgentModeSchema.parse('subagent')).toBe('subagent');
      expect(AgentModeSchema.parse('primary')).toBe('primary');
      expect(AgentModeSchema.parse('all')).toBe('all');
    });

    it('should reject invalid modes', () => {
      expect(() => AgentModeSchema.parse('invalid')).toThrow();
    });
  });

  describe('TextVerbositySchema', () => {
    it('should accept valid verbosity levels', () => {
      expect(TextVerbositySchema.parse('low')).toBe('low');
      expect(TextVerbositySchema.parse('medium')).toBe('medium');
      expect(TextVerbositySchema.parse('high')).toBe('high');
    });

    it('should reject invalid verbosity levels', () => {
      expect(() => TextVerbositySchema.parse('verbose')).toThrow();
    });
  });

  describe('ReasoningEffortSchema', () => {
    it('should accept valid reasoning efforts', () => {
      expect(ReasoningEffortSchema.parse('low')).toBe('low');
      expect(ReasoningEffortSchema.parse('medium')).toBe('medium');
      expect(ReasoningEffortSchema.parse('high')).toBe('high');
      expect(ReasoningEffortSchema.parse('xhigh')).toBe('xhigh');
    });

    it('should reject invalid reasoning efforts', () => {
      expect(() => ReasoningEffortSchema.parse('extreme')).toThrow();
    });
  });

  describe('ToolsConfigSchema', () => {
    it('should accept valid tools config', () => {
      const config = { tool1: true, tool2: false };
      expect(ToolsConfigSchema.parse(config)).toEqual(config);
    });

    it('should accept empty object', () => {
      expect(ToolsConfigSchema.parse({})).toEqual({});
    });

    it('should reject non-boolean values', () => {
      expect(() => ToolsConfigSchema.parse({ tool1: 'enabled' })).toThrow();
    });
  });

  describe('ProviderOptionsSchema', () => {
    it('should accept valid provider options', () => {
      const options = { apiKey: 'secret', baseUrl: 'https://api.example.com' };
      expect(ProviderOptionsSchema.parse(options)).toEqual(options);
    });

    it('should accept mixed value types', () => {
      const options = { timeout: 5000, retries: 3, enabled: true };
      expect(ProviderOptionsSchema.parse(options)).toEqual(options);
    });
  });

  describe('OMOBaseConfigSchema', () => {
    it('should accept valid base config', () => {
      const config = { model: 'gpt-4', variant: 'high' };
      expect(OMOBaseConfigSchema.parse(config)).toEqual(config);
    });

    it('should require model field', () => {
      expect(() => OMOBaseConfigSchema.parse({ variant: 'high' })).toThrow();
    });

    it('should require variant field', () => {
      expect(() => OMOBaseConfigSchema.parse({ model: 'gpt-4' })).toThrow();
    });
  });

  describe('OMOAgentConfigSchema', () => {
    it('should accept minimal valid config', () => {
      const config = { model: 'gpt-4', variant: 'medium' };
      expect(OMOAgentConfigSchema.parse(config)).toEqual(config);
    });

    it('should accept full config with all options', () => {
      const config = {
        model: 'gpt-4',
        variant: 'high',
        fallback_models: ['gpt-3.5', 'gpt-4-turbo'],
        category: 'test',
        skills: ['skill1', 'skill2'],
        temperature: 0.7,
        top_p: 0.9,
        prompt: 'You are a helpful assistant',
        prompt_append: 'Be concise',
        tools: { tool1: true },
        disable: false,
        description: 'Test agent',
        mode: 'subagent',
        color: '#FF5733',
        permission: { edit: 'allow' },
        maxTokens: 2000,
        thinking: { type: 'enabled', budgetTokens: 1000 },
        reasoningEffort: 'medium',
        textVerbosity: 'high',
        providerOptions: { apiKey: 'test' },
        ultrawork: { model: 'claude-3' },
        compaction: { model: 'claude-3-haiku' },
      };
      expect(OMOAgentConfigSchema.parse(config)).toEqual(config);
    });

    it('should reject invalid temperature', () => {
      expect(() => OMOAgentConfigSchema.parse({
        model: 'gpt-4',
        variant: 'medium',
        temperature: 3,
      })).toThrow();
    });

    it('should reject invalid top_p', () => {
      expect(() => OMOAgentConfigSchema.parse({
        model: 'gpt-4',
        variant: 'medium',
        top_p: 1.5,
      })).toThrow();
    });

    it('should reject invalid color format', () => {
      expect(() => OMOAgentConfigSchema.parse({
        model: 'gpt-4',
        variant: 'medium',
        color: 'red',
      })).toThrow();

      expect(() => OMOAgentConfigSchema.parse({
        model: 'gpt-4',
        variant: 'medium',
        color: '#FF573',
      })).toThrow();
    });

    it('should accept valid hex color', () => {
      const config = {
        model: 'gpt-4',
        variant: 'medium',
        color: '#FF5733',
      };
      expect(OMOAgentConfigSchema.parse(config)).toEqual(config);
    });

    it('should accept lowercase hex color', () => {
      const config = {
        model: 'gpt-4',
        variant: 'medium',
        color: '#ff5733',
      };
      expect(OMOAgentConfigSchema.parse(config)).toEqual(config);
    });
  });

  describe('OMOGlobalSettingsSchema', () => {
    it('should accept empty object', () => {
      expect(OMOGlobalSettingsSchema.parse({})).toEqual({});
    });

    it('should accept full settings', () => {
      const settings = {
        $schema: 'https://example.com/schema.json',
        new_task_system_enabled: true,
        sisyphus_agent: {
          disabled: false,
          default_builder_enabled: true,
          planner_enabled: true,
          replace_plan: false,
        },
        sisyphus: {
          tasks: {
            enabled: true,
            storage_path: '.sisyphus/tasks',
            claude_code_compat: false,
          },
        },
        background_task: {
          defaultConcurrency: 4,
          staleTimeoutMs: 180000,
        },
        default_run_agent: 'sisyphus',
        disabled_mcps: ['mcp1'],
        disabled_agents: ['agent1'],
        disabled_skills: ['skill1'],
        disabled_hooks: ['hook1'],
        disabled_commands: ['cmd1'],
        disabled_tools: ['tool1'],
        hashline_edit: true,
        model_fallback: false,
        browser_automation_engine: {
          provider: 'playwright',
        },
        notification: {
          force_enable: true,
        },
        git_master: {
          commit_footer: true,
          include_co_authored_by: true,
        },
        runtime_fallback: {
          enabled: true,
          max_fallback_attempts: 3,
          cooldown_seconds: 60,
          timeout_seconds: 30,
          notify_on_fallback: true,
        },
        experimental: {
          auto_resume: true,
          disable_omo_env: false,
          task_system: true,
        },
      };
      expect(OMOGlobalSettingsSchema.parse(settings)).toEqual(settings);
    });

    it('should accept partial settings', () => {
      expect(OMOGlobalSettingsSchema.parse({ hashline_edit: true })).toEqual({
        hashline_edit: true,
      });
    });

    it('should reject non-boolean values', () => {
      expect(() => OMOGlobalSettingsSchema.parse({ hashline_edit: 'true' })).toThrow();
    });
  });

  describe('AgentNameSchema', () => {
    it('should accept valid agent names', () => {
      DEFAULT_AGENTS.forEach(agent => {
        expect(AgentNameSchema.parse(agent)).toBe(agent);
      });
    });

    it('should reject invalid agent names', () => {
      expect(() => AgentNameSchema.parse('invalid-agent')).toThrow();
    });
  });

  describe('CategoryNameSchema', () => {
    it('should accept valid category names', () => {
      DEFAULT_CATEGORIES.forEach(category => {
        expect(CategoryNameSchema.parse(category)).toBe(category);
      });
    });

    it('should reject invalid category names', () => {
      expect(() => CategoryNameSchema.parse('invalid-category')).toThrow();
    });
  });

  describe('OMOConfigSchema', () => {
    it('should accept valid config with agents and categories', () => {
      const config = createMockOMOConfig();
      expect(OMOConfigSchema.parse(config)).toEqual(config);
    });

    it('should accept config with global settings', () => {
      const config = {
        $schema: 'https://example.com/schema.json',
        sisyphus_agent: {
          default_builder_enabled: true,
          replace_plan: false,
        },
        hashline_edit: true,
        ...createMockOMOConfig(),
      };
      expect(OMOConfigSchema.parse(config)).toEqual(config);
    });

    it('should require agents field', () => {
      expect(() => OMOConfigSchema.parse({
        categories: createMockOMOConfig().categories,
      })).toThrow();
    });

    it('should require categories field', () => {
      expect(() => OMOConfigSchema.parse({
        agents: createMockOMOConfig().agents,
      })).toThrow();
    });

    it('should reject invalid agent names in config', () => {
      expect(() => OMOConfigSchema.parse({
        agents: {
          'invalid-agent': createMockAgentConfig(),
          ...createMockOMOConfig().agents,
        },
        categories: createMockOMOConfig().categories,
      })).toThrow();
    });

    it('should reject invalid category names in config', () => {
      expect(() => OMOConfigSchema.parse({
        agents: createMockOMOConfig().agents,
        categories: {
          'invalid-category': createMockAgentConfig(),
          ...createMockOMOConfig().categories,
        },
      })).toThrow();
    });
  });

  describe('ProfileSchema', () => {
    it('should accept valid profile', () => {
      const profile = createMockProfile();
      expect(ProfileSchema.parse(profile)).toEqual(profile);
    });

    it('should require id field', () => {
      expect(() => ProfileSchema.parse({
        name: 'Test',
        config: createMockOMOConfig(),
        createdAt: 1,
        updatedAt: 1,
      })).toThrow();
    });

    it('should require name field', () => {
      expect(() => ProfileSchema.parse({
        id: 'test',
        config: createMockOMOConfig(),
        createdAt: 1,
        updatedAt: 1,
      })).toThrow();
    });

    it('should make description optional', () => {
      const profile = {
        id: 'profile-1',
        name: 'Test',
        config: createMockOMOConfig(),
        createdAt: 1,
        updatedAt: 1,
      };
      expect(ProfileSchema.parse(profile)).toEqual(profile);
    });
  });

  describe('validateOMOConfig', () => {
    it('should return valid config', () => {
      const config = createMockOMOConfig();
      expect(validateOMOConfig(config)).toEqual(config);
    });

    it('should throw on invalid config', () => {
      expect(() => validateOMOConfig({})).toThrow();
    });
  });

  describe('validateOMOConfigSafe', () => {
    it('should return success for valid config', () => {
      const config = createMockOMOConfig();
      const result = validateOMOConfigSafe(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(config);
      }
    });

    it('should return error for invalid config', () => {
      const result = validateOMOConfigSafe({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('validateProfile', () => {
    it('should return valid profile', () => {
      const profile = createMockProfile();
      expect(validateProfile(profile)).toEqual(profile);
    });

    it('should throw on invalid profile', () => {
      expect(() => validateProfile({})).toThrow();
    });
  });

  describe('validateProfileSafe', () => {
    it('should return success for valid profile', () => {
      const profile = createMockProfile();
      const result = validateProfileSafe(profile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(profile);
      }
    });

    it('should return error for invalid profile', () => {
      const result = validateProfileSafe({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('validateAgentConfig', () => {
    it('should return valid agent config', () => {
      const config = { model: 'gpt-4', variant: 'high' };
      expect(validateAgentConfig(config)).toEqual(config);
    });

    it('should throw on invalid config', () => {
      expect(() => validateAgentConfig({})).toThrow();
    });
  });

  describe('validateCategoryConfig', () => {
    it('should return valid category config', () => {
      const config = { model: 'gpt-4', variant: 'high' };
      expect(validateCategoryConfig(config)).toEqual(config);
    });

    it('should throw on invalid config', () => {
      expect(() => validateCategoryConfig({})).toThrow();
    });
  });

  describe('isValidVariant', () => {
    it('should return true for valid variants', () => {
      expect(isValidVariant('low')).toBe(true);
      expect(isValidVariant('medium')).toBe(true);
      expect(isValidVariant('high')).toBe(true);
      expect(isValidVariant('xhigh')).toBe(true);
    });

    it('should return false for invalid variants', () => {
      expect(isValidVariant('invalid')).toBe(false);
      expect(isValidVariant(123)).toBe(false);
      expect(isValidVariant(null)).toBe(false);
    });
  });

  describe('isValidPermissionLevel', () => {
    it('should return true for valid levels', () => {
      expect(isValidPermissionLevel('ask')).toBe(true);
      expect(isValidPermissionLevel('allow')).toBe(true);
      expect(isValidPermissionLevel('deny')).toBe(true);
    });

    it('should return false for invalid levels', () => {
      expect(isValidPermissionLevel('invalid')).toBe(false);
      expect(isValidPermissionLevel(123)).toBe(false);
    });
  });

  describe('isValidReasoningEffort', () => {
    it('should return true for valid efforts', () => {
      expect(isValidReasoningEffort('low')).toBe(true);
      expect(isValidReasoningEffort('medium')).toBe(true);
      expect(isValidReasoningEffort('high')).toBe(true);
      expect(isValidReasoningEffort('xhigh')).toBe(true);
    });

    it('should return false for invalid efforts', () => {
      expect(isValidReasoningEffort('extreme')).toBe(false);
    });
  });

  describe('isValidTextVerbosity', () => {
    it('should return true for valid verbosity levels', () => {
      expect(isValidTextVerbosity('low')).toBe(true);
      expect(isValidTextVerbosity('medium')).toBe(true);
      expect(isValidTextVerbosity('high')).toBe(true);
    });

    it('should return false for invalid verbosity levels', () => {
      expect(isValidTextVerbosity('verbose')).toBe(false);
    });
  });

  describe('isValidAgentMode', () => {
    it('should return true for valid modes', () => {
      expect(isValidAgentMode('subagent')).toBe(true);
      expect(isValidAgentMode('primary')).toBe(true);
      expect(isValidAgentMode('all')).toBe(true);
    });

    it('should return false for invalid modes', () => {
      expect(isValidAgentMode('invalid')).toBe(false);
    });
  });

  describe('isValidAgentName', () => {
    it('should return true for valid agent names', () => {
      expect(isValidAgentName('sisyphus')).toBe(true);
      expect(isValidAgentName('oracle')).toBe(true);
    });

    it('should return false for invalid agent names', () => {
      expect(isValidAgentName('invalid')).toBe(false);
    });
  });

  describe('isValidCategoryName', () => {
    it('should return true for valid category names', () => {
      expect(isValidCategoryName('quick')).toBe(true);
      expect(isValidCategoryName('deep')).toBe(true);
    });

    it('should return false for invalid category names', () => {
      expect(isValidCategoryName('invalid')).toBe(false);
    });
  });
});
