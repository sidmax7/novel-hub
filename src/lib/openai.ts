import OpenAI from 'openai';
import { openAIConfig } from './config';

if (!openAIConfig.apiKey) {
  throw new Error('OpenAI API key is not configured');
}

export const openai = new OpenAI({
  apiKey: openAIConfig.apiKey,
});

export async function getChatCompletion(prompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: openAIConfig.model,
      max_tokens: openAIConfig.maxTokens,
      temperature: openAIConfig.temperature,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    throw error;
  }
}
