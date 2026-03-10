// ============================================================
// FINMATRIX - Dummy API Configuration
// ============================================================
// Toggle these flags to test loading states and error handling.
// In production, remove this file and use real API calls.
//
// Usage: import { dummyDelay } from '../utils/dummyApiConfig';
//        await dummyDelay();          // uses default latency
//        await dummyDelay(600);       // uses custom latency (clamped by config)

export const dummyApiConfig = {
  /** When true, API calls are delayed by `latencyMs`. When false, they resolve instantly. */
  simulateLatency: true,

  /** Base latency in milliseconds applied to every dummy API call. */
  latencyMs: 300,

  /** When true, a random subset of calls will reject (for testing error banners). */
  simulateErrors: false,

  /** Probability (0–1) that a call throws when `simulateErrors` is true. */
  errorRate: 0.1,
};

/**
 * Centralised delay used by every network file.
 * Pass an optional `requestMs` to scale relative to the base config.
 * If `simulateLatency` is off, resolves immediately.
 * If `simulateErrors` is on, may randomly throw.
 */
export const dummyDelay = (requestMs?: number): Promise<void> =>
  new Promise((resolve, reject) => {
    // Optional random error simulation
    if (dummyApiConfig.simulateErrors && Math.random() < dummyApiConfig.errorRate) {
      const wait = dummyApiConfig.simulateLatency ? dummyApiConfig.latencyMs : 0;
      return setTimeout(
        () => reject(new Error('Simulated network error')),
        wait,
      );
    }

    if (!dummyApiConfig.simulateLatency) return resolve();

    const ms = requestMs
      ? Math.min(requestMs, dummyApiConfig.latencyMs * 3)
      : dummyApiConfig.latencyMs;

    setTimeout(resolve, ms);
  });
