// Runtime-load gate for the serverless functions: compile api/ (and the lib/ it imports) as
// written, then actually import() each entrypoint under Node. Static checks never load a
// function under the runtime that serves it, so they stay green while every /api/* route 500s.
//
// Every file in api/ deploys as a public function, so each must export a default handler.
// A helper or test left there is an endpoint that 500s (banana.rodeo's /api/storage did,
// 261022). Shared server code and its tests live in lib/, which never deploys, or under an
// `_`-prefixed path such as api/_lib/, which Vercel skips (squatWithMe's /api/_lib/db is a 404).
//
// From _underScore/knowledge/vercel-app-kit (why: knowledge/vercel-api-runtime-gate.md). It has
// caught shipped failures: package.json missing "type": "module", and extensionless relative
// imports (Node's ESM resolver needs `./storage.js`).
//
// Compiles with Vite's own transform (transpile only, no type check, no bundling), as Vercel does:
// a type error is not what 500s a route. Vite 8 has transformWithOxc and deprecates
// transformWithEsbuild; Vite 6 has only esbuild. Proven on both.
//
// Usage: npm run smoke
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import * as vite from 'vite';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '.smoke');

// Vercel strips the types and keeps the import syntax, whatever package.json declares, so
// without "type": "module" every function dies on its first `import` (a preview here did,
// once engines moved off 20.x). Mirror that, and pin the declared type in .smoke/package.json:
// Node 22+ auto-detects ESM in .js files with no "type" field, so a modern local Node would
// load what Vercel's runtime rejects.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const type = pkg.type === 'module' ? 'module' : 'commonjs';

// Some modules check their env at load (auth-jwt.ts throws without its secrets). This gate
// tests loading, not behaviour, so every key in .env.example gets a placeholder if unset.
// A *_URL key gets a URL-shaped one: clients like Redis.fromEnv() validate it at load.
const example = join(root, '.env.example');
for (const line of existsSync(example) ? readFileSync(example, 'utf8').split('\n') : []) {
    const key = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1];
    if (key) process.env[key] ||= key.endsWith('_URL') ? 'https://smoke-placeholder.invalid' : 'smoke-placeholder';
}

/** Every .ts file under dir, as paths relative to root. */
const tsFiles = (dir) =>
    existsSync(join(root, dir))
        ? readdirSync(join(root, dir), { recursive: true })
              .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
              .map((f) => join(dir, f))
        : [];
const isPrivate = (f) => f.split(/[\\/]/).some((part) => part.startsWith('_'));
const functions = tsFiles('api').filter((f) => !isPrivate(f)).toSorted();
// Private modules are compiled so functions can import them; their tests run under the test
// runner, never in production, so those aren't.
const modules = [...tsFiles('api').filter(isPrivate), ...tsFiles('lib')].filter((f) => !f.endsWith('.test.ts'));
const sources = [...functions, ...modules];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir);
writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type }));
for (const f of sources) {
    const path = join(root, f);
    const source = readFileSync(path, 'utf8');
    const { code } = vite.transformWithOxc
        ? await vite.transformWithOxc(source, path, { lang: 'ts' })
        : await vite.transformWithEsbuild(source, path, { loader: 'ts', format: 'esm' });
    const out = join(outDir, f.replace(/\.ts$/, '.js'));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, code);
}

let failed = 0;
for (const f of functions) {
    const name = relative('api', f).replace(/\.ts$/, '.js');
    try {
        const mod = await import(pathToFileURL(join(outDir, f.replace(/\.ts$/, '.js'))).href);
        if (typeof mod.default !== 'function') {
            console.error(`✗ ${name} — no default handler: it deploys as an endpoint that 500s. Move it to lib/ (or api/_lib/)`);
            failed++;
            continue;
        }
        console.log(`✓ ${name}`);
    } catch (error) {
        console.error(`✗ ${name} — ${error.code ?? 'load failed'}: ${error.message.split('\n')[0]}`);
        failed++;
    }
}
rmSync(outDir, { recursive: true, force: true });

console.log(`\n${functions.length - failed}/${functions.length} api functions load under the Node runtime`);
if (failed > 0) {
    console.error('✗ smoke FAILED — these would 500 in production');
    process.exit(1);
}
