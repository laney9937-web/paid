import { describe, expect, it } from 'vitest';
import { MOCK_SCENARIOS, runAllScenarios } from './index';

describe('provider simulator named scenarios', () => {
  it('executes every required scenario', async () => {
    const results = await runAllScenarios();
    expect(results.map((r) => r.name).sort()).toEqual([...MOCK_SCENARIOS].sort());
    const failed = results.filter((r) => !r.ok);
    expect(failed).toEqual([]);
  });
});
