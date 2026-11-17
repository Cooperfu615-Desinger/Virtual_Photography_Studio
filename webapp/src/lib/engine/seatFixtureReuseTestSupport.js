// Test-only opt-in reuse. The ordinary fixture path and restore tests stay fresh.
import { serialize, deserialize } from 'node:v8';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
let active = null;
export const seatRequestKey = (location, action, framing, overrides = {}) => serialize([location, action, framing, overrides]).toString('base64');
export function createPlannedFixtureReuse(plan, onProgress = () => {}) {
  const remaining = new Map(plan), cached = new Map();
  let generations = 0, hits = 0, bytes = 0, peakBytes = 0;
  const statistics = () => ({ generations, hits, retainedEntries: cached.size, retainedBytes: bytes, peakBytes });
  const report = () => { if ((generations + hits) % 500 === 0) onProgress(statistics()); };
  return {
    run(key, generate) {
      const uses = remaining.get(key) || 0;
      if (cached.has(key)) {
        const compressed = cached.get(key);
        const result = deserialize(inflateRawSync(compressed));
        hits++;
        if (uses <= 1) { cached.delete(key); bytes -= compressed.length; remaining.delete(key); }
        else remaining.set(key, uses - 1);
        report();
        return result;
      }
      const result = generate(); // A failed generation never advances the plan.
      generations++;
      if (uses > 1) {
        const compressed = deflateRawSync(serialize(result), { level: 1 });
        cached.set(key, compressed); bytes += compressed.length; peakBytes = Math.max(bytes, peakBytes);
        remaining.set(key, uses - 1);
      } else remaining.delete(key);
      report();
      return result;
    },
    statistics,
    clear: () => { remaining.clear(); cached.clear(); bytes = 0; },
  };
}
export function enableSeatFixtureReuse(plan, onProgress) {
  if (active) throw new Error('Seat fixture reuse already active');
  const cache = createPlannedFixtureReuse(plan, onProgress); active = cache;
  return { statistics: cache.statistics, stop() { if (active === cache) active = null; cache.clear(); } };
}
export function withSeatFixtureReuse(location, action, framing, overrides, generate) {
  return active ? active.run(seatRequestKey(location, action, framing, overrides), generate) : generate();
}
