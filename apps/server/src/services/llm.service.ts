import { buildPrompt, buildSuggestChildrenPrompt, buildInsightPrompt } from '../utils/prompt';
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

export async function suggestChildren(label: string) {
  const prompt = buildSuggestChildrenPrompt(label);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an assistant that suggests subtopics for mind map nodes.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 512,
  });
  const content = response.choices[0].message?.content || '';
  // Try to extract JSON from code block if present
  const match = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const json = match ? match[1] : content;
  return JSON.parse(json);
}

export async function getMapInsight(nodes: any[], edges: any[], summaries?: any[]) {
  const prompt = buildInsightPrompt(nodes, edges, summaries);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert mind map analyst.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 512,
  });
  const content = response.choices[0].message?.content || '';
  // Try to extract JSON from code block if present
  const match = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const json = match ? match[1] : content;
  return JSON.parse(json);
} 