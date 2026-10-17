/*
 * Copyright (c) 2026 CNCKitchen (Stefan Hermann) and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { IMAGE_PRESETS } from '../js/presetTextures.js';
import { LOCAL_TEXTURE_PRESETS } from '../js/localTexturePresets.js';
import { TRANSLATIONS } from '../js/i18n.js';
import { runExportPipeline } from '../js/exportPipeline.js';

const root = new URL('../', import.meta.url);
const read = url => readFile(url, 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Preserve quoted URLs while removing comments, so attribution/documentation
// links do not masquerade as runtime dependencies in the graph below.
function withoutComments(source) {
  return source.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)/g,
    (match, quoted) => quoted ?? '');
}

test('browser and worker module graph resolves entirely to existing local files', async () => {
  const html = await read(new URL('index.html', root));
  const imports = JSON.parse(html.match(/<script\s+type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  function resolve(specifier, parent) {
    assert.ok(!/^(?:https?:)?\/\//i.test(specifier), `network module: ${specifier}`);
    const key = Object.keys(imports).sort((a, b) => b.length - a.length)
      .find(k => k === specifier || (k.endsWith('/') && specifier.startsWith(k)));
    const url = key
      ? new URL(imports[key] + specifier.slice(key.length), root)
      : new URL(specifier, parent);
    assert.equal(url.protocol, 'file:', `nonlocal dependency: ${url}`);
    assert.ok(url.href.startsWith(root.href), `dependency escaped distribution: ${url}`);
    return url;
  }
  // Bare dependencies require the browser's import map, never Node resolution.
  for (const target of Object.values(imports)) {
    const url = resolve(target, root);
    assert.ok((await stat(url)).isFile() || (await stat(url)).isDirectory());
  }
  const queue = [...html.matchAll(/<script\s+type="module"\s+src="([^"]+)"/g)]
    .map(m => resolve(m[1], root));
  assert.ok(queue.length > 0, 'production entry module was not found');
  const visited = new Set();
  while (queue.length) {
    const url = queue.pop();
    if (visited.has(url.href)) continue;
    visited.add(url.href);
    assert.ok((await stat(url)).isFile(), `missing module: ${fileURLToPath(url)}`);
    const source = withoutComments(await read(url));
    const refs = [];
    for (const m of source.matchAll(/\b(?:import|export)\s+(?:[^;'"`]*?\s+from\s*)?['"]([^'"]+)['"]/g)) refs.push(m[1]);
    // Worker entry URLs and the Three.js fallback are dependencies even though
    // they are absent from the page's static import statements.
    const urlConstants = new Map();
    for (const m of source.matchAll(/\bnew\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g)) {
      refs.push(m[1]);
    }
    for (const m of source.matchAll(/\bconst\s+(\w+)\s*=\s*new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)\.href/g)) {
      urlConstants.set(m[1], m[2]);
    }
    for (const m of source.matchAll(/\bimport\s*\(\s*([^)]*?)\s*\)/g)) {
      const expr = m[1].trim();
      const literal = expr.match(/^['"]([^'"]+)['"]$/);
      if (literal) refs.push(literal[1]);
      else if (urlConstants.has(expr)) refs.push(urlConstants.get(expr));
      else if (expr === '`./i18n/${lang}.js`') {
        refs.push(...Object.keys(TRANSLATIONS).map(lang => `./i18n/${lang}.js`));
      } else assert.fail(`unverified dynamic module expression in ${url}: ${expr}`);
    }
    for (const ref of refs) queue.push(resolve(ref, url));
  }
  for (const required of ['js/exportWorker.js', 'js/previewWorker.js', 'js/stepWorker.js',
    'vendor/three/build/three.module.js', 'vendor/fflate/esm/browser.js', 'vendor/meshstep/dist/index.js']) {
    assert.ok(visited.has(new URL(required, root).href), `runtime graph missed ${required}`);
  }
});

test('preset indices stay compatible and every map and thumbnail ships locally', async () => {
  // Snapshot of the 96 names/URLs at upstream ee02c390484d7d47c9023470380cba9a58f88299.
  // Project files store preset indices, making reordering a compatibility bug.
  assert.equal(hash(JSON.stringify(IMAGE_PRESETS.slice(0, 96).map(({ name, url }) => [name, url]))),
    '1e8dd51406b5ca6a36a272f87c0cc61ec808fdfa41a927b97acf74a8bb1deda7');
  assert.deepEqual(IMAGE_PRESETS.slice(96), LOCAL_TEXTURE_PRESETS);
  assert.ok(LOCAL_TEXTURE_PRESETS.length > 0);
  const manifest = JSON.parse(await read(new URL('textures/local-library/manifest.json', root)));
  assert.equal(manifest.count, LOCAL_TEXTURE_PRESETS.length);
  assert.deepEqual(manifest.textures, LOCAL_TEXTURE_PRESETS);
  assert.equal(new Set(IMAGE_PRESETS.map(p => p.name)).size, IMAGE_PRESETS.length);
  for (const preset of IMAGE_PRESETS) {
    for (const key of ['url', 'thumb']) {
      assert.ok(!/^(?:https?:)?\/\//i.test(preset[key]), `${preset.name} has a remote ${key}`);
      const url = new URL(preset[key], root);
      assert.ok(url.href.startsWith(root.href));
      assert.ok((await stat(url)).size > 0, `${preset.name} has an empty ${key}`);
    }
  }
  for (const preset of LOCAL_TEXTURE_PRESETS) {
    assert.equal(hash(await readFile(new URL(preset.url, root))), preset.sourceSha256,
      `${preset.name}: copied original no longer matches recorded source`);
  }
});

function cubeSoup(h = 5) {
  const vertices = [[-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],
    [-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]];
  const quads = [[0,3,2,1],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[3,0,4,7]];
  return new Float32Array(quads.flatMap(([a,b,c,d]) => [a,b,c,a,c,d].flatMap(i => vertices[i])));
}
function solidMap(grey) {
  return { data: new Uint8ClampedArray([grey,grey,grey,255]), width: 1, height: 1 };
}
const settings = {
  mappingMode: 0, scaleU: 5, scaleV: 5, amplitude: 0.4, textureHeight: 0.4,
  offsetU: 0, offsetV: 0, rotation: 0, refineLength: 1, maxTriangles: 100000,
  bottomAngleLimit: 0, topAngleLimit: 0, mappingBlend: 1, seamBandWidth: 0.5,
  textureSmoothing: 0, blendNormalSmoothing: 4, capAngle: 20, boundaryFalloff: 0,
  symmetricDisplacement: false, noDownwardZ: false, smoothBottom: false,
  harvestFlatFaces: false, preserveUntextured: true, regularizeEnabled: false,
  snapSeamlessWrap: false,
};

test('real export pipeline keeps masked regions and distinguishes cover from additive layers', async () => {
  const topExcluded = new Uint8Array([1,1,0,0,1,1,1,1,1,1,1,1]);
  // Per-corner and per-face masks are both required by the pipeline contract.
  const topCorners = new Float32Array(36);
  topExcluded.forEach((value, face) => topCorners.fill(value, face * 3, face * 3 + 3));
  const bottomLayer = { imageData: solidMap(255), imgWidth: 1, imgHeight: 1,
    settings: { ...settings }, blendAdd: false };
  const upperLayer = { imageData: solidMap(64), imgWidth: 1, imgHeight: 1,
    settings: { ...settings, amplitude: 0.8 }, exclude: topCorners, hardFaces: topExcluded };
  async function run(layers) {
    const stages = new Set();
    const result = await runExportPipeline({ positions: cubeSoup(), layers, settings: { ...settings },
      bounds: { min: {x:-5,y:-5,z:-5}, max: {x:5,y:5,z:5}, size: {x:10,y:10,z:10}, center: {x:0,y:0,z:0} },
      regularizeOpts: {}, mode: 'export' }, stage => stages.add(stage));
    assert.ok(result && result.positions.length > 108);
    assert.ok([...result.positions, ...result.normals].every(Number.isFinite));
    assert.equal(result.normals.length, result.positions.length);
    assert.ok(stages.has('subdivide1') && stages.has('displace'));
    return result.positions;
  }
  const base = await run([bottomLayer]);
  const cover = await run([bottomLayer, { ...upperLayer, blendAdd: false }]);
  const add = await run([bottomLayer, { ...upperLayer, blendAdd: true }]);
  const hidden = await run([bottomLayer, { ...upperLayer,
    exclude: new Float32Array(36).fill(1), hardFaces: new Uint8Array(12).fill(1), blendAdd: false }]);
  const zRange = positions => {
    const z = positions.filter((_, i) => i % 3 === 2);
    return [Math.min(...z), Math.max(...z)];
  };
  const [baseMin, baseMax] = zRange(base);
  const [coverMin] = zRange(cover);
  const [addMin] = zRange(add);
  assert.ok(baseMin < -5 && baseMax > 5, 'base layer produced no relief');
  // The top perimeter is pinned by the upper layer's mask and retains the
  // lower relief. Compare the interior, where both layers actually overlap.
  const topInterior = positions => {
    const z = [];
    for (let i = 0; i < positions.length; i += 3) {
      if (Math.abs(positions[i]) < 1 && Math.abs(positions[i + 1]) < 1 && positions[i + 2] > 4) z.push(positions[i + 2]);
    }
    assert.ok(z.length, 'no refined top interior vertices');
    return Math.max(...z);
  };
  assert.ok(topInterior(add) > topInterior(cover) + 0.35, 'overlap did not distinguish add from cover');
  assert.ok(topInterior(cover) < topInterior(base) - 0.1, 'cover failed to replace the lower relief');
  assert.ok(Math.abs(baseMin - coverMin) < 1e-6 && Math.abs(baseMin - addMin) < 1e-6,
    'top layer changed the masked bottom region');
  assert.deepEqual(hidden, base, 'fully masked upper layer changed the export');
});
