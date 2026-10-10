// Node-only, suite-local reuse of deterministic historical fixture results.
// Every consumer still runs its own assertions against the unchanged baselines.
export function createHistoricalFixtureMemo(generate) {
  const results = new WeakMap();
  let generations = 0;
  let hits = 0;

  return {
    run(fixture) {
      // Identity alone is insufficient if a test changes a seed or nested lock.
      const fingerprint = JSON.stringify(fixture);
      const cached = results.get(fixture);
      if (cached?.fingerprint === fingerprint) {
        hits += 1;
        return structuredClone(cached.result);
      }

      const result = structuredClone(generate(fixture));
      results.set(fixture, { fingerprint, result });
      generations += 1;
      // Callers cannot mutate the shared copy or another matrix's later result.
      return structuredClone(result);
    },
    statistics: () => ({ generations, hits }),
  };
}
