// Runtime-load gate for the serverless functions: compile api/ as written, then actually
// import() each entrypoint under Node. Static checks never load a function under the
// runtime that serves it, so they stay green while every /api/* route 500s.
//
// Ported from squatWithMe via bananaRodeo (_underScore/knowledge/vercel-api-runtime-gate.md),
// where it caught two shipped failures: package.json missing "type": "module", and
// extensionless relative imports (Node's ESM resolver needs `./storage.js`).
//
// Compiles with Vite's esbuild transform (transpile only, no type check, no bundling), as Vercel does:
// api/ is not type-clean, and a type error is not what 500s a route.
//
// Usage: npm run smoke
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { transformWithEsbuild } from 'vite';
import { dirname, join, resolve } from 'node:path';
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
const example = join(root, '.env.example');
for (const line of existsSync(example) ? readFileSync(example, 'utf8').split('\n') : []) {
    const key = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1];
    if (key) process.env[key] ||= 'smoke-placeholder';
}

const sources = readdirSync(join(root, 'api')).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir);
writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type }));
for (const f of sources) {
    const path = join(root, 'api', f);
    const { code } = await transformWithEsbuild(readFileSync(path, 'utf8'), path, { loader: 'ts', format: 'esm' });
    writeFileSync(join(outDir, f.replace(/\.ts$/, '.js')), code);
}

let failed = 0;
for (const name of sources.map((f) => f.replace(/\.ts$/, '.js')).sort()) {
    try {
        const mod = await import(pathToFileURL(join(outDir, name)).href);
        const handler = mod.default;
        if (typeof handler !== 'function') {
            // Shared modules (helpers, types) have no handler; they still had to load.
            console.log(`✓ ${name} (module, no handler)`);
            continue;
        }
        console.log(`✓ ${name}`);
    } catch (error) {
        console.error(`✗ ${name} — ${error.code ?? 'load failed'}: ${error.message.split('\n')[0]}`);
        failed++;
    }
}
rmSync(outDir, { recursive: true, force: true });

console.log(`\n${sources.length - failed}/${sources.length} api files load under the Node runtime`);
if (failed > 0) {
    console.error('✗ smoke FAILED — these would 500 in production');
    process.exit(1);
}
