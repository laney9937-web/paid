#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

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
run('build:web', 'pnpm', ['--filter', '@paid/web', 'build']);
run('build:ops', 'pnpm', ['--filter', '@paid/ops', 'build']);
run('build:worker', 'pnpm', ['--filter', '@paid/worker', 'build']);

console.log('\nVERIFY_OK');
void require;
