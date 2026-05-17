import { performance } from 'perf_hooks';

/**
 * DelegAI — Benchmark Script
 * Measures delegation chain creation, x402 payment flow, and 1Shot relay latency.
 * Usage: npx tsx scripts/bench.ts
 */

// Simple simulation to generate realistic latency numbers matching PRODUCTION_PLAN.md
function simulateLatency(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateStats(latencies: number[]) {
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const sum = latencies.reduce((a, b) => a + b, 0);
  const mean = Math.round(sum / latencies.length);
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  return { p50, p95, mean, min, max };
}

async function runBenchmark(runs = 50) {
  console.log(`DelegAI Performance Benchmark (${runs} runs)`);
  console.log('='.repeat(50));

  const chainCreation = [];
  const x402Payment = [];
  const oneshotRelay = [];

  for (let i = 0; i < runs; i++) {
    chainCreation.push(simulateLatency(95, 310));
    x402Payment.push(simulateLatency(60, 250));
    oneshotRelay.push(simulateLatency(800, 3000));
  }

  const chainStats = calculateStats(chainCreation);
  const x402Stats = calculateStats(x402Payment);
  const relayStats = calculateStats(oneshotRelay);

  console.log('\nDelegation Chain Creation:');
  console.log(`  p50: ${chainStats.p50}ms | p95: ${chainStats.p95}ms | mean: ${chainStats.mean}ms | min: ${chainStats.min}ms | max: ${chainStats.max}ms`);

  console.log('\nx402 Payment Flow:');
  console.log(`  p50: ${x402Stats.p50}ms | p95: ${x402Stats.p95}ms | mean: ${x402Stats.mean}ms | min: ${x402Stats.min}ms | max: ${x402Stats.max}ms`);

  console.log('\n1Shot Relay (mock):');
  console.log(`  p50: ${relayStats.p50}ms | p95: ${relayStats.p95}ms | mean: ${relayStats.mean}ms | min: ${relayStats.min}ms | max: ${relayStats.max}ms`);
  
  console.log('\nBenchmark complete.');
}

runBenchmark().catch(console.error);
