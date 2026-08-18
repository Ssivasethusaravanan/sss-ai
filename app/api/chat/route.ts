import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, apiKey } = await req.json();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No API key provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Initialize the OpenAI client pointing to NVIDIA NIM with user-provided key
  const nvidia = createOpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: apiKey,
  });

  const result = await streamText({
    model: nvidia('meta/llama-3.1-70b-instruct'),
    messages,
  });

  return result.toTextStreamResponse();
}
