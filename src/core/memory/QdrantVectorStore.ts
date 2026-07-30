import axios from "axios";
import { VectorEmbedding } from "../types";

export interface QdrantConfig {
  host: string;
  collectionName: string;
  vectorSize: number;
}

/**
 * QdrantVectorStore - Adaptador de Producción para Base de Datos Vectorial Qdrant
 */
export class QdrantVectorStore {
  private host: string;
  private collectionName: string;
  private vectorSize: number;
  private fallbackStore: Map<string, VectorEmbedding> = new Map();
  private static warnedOnce = false;

  constructor(config?: Partial<QdrantConfig>) {
    this.host = config?.host || process.env.QDRANT_HOST || "http://localhost:6333";
    this.collectionName = config?.collectionName || "tvs_hyper_memory";
    this.vectorSize = config?.vectorSize || 1536; // Estándar OpenAI / Qdrant
    this.initCollection();
  }

  private async initCollection(): Promise<void> {
    try {
      await axios.put(`${this.host}/collections/${this.collectionName}`, {
        vectors: {
          size: this.vectorSize,
          distance: "Cosine"
        }
      });
      console.log(`[QdrantVectorStore] Colección '${this.collectionName}' inicializada en Qdrant.`);
    } catch (err: any) {
      if (!QdrantVectorStore.warnedOnce) {
        QdrantVectorStore.warnedOnce = true;
        console.warn(`[QdrantVectorStore] Qdrant no alcanzable en '${this.host}' (Usando almacenamiento vectorial en memoria con fallback).`);
      }
    }
  }

  /**
   * Almacena o actualiza un vector embedding en Qdrant con payload asociativo.
   */
  public async upsertVector(id: string, vector: number[], payload: Record<string, any>): Promise<boolean> {
    // Rellenar vector al tamaño si es menor para asegurar dimensiones validas
    const paddedVector = this.padVector(vector, this.vectorSize);

    try {
      await axios.put(`${this.host}/collections/${this.collectionName}/points`, {
        points: [
          {
            id: this.uuidFromSeed(id),
            vector: paddedVector,
            payload: { originalId: id, ...payload }
          }
        ]
      });
      return true;
    } catch (err) {
      // Fallback local
      this.fallbackStore.set(id, { id, vector: paddedVector, payload });
      return true;
    }
  }

  /**
   * Realiza una búsqueda por similitud vectorial (Cosine Similarity) en Qdrant.
   */
  public async searchSimilar(queryVector: number[], topK: number = 5): Promise<VectorEmbedding[]> {
    const paddedVector = this.padVector(queryVector, this.vectorSize);

    try {
      const response = await axios.post(`${this.host}/collections/${this.collectionName}/points/search`, {
        vector: paddedVector,
        limit: topK,
        with_payload: true
      });

      return response.data.result.map((item: any) => ({
        id: item.payload?.originalId || item.id,
        vector: item.vector || [],
        payload: item.payload || {}
      }));
    } catch (err) {
      // Fallback local con Cosine Similarity manual
      const calculateCosineSim = (v1: number[], v2: number[]) => {
        let dot = 0, norm1 = 0, norm2 = 0;
        for (let i = 0; i < v1.length; i++) {
          dot += v1[i] * (v2[i] || 0);
          norm1 += v1[i] * v1[i];
          norm2 += (v2[i] || 0) * (v2[i] || 0);
        }
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1);
      };

      const scored = Array.from(this.fallbackStore.values()).map(item => ({
        item,
        score: calculateCosineSim(paddedVector, item.vector)
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK).map(s => s.item);
    }
  }

  private padVector(v: number[], targetLen: number): number[] {
    if (v.length >= targetLen) return v.slice(0, targetLen);
    const padded = new Array(targetLen).fill(0);
    for (let i = 0; i < v.length; i++) padded[i] = v[i];
    return padded;
  }

  private uuidFromSeed(seed: string): string {
    // Generar un ID numérico simple en formato UUID
    const cleanStr = seed.replace(/[^a-zA-Z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < cleanStr.length; i++) {
      hash = (hash << 5) - hash + cleanStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash).toString(16).padStart(32, '0');
    return `${absHash.slice(0, 8)}-${absHash.slice(8, 12)}-4${absHash.slice(13, 16)}-8${absHash.slice(17, 20)}-${absHash.slice(20, 32)}`;
  }
}
