// node --test: proves each dev-check check fails on a broken input (no test-runner dependency).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkEnv, checkLinked, checkModules, checkNode, parseEnv } from './dev-check.mjs';

/** A fixture repo that passes every check; each test then breaks one thing. */
function repo({ installed, linked = true, env = 'KV_REST_API_URL="x"\nKV_REST_API_TOKEN="y"\nJWT_SECRET="z"\n' } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'dev-check-'));
    const pkgs = { '': {}, 'node_modules/vite': { version: '6.4.2' }, 'node_modules/@esbuild/linux-x64': { version: '0.25.0', optional: true } };
    writeFileSync(join(root, 'package-lock.json'), JSON.stringify({ packages: pkgs }));
    if (installed !== null) {
        mkdirSync(join(root, 'node_modules'));
        writeFileSync(join(root, 'node_modules', '.package-lock.json'), JSON.stringify({ packages: installed ?? { 'node_modules/vite': { version: '6.4.2' } } }));
    }
    mkdirSync(join(root, '.vercel'));
    if (linked) writeFileSync(join(root, '.vercel', 'project.json'), '{}');
    if (env !== null) writeFileSync(join(root, '.env.local'), env);
    writeFileSync(join(root, '.env.example'), 'KV_REST_API_URL=\nKV_REST_API_TOKEN=\nJWT_SECRET=\n');
    writeFileSync(join(root, '.nvmrc'), '24\n');
    return root;
}

test('passes on a healthy repo', () => {
    const root = repo();
    assert.equal(checkModules(root).ok, true);
    assert.equal(checkLinked(root).ok, true);
    assert.equal(checkEnv(root).ok, true);
});
test('fails on missing or stale node_modules, ignoring optional platform builds', () => {
    assert.equal(checkModules(repo({ installed: null })).ok, false);
    const stale = checkModules(repo({ installed: { 'node_modules/vite': { version: '5.0.0' } } }));
    assert.equal(stale.ok, false);
    assert.match(stale.msg, /vite/);
});
test('fails when not linked to Vercel', () => {
    assert.equal(checkLinked(repo({ linked: false })).ok, false);
});
test('fails on a missing env file, or a missing key', () => {
    assert.equal(checkEnv(repo({ env: null })).ok, false);
    const r = checkEnv(repo({ env: 'KV_REST_API_URL="x"\nKV_REST_API_TOKEN="y"\n' }));
    assert.equal(r.ok, false);
    assert.match(r.msg, /JWT_SECRET/);
});
test('only warns on a Node mismatch', () => {
    assert.equal(checkNode(repo(), '25.8.1').warn, true);
    assert.equal(checkNode(repo(), '24.1.0').warn, undefined);
});
test('parses quoted and bare env values', () => {
    assert.deepEqual(parseEnv('A="1"\nB=2\n# c\n'), { A: '1', B: '2' });
});
