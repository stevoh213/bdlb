
export const OPENROUTER_CONFIG = {
  baseURL: 'https://openrouter.ai/api/v1',
  defaultModel: 'openai/gpt-4o-mini', // Fast and affordable model for analysis
  availableModels: [
    { id: 'openai/gpt-4o-mini', name: 'GPT-4O Mini', description: 'Fast and affordable' },
    { id: 'openai/gpt-4o', name: 'GPT-4O', description: 'More powerful analysis' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Anthropic\'s fast model' },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Anthropic\'s balanced model' }
  ]
};
