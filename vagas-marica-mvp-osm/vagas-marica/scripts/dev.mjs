/**
 * Inicia backend e frontend juntos em modo de desenvolvimento: `npm run dev`.
 * Sem dependências extras. Ctrl+C encerra os dois; se um cair, o outro também é encerrado.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const PROCS = [
  { name: 'server', dir: 'server', color: '\x1b[35m' },
  { name: 'client', dir: 'client', color: '\x1b[36m' },
];
const RESET = '\x1b[0m';

const missing = PROCS.filter((p) => !existsSync(`${p.dir}/node_modules`));
if (missing.length) {
  console.error(`Dependências ausentes em: ${missing.map((p) => p.dir).join(', ')}. Rode antes: npm run install:all`);
  process.exit(1);
}

const children = [];
let shuttingDown = false;

function prefix(stream, { name, color }) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) console.log(`${color}[${name}]${RESET} ${line}`);
  });
  stream.on('end', () => buffer && console.log(`${color}[${name}]${RESET} ${buffer}`));
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === 'win32') {
      // No Windows, encerra a árvore inteira (npm → node/vite).
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(code), 500);
}

// Mantém as cores mesmo com a saída redirecionada (sem NO_COLOR, que conflita com FORCE_COLOR).
const env = { ...process.env, FORCE_COLOR: '1' };
delete env.NO_COLOR;

for (const proc of PROCS) {
  const child = spawn('npm', ['--prefix', proc.dir, 'run', 'dev'], {
    shell: process.platform === 'win32',
    env,
  });
  prefix(child.stdout, proc);
  prefix(child.stderr, proc);
  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(`${proc.color}[${proc.name}]${RESET} encerrado (código ${code}). Encerrando o outro processo…`);
    shutdown(code ?? 1);
  });
  children.push(child);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
