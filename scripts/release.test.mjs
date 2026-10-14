import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { inspectArchive, inspectSources, prepareRelease, verifyRelease, validateVersion, sha256, extensionId, publisherId } from './package-release.mjs';
import { normalizeChromeKey, chromeArguments } from './submit-chrome.mjs';

const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const manifest = browser => ({
  name: 'Form Safe', version, manifest_version: browser === 'chrome' ? 3 : 2,
  permissions: [], icons: { 16: 'icon.png' },
  content_scripts: [{ matches: ['*://*/*'], js: ['content.js'], run_at: 'document_idle' }],
});
async function archive(data) {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(data));
  zip.file('content.js', '// test fixture');
  zip.file('icon.png', 'test fixture');
  return zip.generateAsync({ type: 'nodebuffer' });
}
async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'form-safe-release-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const bytes = await archive(manifest('chrome'));
  const names = ['chrome', 'firefox', 'sources'].map(b => `form-safe-${version}-${b}.zip`);
  const build = { schemaVersion: 1, project: 'mikr13/form-safe', version, sourceSha, extensionId, publisherId,
    assets: names.map(name => ({ name, sha256: sha256(bytes), size: bytes.length })) };
  await writeFile(path.join(directory, names[0]), bytes);
  await writeFile(path.join(directory, 'extension-build.json'), JSON.stringify(build));
  return { directory, build, bytes, tag: `v${version}` };
}
test('Chrome-compatible versions reject prereleases, leading zeroes, and oversized components', () => {
  assert.equal(validateVersion('1.2.3'), '1.2.3');
  for (const v of ['0.0.0', '1.2.3-beta', '01.2.3', '1.65536.0', 'v1.2.3', '1.2']) assert.throws(() => validateVersion(v));
});
test('Both archive formats preserve the current manifest boundary', async () => {
  for (const browser of ['chrome', 'firefox']) await inspectArchive(await archive(manifest(browser)), version, browser);
});
test('Wrong versions and added permissions fail archive verification', async () => {
  for (const change of [{ version: '9.9.9' }, { permissions: ['storage'] }, { host_permissions: ['<all_urls>'] }, { background: { service_worker: 'content.js' } }]) {
    await assert.rejects(inspectArchive(await archive({ ...manifest('chrome'), ...change }), version, 'chrome'), /manifest differs/);
  }
});
test('Missing content assets fail archive verification', async () => {
  const data = manifest('chrome'); data.content_scripts[0].js = ['missing.js'];
  await assert.rejects(inspectArchive(await archive(data), version, 'chrome'), /missing/);
});
test('Source archives exclude prior release packages and credential files', async () => {
  const zip = new JSZip();
  zip.file('package.json', '{}'); zip.file('wxt.config.ts', '// fixture'); zip.file('entrypoints/content.ts', '// fixture');
  await inspectSources(await zip.generateAsync({ type: 'nodebuffer' }));
  for (const name of ['release/previous.zip', 'private.pem', '.env', 'nested/.env.production']) {
    zip.file(name, 'fake data');
    await assert.rejects(inspectSources(await zip.generateAsync({ type: 'nodebuffer' })), /credential files/);
    zip.remove(name);
  }
});
test('Release packaging rejects dirty source provenance', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'form-safe-dirty-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet', root]);
  await writeFile(path.join(root, 'uncommitted.txt'), 'fixture');
  await assert.rejects(prepareRelease(root), /clean Git checkout/);
});
test('A matching release tag, commit, and ZIP passes verification', async t => {
  const f = await fixture(t);
  await verifyRelease({ ...f, chromeOnly: true });
});
test('An altered release ZIP fails its checksum check', async t => {
  const f = await fixture(t);
  await writeFile(path.join(f.directory, f.build.assets[0].name), Buffer.concat([f.bytes, Buffer.from('tampered')]));
  await assert.rejects(verifyRelease({ ...f, chromeOnly: true }), /Checksum mismatch/);
});
test('Wrong tag, commit, or store identity cannot be published', async t => {
  const f = await fixture(t);
  await assert.rejects(verifyRelease({ ...f, tag: 'v9.9.9', chromeOnly: true }), /mismatch/);
  for (const change of [{ sourceSha: '0'.repeat(40) }, { extensionId: 'wrong' }, { publisherId: 'wrong' }]) {
    await writeFile(path.join(f.directory, 'extension-build.json'), JSON.stringify({ ...f.build, ...change }));
    await assert.rejects(verifyRelease({ ...f, chromeOnly: true }), /mismatch/);
  }
});
test('Duplicate or unexpected release assets are rejected', async t => {
  const f = await fixture(t);
  f.build.assets[1] = f.build.assets[0];
  await writeFile(path.join(f.directory, 'extension-build.json'), JSON.stringify(f.build));
  await assert.rejects(verifyRelease({ ...f, chromeOnly: true }), /unexpected asset/);
});
test('Private keys normalize from PEM, escaped PEM, JSON string, or service-account JSON', () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  for (const raw of [pem, pem.replace(/\n/g, '\\n'), JSON.stringify(pem), JSON.stringify({ private_key: pem })]) assert.equal(normalizeChromeKey(raw), pem);
  assert.throws(() => normalizeChromeKey('invalid secret contents'), error => !error.message.includes('invalid secret contents'));
  const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  assert.throws(() => normalizeChromeKey(ec), /complete RSA/);
});
test('Dry-run and draft arguments remain distinct from review submission', () => {
  const env = { CHROME_EXTENSION_ID: extensionId, CHROME_PUBLISHER_ID: publisherId, CHROME_ZIP: '/release/verified.zip', CHROME_PUBLISH_TYPE: 'STAGED_PUBLISH' };
  assert.ok(chromeArguments({ ...env, ACTION: 'dry-run' }).includes('--dry-run'));
  assert.ok(chromeArguments({ ...env, ACTION: 'upload-draft' }).includes('--chrome-skip-submit-review'));
  assert.deepEqual(chromeArguments({ ...env, ACTION: 'submit-review' }), ['submit', '--chrome-api-version', 'v2', '--chrome-zip', env.CHROME_ZIP]);
  for (const change of [{ ACTION: 'unknown' }, { CHROME_PUBLISH_TYPE: 'bad' }, { CHROME_EXTENSION_ID: 'wrong' }, { CHROME_ZIP: '' }]) assert.throws(() => chromeArguments({ ...env, ACTION: 'dry-run', ...change }));
});
