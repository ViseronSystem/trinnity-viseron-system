# Contributing to VISERON

## Development Setup

```bash
npm install
npm run build
npm start
```

## Core Principles

1. **Documented ≠ Executable**: Registry entries and specs are not proof of execution
2. **Registered ≠ Active**: Agents in the registry need execution evidence to be REAL
3. **Configured ≠ Proven**: API key presence does not guarantee provider functionality
4. **Simulated ≠ Real**: Mock data, templates, and formulas are not evidence

## Commit Conventions

- `feat(domain):` — new capability
- `fix(domain):` — bug fix
- `audit(domain):` — reality validation
- `test(domain):` — test addition
- `docs:` — documentation
- `bench:` — benchmark

## Testing

```bash
npm run test:core    # Core tests (20/20 required)
```

New capabilities must include:
1. Real execution evidence (not mock)
2. Telemetry traces
3. Agent evidence entries where applicable
4. Reality Gate classification (REAL/PARTIAL/BLOCKED)

## Agent Development

- Agents require systemPrompt + capabilities + execution evidence
- Performance measured by success rate, verification rate, latency
- Learning feedback integrated via ContinuousLearning

## No Fake Benchmarks

All performance claims must be backed by reproducible measurements with real data.
