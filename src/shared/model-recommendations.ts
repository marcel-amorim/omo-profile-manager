import { AgentName, CategoryName } from './constants';

export const AGENT_MODEL_RECOMMENDATIONS: Record<AgentName, string[]> = {
  sisyphus: [
    'kimi-for-coding/k2p5',
    'anthropic/claude-opus-4-6',
    'anthropic/claude-sonnet-4-6',
    'anthropic/claude-haiku-4-5',
    'opencode-go/kimi-k2.5',
    'opencode-go/glm-5',
    'google/gemini-3.1-pro',
  ],
  hephaestus: [
    'openai/gpt-5.3-codex',
    'openai/gpt-5.4',
  ],
  oracle: [
    'openai/gpt-5.4',
    'google/gemini-3.1-pro',
    'anthropic/claude-opus-4-6',
    'opencode-go/glm-5',
  ],
  momus: [
    'openai/gpt-5.4',
    'anthropic/claude-opus-4-6',
    'google/gemini-3.1-pro',
    'opencode-go/glm-5',
  ],
  explore: [
    'github-copilot/grok-code-fast-1',
    'opencode-go/minimax-m2.7',
    'anthropic/claude-haiku-4-5',
    'openai/gpt-5-nano',
  ],
  librarian: [
    'opencode-go/minimax-m2.7',
    'anthropic/claude-haiku-4-5',
    'openai/gpt-5-nano',
  ],
  prometheus: [
    'anthropic/claude-opus-4-6',
    'openai/gpt-5.4',
    'opencode-go/glm-5',
    'google/gemini-3.1-pro',
  ],
  atlas: [
    'anthropic/claude-sonnet-4-6',
    'opencode-go/kimi-k2.5',
    'openai/gpt-5.4',
  ],
  metis: [
    'anthropic/claude-opus-4-6',
    'openai/gpt-5.4',
    'opencode-go/glm-5',
  ],
  'multimodal-looker': [
    'openai/gpt-5.4',
    'opencode-go/kimi-k2.5',
    'openai/gpt-5-nano',
  ],
};

export const CATEGORY_MODEL_RECOMMENDATIONS: Record<CategoryName, string[]> = {
  'visual-engineering': [
    'google/gemini-3.1-pro',
    'opencode-go/glm-5',
    'anthropic/claude-opus-4-6',
  ],
  ultrabrain: [
    'openai/gpt-5.4',
    'google/gemini-3.1-pro',
    'anthropic/claude-opus-4-6',
    'opencode-go/glm-5',
  ],
  deep: [
    'openai/gpt-5.3-codex',
    'anthropic/claude-opus-4-6',
    'google/gemini-3.1-pro',
  ],
  artistry: [
    'google/gemini-3.1-pro',
    'anthropic/claude-opus-4-6',
    'openai/gpt-5.4',
  ],
  quick: [
    'openai/gpt-5.4-mini',
    'anthropic/claude-haiku-4-5',
    'google/gemini-3-flash',
    'opencode-go/minimax-m2.7',
    'openai/gpt-5-nano',
  ],
  'unspecified-high': [
    'anthropic/claude-opus-4-6',
    'openai/gpt-5.4',
    'opencode-go/glm-5',
    'opencode-go/kimi-k2.5',
  ],
  'unspecified-low': [
    'anthropic/claude-sonnet-4-6',
    'openai/gpt-5.3-codex',
    'opencode-go/kimi-k2.5',
    'google/gemini-3-flash',
  ],
  writing: [
    'google/gemini-3-flash',
    'opencode-go/kimi-k2.5',
    'anthropic/claude-sonnet-4-6',
  ],
};
