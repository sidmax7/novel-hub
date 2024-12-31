export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4", // or "gpt-3.5-turbo" depending on your needs
  maxTokens: 150,
  temperature: 0.7,
};

export const redisConfig = {
  url: process.env.KV_URL,
  restApiUrl: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
  readOnlyToken: process.env.KV_REST_API_READ_ONLY_TOKEN,
};
