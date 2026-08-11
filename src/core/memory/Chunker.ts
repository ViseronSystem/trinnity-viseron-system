// VISERON RAG Pipeline — Sistema 2 Cognitive Operating Layer
// Chunker: sliding window text splitting with overlap
// 2026-08-11

export interface TextChunk {
  id: string;
  text: string;
  index: number;
  source?: string;
  metadata?: Record<string, any>;
}

export function chunkText(
  text: string,
  options: { chunkSize?: number; overlap?: number; source?: string; metadata?: Record<string, any> } = {}
): TextChunk[] {
  const chunkSize = options.chunkSize || 512;
  const overlap = options.overlap || 128;
  const words = text.split(/\s+/);
  const chunks: TextChunk[] = [];

  if (words.length <= chunkSize) {
    return [{
      id: `chunk_0_${words.length}`,
      text,
      index: 0,
      source: options.source,
      metadata: options.metadata,
    }];
  }

  let i = 0;
  while (i < words.length) {
    const end = Math.min(i + chunkSize, words.length);
    const chunkText = words.slice(i, end).join(" ");
    chunks.push({
      id: `chunk_${i}_${end}`,
      text: chunkText,
      index: chunks.length,
      source: options.source,
      metadata: options.metadata,
    });
    i += chunkSize - overlap;
    if (i >= words.length) break;
    if (end === words.length) break;
  }

  return chunks;
}
