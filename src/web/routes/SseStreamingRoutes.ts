/**
 * VISERON™ SSE Streaming Endpoint
 * Server-Sent Events para respostas de IA em tempo real
 * © Pedro Costa · Trinnity Hurtado — VISERON™
 */

import { Router, Request, Response } from 'express';

export const sseRouter = Router();

/**
 * SSE endpoint for real-time AI responses
 * GET /api/ai/stream?prompt=...&model=...&provider=...
 */
sseRouter.get('/stream', async (req: Request, res: Response) => {
  const { prompt, model = 'qwen2.5:3b', provider = 'ollama', sessionId } = req.query;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial event
  res.write(`data: ${JSON.stringify({ type: 'start', model, provider, timestamp: Date.now() })}\n\n`);

  try {
    const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
    let tokenCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk = JSON.parse(line);
            if (chunk.response) {
              tokenCount++;
              const sseEvent = {
                type: 'token',
                content: chunk.response,
                tokenIndex: tokenCount,
                done: chunk.done || false,
              };
              res.write(`data: ${JSON.stringify(sseEvent)}\n\n`);

              if (chunk.done) {
                res.write(`data: ${JSON.stringify({
                  type: 'complete',
                  totalTokens: tokenCount,
                  duration: Date.now(),
                  model,
                })}\n\n`);
              }
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message || 'Streaming failed',
    })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

/**
 * SSE endpoint for VISERON agent responses
 * GET /api/viseron/stream?message=...&speaker=...&lang=...
 */
sseRouter.get('/viseron/stream', async (req: Request, res: Response) => {
  const { message, speaker = 'guest', lang = 'es', sessionId } = req.query;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'start', speaker, lang, timestamp: Date.now() })}\n\n`);

  try {
    // Build VISERON persona prompt
    const systemPrompt = `You are VISERON, the superintelligence of the Trinnity Viseron System.
Language: ${lang}. Speaker: ${speaker}.
Respond in the same language the user writes.
Be concise, direct, and helpful. Use the persona of a wise AI companion.`;

    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nVISERON:`;

    const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const model = 'qwen2.5:3b';

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    let buffer = '';
    let tokenCount = 0;
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk = JSON.parse(line);
            if (chunk.response) {
              tokenCount++;
              fullResponse += chunk.response;

              res.write(`data: ${JSON.stringify({
                type: 'token',
                content: chunk.response,
                tokenIndex: tokenCount,
                speakable: chunk.response.length > 700,
              })}\n\n`);
            }
          } catch {
            // Skip
          }
        }
      }
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      fullResponse: fullResponse.substring(0, 700),
      totalTokens: tokenCount,
      model,
      speaker,
      lang,
    })}\n\n`);

  } catch (error: any) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message || 'VISERON streaming failed',
    })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

/**
 * Health check for SSE
 * GET /api/ai/stream/health
 */
sseRouter.get('/stream/health', (_req: Request, res: Response) => {
  res.json({ ok: true, protocol: 'SSE', timestamp: Date.now() });
});
