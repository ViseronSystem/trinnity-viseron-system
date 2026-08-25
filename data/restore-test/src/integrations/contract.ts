export interface IntegrationBridge {
  readonly name: string;
  initialize(): Promise<number>;
  stop?(): void | Promise<void>;
  status?(): Record<string, unknown>;
}

export interface BridgeInitResult {
  bridge: string;
  status: "ok" | "error";
  count?: number;
  error?: string;
}

export async function initBridge(bridge: IntegrationBridge): Promise<BridgeInitResult> {
  try {
    const count = await bridge.initialize();
    return { bridge: bridge.name, status: "ok", count };
  } catch (err: any) {
    return { bridge: bridge.name, status: "error", error: err.message };
  }
}

export async function shutdownBridge(bridge: IntegrationBridge | undefined | null): Promise<void> {
  if (!bridge) return;
  try {
    await bridge.stop?.();
  } catch { /* shutdown nunca pode quebrar o sistema */ }
}
