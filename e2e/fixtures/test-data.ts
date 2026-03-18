export const testProfile = {
  id: 'test-profile-1',
  name: 'Test Profile',
  description: 'For E2E testing',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  config: {
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
  }
};

export const testProfile2 = {
  id: 'test-profile-2',
  name: 'Second Test Profile',
  description: 'Another profile for testing',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  config: {
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
  }
};
