#!/usr/bin/env node
import { MOCK_SCENARIOS, runAllScenarios, runScenario, type MockScenario } from './index';

function arg(name: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx < 0) return undefined;
  const cur = process.argv[idx]!;
  if (cur.includes('=')) return cur.split('=')[1];
  return process.argv[idx + 1];
}

const name = (arg('name') ?? 'happy-path') as MockScenario;
if (name === ('all' as MockScenario)) {
  const results = await runAllScenarios();
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name} ${r.detail}`);
  }
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}
if (!MOCK_SCENARIOS.includes(name)) {
  console.error(`Unknown scenario ${name}`);
  process.exit(2);
}
const result = await runScenario(name);
console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name} ${result.detail}`);
process.exit(result.ok ? 0 : 1);
