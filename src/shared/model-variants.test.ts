import { describe, expect, it } from 'vitest';

import type { ModelInfo } from './ipc';
import { getModelVariantDisplayLabel, getModelVariantOptions } from './model-variants';

describe('model-variants', () => {
  const anthropicModelInfo: ModelInfo = {
    id: 'anthropic/claude-opus-4-6',
    providerID: 'anthropic',
    name: 'Claude Opus 4.6',
    variants: {
      low: {},
      medium: {},
      high: {},
      max: {},
    },
  };

  const openAiModelInfo: ModelInfo = {
    id: 'openai/gpt-5.4',
    providerID: 'openai',
    name: 'GPT-5.4',
    variants: {
      low: {},
      medium: {},
      high: {},
      xhigh: {},
    },
  };

  it('maps max model variants onto the canonical xhigh config value', () => {
    expect(getModelVariantOptions(anthropicModelInfo)).toEqual([
      { value: 'low', label: 'low' },
      { value: 'medium', label: 'medium' },
      { value: 'high', label: 'high' },
      { value: 'xhigh', label: 'max' },
    ]);
  });

  it('keeps xhigh labels for models that expose xhigh directly', () => {
    expect(getModelVariantOptions(openAiModelInfo)).toEqual([
      { value: 'low', label: 'low' },
      { value: 'medium', label: 'medium' },
      { value: 'high', label: 'high' },
      { value: 'xhigh', label: 'xhigh' },
    ]);
  });

  it('uses the model-specific label for the current canonical variant', () => {
    expect(getModelVariantDisplayLabel('xhigh', anthropicModelInfo)).toBe('max');
    expect(getModelVariantDisplayLabel('xhigh', openAiModelInfo)).toBe('xhigh');
  });
});
