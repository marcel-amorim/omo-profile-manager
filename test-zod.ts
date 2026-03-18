import { ProfileSchema } from './src/shared/schemas';
import { OMOConfig } from './src/shared/types';

const DEFAULT_CONFIG: OMOConfig = {
  agents: {
    sisyphus: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'high' },
    oracle: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'high' },
    librarian: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
    explore: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
    'multimodal-looker': { model: 'openai/gpt-4o', variant: 'medium' },
    prometheus: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'high' },
    metis: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
    momus: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
    atlas: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
    hephaestus: { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
  },
  categories: {
    'visual-engineering': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'high' },
    'ultrabrain': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'high' },
    'deep': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'high' },
    'artistry': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
    'quick': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'low' },
    'unspecified-low': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'low' },
    'unspecified-high': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'high' },
    'writing': { model: 'anthropic/claude-3-5-sonnet-20241022', variant: 'medium' },
  }
};

const profile = {
  id: Date.now().toString(),
  name: 'Default Profile',
  description: 'Recommended OMO configuration',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  config: DEFAULT_CONFIG
};

const result = ProfileSchema.safeParse(profile);
if (!result.success) {
  console.log(JSON.stringify(result.error.issues, null, 2));
} else {
  console.log("Success!");
}
