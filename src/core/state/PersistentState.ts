// PersistentState — a "superinteligência que nunca esquece".
// Guarda o estado dos motores autónomos em disco ANTES de qualquer restart/crash
// e restaura-o no boot: ciclos, níveis, tarefas pendentes, autonomia.
// Nunca bloqueia o ciclo: qualquer falha de I/O é silenciosa (log só).
import * as fs from "fs-extra";
import * as path from "path";

const STATE_DIR = path.join(process.cwd(), "data", "state");

export function getStateDir(): string {
  fs.ensureDirSync(STATE_DIR);
  return STATE_DIR;
}

export function loadPersistentState<T>(key: string, fallback: T): T {
  try {
    const file = path.join(getStateDir(), `${key}.json`);
    if (!fs.existsSync(file)) return fallback;
    const data = fs.readJsonSync(file);
    return (data && typeof data === "object" ? { ...fallback, ...data } : fallback) as T;
  } catch (err) {
    console.warn(`[PersistentState] load ${key} falhou: ${(err as any)?.message || err}`);
    return fallback;
  }
}

export function savePersistentState<T>(key: string, data: T): void {
  try {
    const file = path.join(getStateDir(), `${key}.json`);
    fs.ensureDirSync(path.dirname(file));
    const tmp = `${file}.tmp`;
    fs.writeJsonSync(tmp, data, { spaces: 2 });
    fs.renameSync(tmp, file);
  } catch (err) {
    console.warn(`[PersistentState] save ${key} falhou: ${(err as any)?.message || err}`);
  }
}

export interface EngineState {
  cycleCount: number;
  [k: string]: unknown;
}
