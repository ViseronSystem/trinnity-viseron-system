import { EventBus, EventBusRecord, KernelEventMeta, topicMatches } from "./EventBus";

export interface EventEmitterBridgeOptions {
  prefix?: string;
  map?: Record<string, string>;
  source?: string;
}

export interface SocketIOBridgeOptions {
  topics?: string[];
  eventName?: string;
  source?: string;
  transform?: (record: EventBusRecord) => any;
}

export interface SSEStreamOptions {
  topics?: string[];
  heartbeatMs?: number;
}

const MEMORY_ENGINE_EVENTS = [
  "memory:event",
  "stm:added",
  "stm:evicted",
  "stm:cleared",
  "ltm:set",
  "ltm:evicted",
  "ltm:deleted",
  "kb:added",
  "vector:stored",
  "consolidation:run",
];

/**
 * Consolida módulos Node EventEmitter (ex. MemoryEngine) no kernel bus:
 * cada evento do emitter é republicado como tópico no EventBus.
 * Devolve o unsubscribe.
 */
export function bridgeEventEmitter(emitter: NodeJS.EventEmitter, bus: EventBus, options: EventEmitterBridgeOptions = {}): () => void {
  const events = options.map ? Object.keys(options.map) : MEMORY_ENGINE_EVENTS;
  const handlers: Array<{ event: string; handler: (payload: any) => void }> = [];
  for (const event of events) {
    const topic = options.map?.[event] ?? (options.prefix ? `${options.prefix}.${event}` : event);
    const handler = (payload: any) => {
      void bus.publish(topic, payload, options.source ?? "memory-engine");
    };
    emitter.on(event, handler);
    handlers.push({ event, handler });
  }
  return () => {
    for (const h of handlers) emitter.off(h.event, h.handler);
  };
}

/**
 * Reatividade entre módulos e dashboard: encaminha o kernel bus para o
 * Socket.IO (`io.emit(eventName, {topic, source, ts, payload})`).
 * Devolve o unsubscribe.
 */
export function bridgeSocketIO(io: any, bus: EventBus, options: SocketIOBridgeOptions = {}): () => void {
  const eventName = options.eventName ?? "omega:event";
  const patterns = options.topics && options.topics.length > 0 ? options.topics : ["*"];
  const pattern = patterns.length === 1 ? patterns[0] : "*";
  const unsubscribe = bus.subscribe(pattern, (payload, meta) => {
    if (patterns.length > 1 && !patterns.some((p) => topicMatches(p, meta.topic))) return;
    const record: EventBusRecord = { topic: meta.topic, payload, source: meta.source, meta };
    const data = options.transform ? options.transform(record) : { topic: meta.topic, source: meta.source, ts: meta.timestamp, payload };
    try {
      io.emit(eventName, data);
    } catch {
      /* cliente indisponível — próximo evento tentará de novo */
    }
  });
  return unsubscribe;
}

/**
 * Stream Server-Sent Events: expõe o kernel bus a clientes REST (dashboard,
 * mobile) sem depender de Socket.IO. `res` é o objeto de resposta Express.
 * Devolve o unsubscribe.
 */
export function openSSEStream(res: any, bus: EventBus, options: SSEStreamOptions = {}): () => void {
  const patterns = options.topics && options.topics.length > 0 ? options.topics : ["*"];
  const pattern = patterns.length === 1 ? patterns[0] : "*";
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n\n");
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      /* cliente fechou — o close abaixo limpa o timer */
    }
  }, options.heartbeatMs ?? 30000);
  const unsubscribe = bus.subscribe(pattern, (payload, meta) => {
    if (patterns.length > 1 && !patterns.some((p) => topicMatches(p, meta.topic))) return;
    try {
      res.write(`event: ${meta.topic}\n`);
      res.write(`data: ${JSON.stringify({ topic: meta.topic, source: meta.source, ts: meta.timestamp, payload })}\n\n`);
    } catch {
      /* stream fechado */
    }
  });
  res.on("close", () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
  return unsubscribe;
}
