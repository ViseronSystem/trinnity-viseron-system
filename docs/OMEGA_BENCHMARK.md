# OMEGA Autonomous Organization Benchmark

The benchmark measures operational autonomy. It does not claim AGI.

## Run

```bash
npm run omega:bench
```

Results are written to `data/benchmarks/autonomy.json`, which is runtime data
and is intentionally ignored by Git.

## Metrics

- `successRate`: tasks whose executor reported success.
- `verifiedCompletionRate`: successful tasks that also passed their verifier.
- `interventionRate`: tasks that required a human decision.
- `recoveryRate`: tasks that recovered after a failure.
- `errorRate`: tasks that failed execution.
- `averageLatencyMs`: mean task latency.
- `totalCost`: reported execution cost.

The baseline suite checks planning decomposition, memory persistence/retrieval,
and rejection of a false success. These are capability checks, not evidence of
general intelligence. Production adapters must register real tasks and real
verifiers before benchmark results can be used for customer or AGI claims.
