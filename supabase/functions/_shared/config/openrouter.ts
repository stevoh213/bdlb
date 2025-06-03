export const OPENROUTER_CONFIG = {
  baseURL: 'https://openrouter.ai/api/v1',
  defaultModel: 'microsoft/phi-4-reasoning-plus:free',
  defaultApiKey: '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',
  availableModels: [
    { id: 'microsoft/phi-4-reasoning-plus:free', name: 'Microsoft Phi-4 Reasoning Plus', description: 'Free reasoning model' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4O Mini', description: 'Fast and affordable' },
    { id: 'openai/gpt-4o', name: 'GPT-4O', description: 'More powerful analysis' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Anthropic\'s fast model' },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Anthropic\'s balanced model' }
  ]
};
