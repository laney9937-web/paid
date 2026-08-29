#!/usr/bin/env node
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

for (const file of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '.env.example')]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
  break;
}

const require = createRequire(import.meta.url);

function run(name, command, args) {
  console.log(`\n==> ${name}`);
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env, shell: false });
  if (result.status !== 0) {
    console.error(`FAIL ${name} exit=${result.status}`);
    process.exit(result.status ?? 1);
  }
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor !== 24) {
  console.error(`Node 24 LTS required, found ${process.versions.node}`);
  process.exit(1);
}

run('format', 'pnpm', ['exec', 'prettier', '--check', '.']);
run('lint', 'pnpm', ['lint']);
run('typecheck', 'pnpm', ['typecheck']);
run('unit', 'pnpm', ['test']);
run('property', 'pnpm', ['test:property']);
run('contract', 'pnpm', ['test:contract']);
run('integration', 'pnpm', ['test:integration']);
run('migrations', 'pnpm', ['test:migrations']);
run('security', 'pnpm', ['test:security']);
run('mock:scenario', 'pnpm', ['mock:scenario', '--', '--name', 'all']);
run('sbom', 'pnpm', ['sbom']);
run('load-smoke', 'pnpm', ['test:load']);
run('native-rebuild', 'pnpm', ['rebuild']);
rmSync(resolve(process.cwd(), 'apps/web/.next'), { recursive: true, force: true });
rmSync(resolve(process.cwd(), 'apps/ops/.next'), { recursive: true, force: true });
run('build:web', 'pnpm', ['--filter', '@paid/web', 'build']);
run('build:ops', 'pnpm', ['--filter', '@paid/ops', 'build']);
run('build:worker', 'pnpm', ['--filter', '@paid/worker', 'build']);
run('e2e', 'pnpm', ['test:e2e']);

console.log('\nVERIFY_OK');
void require;
