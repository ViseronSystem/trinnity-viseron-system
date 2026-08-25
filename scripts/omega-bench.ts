import { createBaselineBenchmark } from "../src/omega/benchmark";

async function main(): Promise<void> {
  const benchmark = createBaselineBenchmark({ filePath: "data/benchmarks/autonomy.json" });
  const run = await benchmark.run();
  console.log(JSON.stringify({ id: run.id, metrics: run.metrics, tasks: run.tasks }, null, 2));
  if (run.metrics.verifiedCompletionRate < 1) process.exitCode = 1;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
