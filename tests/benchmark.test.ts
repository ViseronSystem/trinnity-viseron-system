import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { AutonomyBenchmark } from "../src/omega/benchmark";

async function main(): Promise<void> {
  const filePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tvs-bench-")), "runs.json");
  const benchmark = new AutonomyBenchmark({ filePath, idFactory: () => "bench_test", now: (() => {
    let time = 1000;
    return () => ++time;
  })() });
  benchmark.register({
    id: "verified",
    domain: "engineering",
    description: "verified task",
    execute: async () => ({ success: true, cost: 0.25 }),
    verify: (result) => result.success,
  });
  benchmark.register({
    id: "rejected",
    domain: "operations",
    description: "failed task",
    execute: async () => ({ success: false, recovered: true, error: "provider unavailable" }),
  });
  const run = await benchmark.run();
  if (run.metrics.total !== 2 || run.metrics.verified !== 1) throw new Error("benchmark metrics incorrect");
  if (run.metrics.recoveryRate !== 0.5 || run.metrics.errorRate !== 0.5) throw new Error("benchmark rates incorrect");
  if (!fs.existsSync(filePath)) throw new Error("benchmark run was not persisted");
  console.log("BENCHMARK: 4/4 passed");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
