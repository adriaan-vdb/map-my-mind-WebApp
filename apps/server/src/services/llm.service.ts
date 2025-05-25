import { buildPrompt } from '../utils/prompt';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getMindMapFromText(text: string) {
  const prompt = buildPrompt(text);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an assistant that transforms user notes into a coherent mind map.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });
  const content = response.choices[0].message?.content || '';
  // Try to extract JSON from code block if present
  const match = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const json = match ? match[1] : content;
  return JSON.parse(json);
} 