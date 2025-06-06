const envApiKey =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_OPENROUTER_API_KEY) ||
  process.env.VITE_OPENROUTER_API_KEY;

export const OPENROUTER_CONFIG = {
  baseURL: "https://openrouter.ai/api/v1",
  defaultModel: "microsoft/phi-4-reasoning-plus:free",
  defaultApiKey: envApiKey,
  availableModels: [
    {
      id: "microsoft/phi-4-reasoning-plus:free",
      name: "Microsoft Phi-4 Reasoning Plus",
      description: "Free reasoning model",
    },
    {
      id: "openai/gpt-4o-mini",
      name: "GPT-4O Mini",
      description: "Fast and affordable",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4O",
      description: "More powerful analysis",
    },
    {
      id: "anthropic/claude-3-haiku",
      name: "Claude 3 Haiku",
      description: "Anthropic's fast model",
    },
    {
      id: "anthropic/claude-3-sonnet",
      name: "Claude 3 Sonnet",
      description: "Anthropic's balanced model",
    },
  ],
};
