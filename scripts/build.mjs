import { execFileSync } from 'node:child_process';
const run = (...args) => execFileSync('npx', ['--no-install', ...args], { stdio: 'inherit' });
run('prisma', 'generate');
if (process.env.VERCEL_ENV === 'production') run('prisma', 'migrate', 'deploy');
run('next', 'build');
