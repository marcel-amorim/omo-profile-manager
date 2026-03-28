import { describe, expect, it } from 'vitest';
import {
  createDefaultSharedSettings,
  extractSharedSettings,
  mergeSharedSettingsIntoConfig,
  stripSharedSettingsFromConfig,
} from './config-scope';
import { createDefaultOMOConfig } from './types';

describe('config-scope', () => {
  it('creates default shared settings with normalized defaults', () => {
    const settings = createDefaultSharedSettings();

    expect(settings.sisyphus_agent?.default_builder_enabled).toBe(true);
    expect(settings.sisyphus_agent?.planner_enabled).toBe(true);
    expect(settings.browser_automation_engine?.provider).toBe('playwright');
    expect(settings.runtime_fallback?.max_fallback_attempts).toBe(3);
  });

  it('extracts and normalizes shared settings from a config object', () => {
    const settings = extractSharedSettings({
      hashline_edit: false,
      sisyphus_agent: {
        replace_plan: true,
        default_builder_enabled: false,
      },
    });

    expect(settings.hashline_edit).toBe(false);
    expect(settings.sisyphus_agent?.disabled).toBe(false);
    expect(settings.sisyphus_agent?.planner_enabled).toBe(true);
    expect(settings.sisyphus_agent?.replace_plan).toBe(true);
  });

  it('strips shared settings from profile config payloads', () => {
    const config = createDefaultOMOConfig();
    const strippedConfig = stripSharedSettingsFromConfig({
      ...config,
      hashline_edit: false,
      runtime_fallback: { enabled: false },
    });

    expect(strippedConfig.hashline_edit).toBeUndefined();
    expect(strippedConfig.runtime_fallback).toBeUndefined();
    expect(strippedConfig.agents).toEqual(config.agents);
    expect(strippedConfig.categories).toEqual(config.categories);
  });

  it('merges shared settings over a profile config when applying', () => {
    const config = createDefaultOMOConfig();
    const mergedConfig = mergeSharedSettingsIntoConfig(config, {
      hashline_edit: false,
      browser_automation_engine: { provider: 'agent-browser' },
      sisyphus_agent: {
        disabled: true,
        default_builder_enabled: false,
        planner_enabled: false,
        replace_plan: true,
      },
    });

    expect(mergedConfig.hashline_edit).toBe(false);
    expect(mergedConfig.browser_automation_engine?.provider).toBe('agent-browser');
    expect(mergedConfig.sisyphus_agent?.disabled).toBe(true);
    expect(mergedConfig.agents).toEqual(config.agents);
  });
});
