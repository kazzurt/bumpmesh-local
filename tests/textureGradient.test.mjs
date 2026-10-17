/*
 * Copyright (c) 2026 CNCKitchen (Stefan Hermann) and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADIENT_DEFAULTS, GRADIENT_KEYS, normalizeGradientSettings, evaluateTextureGradient,
} from '../js/textureGradient.js';
import { runExportPipeline } from '../js/exportPipeline.js';
import { applyDisplacementLayers } from '../js/displacement.js';
import { THREE } from '../js/threeCompat.js';
import { countEdgeDefects, countAreaSlivers } from '../js/meshRepair.js';

const bounds = {
  min: { x: -10, y: 20, z: 100 }, max: { x: 10, y: 60, z: 110 },
  size: { x: 20, y: 40, z: 10 }, center: { x: 0, y: 40, z: 105 },
};
const cubeBounds = {
  min: { x: -5, y: -5, z: -5 }, max: { x: 5, y: 5, z: 5 },
  size: { x: 10, y: 10, z: 10 }, center: { x: 0, y: 0, z: 0 },
};
const close = (actual, expected, message = '') =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
const pointAt = (axis, fraction, b = bounds) => ({
  ...b.center, [axis]: b.min[axis] + fraction * b.size[axis],
});
const gradient = extra => ({ ...GRADIENT_DEFAULTS, gradientEnabled: true, ...extra });

test('absent or disabled gradients leave every multiplier at one', () => {
  assert.equal(GRADIENT_DEFAULTS.gradientEnabled, false);
  assert.deepEqual([...GRADIENT_KEYS].sort(), Object.keys(GRADIENT_DEFAULTS).sort());
  for (const settings of [{}, { gradientDepthStart: 0 }, {
    ...gradient({ gradientDepthStart: 0, gradientDepthEnd: 2,
      gradientScaleStart: 0.25, gradientScaleEnd: 4, gradientOpacityStart: 0,
      gradientOpacityEnd: 0 }), gradientEnabled: false,
  }]) {
    for (const pos of [bounds.min, bounds.center, bounds.max]) {
      assert.deepEqual(evaluateTextureGradient(pos, settings, bounds), { depth: 1, scale: 1, opacity: 1 });
    }
  }
});

test('ramp depth, tile size and opacity use the selected model axis and extent', () => {
  for (const axis of ['x', 'y', 'z']) {
    const settings = gradient({ gradientAxis: axis, gradientCurve: 'linear',
      gradientStart: 0.2, gradientEnd: 0.8, gradientDepthStart: 0.2, gradientDepthEnd: 1.4,
      gradientScaleStart: 0.5, gradientScaleEnd: 2, gradientOpacityStart: 0.1, gradientOpacityEnd: 0.9 });
    // Before/after the chosen region, hold the endpoint values. Vary the
    // unrelated coordinates as well to catch accidental radial/height math.
    for (const [fraction, t] of [[0, 0], [0.2, 0], [0.35, 0.25], [0.5, 0.5], [0.65, 0.75], [0.8, 1], [1, 1]]) {
      const pos = pointAt(axis, fraction);
      for (const other of ['x', 'y', 'z']) if (other !== axis) pos[other] = bounds.max[other] * 2;
      const actual = evaluateTextureGradient(pos, settings, bounds);
      close(actual.depth, 0.2 + 1.2 * t, `${axis}/${fraction} depth`);
      close(actual.scale, 0.5 + 1.5 * t, `${axis}/${fraction} scale`);
      close(actual.opacity, 0.1 + 0.8 * t, `${axis}/${fraction} opacity`);
    }
  }
});

test('center band is strongest in the middle and symmetric outside the region', () => {
  for (const axis of ['x', 'y', 'z']) {
    const settings = gradient({ gradientAxis: axis, gradientMode: 'band', gradientCurve: 'linear',
      gradientStart: 0.2, gradientEnd: 0.8, gradientScaleStart: 0.5, gradientScaleEnd: 2,
      gradientOpacityStart: 0, gradientOpacityEnd: 1 });
    for (const [fraction, t] of [[0, 0], [0.2, 0], [0.35, 0.5], [0.5, 1], [0.65, 0.5], [0.8, 0], [1, 0]]) {
      const actual = evaluateTextureGradient(pointAt(axis, fraction), settings, bounds);
      close(actual.depth, t, `${axis}/${fraction} band depth`);
      close(actual.scale, 0.5 + 1.5 * t, `${axis}/${fraction} band scale`);
      close(actual.opacity, t, `${axis}/${fraction} band opacity`);
    }
  }
});

test('smooth curve eases the ramp and both sides of a center band', () => {
  const ramp = gradient({ gradientCurve: 'smooth', gradientOpacityStart: 0, gradientOpacityEnd: 1 });
  for (const [fraction, expected] of [[0, 0], [0.25, 0.15625], [0.5, 0.5], [0.75, 0.84375], [1, 1]]) {
    const actual = evaluateTextureGradient(pointAt('z', fraction), ramp, bounds);
    close(actual.depth, expected);
    close(actual.opacity, expected);
  }
  const band = { ...ramp, gradientMode: 'band' };
  for (const fraction of [0.125, 0.875]) close(evaluateTextureGradient(pointAt('z', fraction), band, bounds).depth, 0.15625);
});

test('a collapsed model axis uses its midpoint and malformed settings stay finite', () => {
  const flatBounds = { ...bounds, min: { ...bounds.min, z: 105 }, max: { ...bounds.max, z: 105 },
    size: { ...bounds.size, z: 0 } };
  const actual = evaluateTextureGradient({ x: 0, y: 40, z: 105 }, gradient({ gradientCurve: 'linear',
    gradientScaleStart: 0.5, gradientScaleEnd: 2, gradientOpacityStart: 0, gradientOpacityEnd: 1 }), flatBounds);
  assert.deepEqual(actual, { depth: 0.5, scale: 1.25, opacity: 0.5 });

  const normalized = normalizeGradientSettings({ gradientEnabled: true, gradientAxis: 'radial',
    gradientMode: 'unknown', gradientCurve: 'unknown', gradientStart: 0.9, gradientEnd: 0.2,
    gradientDepthStart: -5, gradientDepthEnd: 10, gradientScaleStart: -1,
    gradientScaleEnd: 100, gradientOpacityStart: -20, gradientOpacityEnd: 100 });
  assert.equal(normalized.gradientAxis, 'z');
  assert.equal(normalized.gradientMode, 'ramp');
  assert.equal(normalized.gradientCurve, 'smooth');
  assert.ok(normalized.gradientEnd - normalized.gradientStart >= 0.001 - 1e-12);
  assert.deepEqual([normalized.gradientDepthStart, normalized.gradientDepthEnd], [0, 2]);
  assert.deepEqual([normalized.gradientScaleStart, normalized.gradientScaleEnd], [0.25, 4]);
  assert.deepEqual([normalized.gradientOpacityStart, normalized.gradientOpacityEnd], [0, 1]);
  for (const invalid of [NaN, Infinity, -Infinity, 'invalid']) {
    const settings = normalizeGradientSettings({ ...gradient({}), gradientStart: invalid,
      gradientEnd: invalid, gradientDepthStart: invalid, gradientScaleEnd: invalid, gradientOpacityStart: invalid });
    for (const value of Object.values(settings)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
    for (const value of Object.values(evaluateTextureGradient(bounds.center, settings, bounds))) assert.ok(Number.isFinite(value));
  }
});

function cubeSoup(h = 5) {
  const v = [[-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]];
  const q = [[0,3,2,1],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[3,0,4,7]];
  return new Float32Array(q.flatMap(([a,b,c,d]) => [a,b,c,a,c,d].flatMap(i => v[i])));
}
function solidMap(grey = 255) {
  return { data: new Uint8ClampedArray([grey,grey,grey,255]), width: 1, height: 1 };
}
function patternMap() {
  const grey = [12,88,144,244,196,22,234,108,66,216,38,160,250,130,178,48];
  return { data: new Uint8ClampedArray(grey.flatMap(v => [v,v,v,255])), width: 4, height: 4 };
}
const settings = {
  mappingMode: 5, scaleU: 3.1, scaleV: 4.2, amplitude: 0.4, textureHeight: 0.4,
  offsetU: 0.11, offsetV: 0.07, rotation: 12, refineLength: 1.25, maxTriangles: 100000,
  bottomAngleLimit: 0, topAngleLimit: 0, mappingBlend: 1, seamBandWidth: 0.5,
  textureSmoothing: 0, blendNormalSmoothing: 4, capAngle: 20, boundaryFalloff: 0,
  symmetricDisplacement: false, noDownwardZ: false, smoothBottom: false,
  harvestFlatFaces: false, preserveUntextured: true, regularizeEnabled: false,
  snapSeamlessWrap: false,
};
function layer(extra = {}, imageData = solidMap()) {
  return { imageData, imgWidth: imageData.width, imgHeight: imageData.height,
    settings: { ...settings, ...extra }, blendAdd: false };
}
async function exportLayers(layers, globalOverrides = {}) {
  const result = await runExportPipeline({ positions: cubeSoup(), layers,
    settings: { ...settings, ...globalOverrides }, bounds: cubeBounds, regularizeOpts: {}, mode: 'export' });
  assert.ok(result && result.positions.length > 108, 'export did not refine the source cube');
  assert.equal(result.normals.length, result.positions.length);
  assert.ok(result.positions.every(Number.isFinite) && result.normals.every(Number.isFinite), 'non-finite mesh data');
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
  const defects = countEdgeDefects(geometry);
  assert.equal(defects.open, 0, 'export has open edges');
  assert.equal(defects.nonManifold, 0, 'export has non-manifold edges');
  assert.equal(countAreaSlivers(geometry), 0, 'export has degenerate triangles');
  geometry.dispose();
  return result;
}
function axisRange(positions, axis) {
  const dim = 'xyz'.indexOf(axis);
  let min = Infinity, max = -Infinity;
  for (let i = dim; i < positions.length; i += 3) { min = Math.min(min, positions[i]); max = Math.max(max, positions[i]); }
  return [min, max];
}
function topInterior(positions) {
  let max = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    if (Math.abs(positions[i]) < 1 && Math.abs(positions[i + 1]) < 1 && positions[i + 2] > 4) max = Math.max(max, positions[i + 2]);
  }
  assert.ok(Number.isFinite(max), 'refined mesh has no top interior samples');
  return max;
}

test('disabled gradients produce byte-identical legacy single and layered exports', async () => {
  const staleDisabled = { ...gradient({ gradientDepthStart: 2, gradientDepthEnd: 0,
    gradientScaleStart: 0.25, gradientScaleEnd: 4, gradientOpacityStart: 0, gradientOpacityEnd: 0 }), gradientEnabled: false };
  const map = patternMap();
  for (const add of [false, true]) {
    const baseline = await exportLayers([layer({}, map), { ...layer({ amplitude: 0.2 }, map), blendAdd: add }]);
    const disabled = await exportLayers([layer(staleDisabled, map), {
      ...layer({ ...staleDisabled, amplitude: 0.2 }, map), blendAdd: add }], staleDisabled);
    assert.deepEqual(disabled.positions, baseline.positions);
    assert.deepEqual(disabled.normals, baseline.normals);
  }
  const input = { positions: cubeSoup(), imageData: map, imgWidth: 4, imgHeight: 4,
    settings: { ...settings }, bounds: cubeBounds, regularizeOpts: {}, mode: 'export' };
  const baseline = await runExportPipeline(input);
  const disabled = await runExportPipeline({ ...input, settings: { ...settings, ...staleDisabled } });
  assert.deepEqual(disabled.positions, baseline.positions);
  assert.deepEqual(disabled.normals, baseline.normals);
});

test('real exports apply depth ramps independently along X, Y and Z', async () => {
  for (const axis of ['x', 'y', 'z']) {
    const result = await exportLayers([layer(gradient({ gradientAxis: axis, gradientCurve: 'linear' }))]);
    const [min, max] = axisRange(result.positions, axis);
    close(min, -5, `${axis} zero-depth endpoint`);
    assert.ok(max > 5.38 && max < 5.41, `${axis} full-depth endpoint: ${max}`);
  }
});

test('real center-band export fades at both ends and raises the middle', async () => {
  const result = await exportLayers([layer(gradient({ gradientMode: 'band', gradientCurve: 'smooth' }))]);
  assert.deepEqual(axisRange(result.positions, 'z'), [-5, 5]);
  let sideMiddle = -Infinity;
  for (let i = 0; i < result.positions.length; i += 3) {
    if (Math.abs(result.positions[i]) < 1 && Math.abs(result.positions[i + 2]) < 0.01) {
      sideMiddle = Math.max(sideMiddle, result.positions[i + 1]);
    }
  }
  assert.ok(sideMiddle > 5.38 && sideMiddle < 5.41, `missing strongest middle relief: ${sideMiddle}`);
});

test('tile-size gradients alter real mesh sampling in every supported projection', async () => {
  const map = patternMap();
  for (let mode = 0; mode <= 6; mode++) {
    const baseline = await exportLayers([layer({ mappingMode: mode }, map)]);
    const varying = await exportLayers([layer({ mappingMode: mode, ...gradient({
      gradientDepthStart: 1, gradientDepthEnd: 1, gradientScaleStart: 0.5, gradientScaleEnd: 2 }), }, map)]);
    assert.notDeepEqual(varying.positions, baseline.positions, `projection ${mode} ignored tile-size gradient`);
  }
});

test('opacity crossfades Cover layers and scales Add relief while preserving masks', async () => {
  const upperHard = new Uint8Array([1,1,0,0,1,1,1,1,1,1,1,1]);
  const upperCorners = new Float32Array(36);
  upperHard.forEach((v, face) => upperCorners.fill(v, face * 3, face * 3 + 3));
  const baseLayer = layer();
  const base = await exportLayers([baseLayer]);
  const makeUpper = (opacity, blendAdd) => ({ ...layer({ amplitude: 0.8, ...gradient({
    gradientDepthStart: 1, gradientDepthEnd: 1, gradientOpacityStart: opacity, gradientOpacityEnd: opacity }) }, solidMap(64)),
    hardFaces: upperHard, exclude: upperCorners, blendAdd });
  const fullCover = await exportLayers([baseLayer, makeUpper(1, false)]);
  const halfCover = await exportLayers([baseLayer, makeUpper(0.5, false)]);
  const halfAdd = await exportLayers([baseLayer, makeUpper(0.5, true)]);
  const hidden = await exportLayers([baseLayer, makeUpper(0, false)]);
  const b = topInterior(base.positions), full = topInterior(fullCover.positions);
  assert.ok(full < b - 0.15, 'Cover did not replace the lower layer');
  assert.ok(Math.abs(topInterior(halfCover.positions) - (b + full) / 2) < 1e-5, 'opacity did not crossfade Cover relief');
  assert.ok(Math.abs(topInterior(halfAdd.positions) - (b + (full - 5) / 2)) < 1e-5, 'opacity did not scale Add relief');
  assert.deepEqual(hidden.positions, base.positions, 'zero-opacity Cover erased the lower layer');
  for (const result of [fullCover, halfCover, halfAdd, hidden]) {
    assert.equal(axisRange(result.positions, 'z')[0], axisRange(base.positions, 'z')[0], 'upper layer changed masked bottom');
  }
  const zeroDepth = await exportLayers([baseLayer, { ...makeUpper(1, false), settings: {
    ...makeUpper(1, false).settings, gradientDepthStart: 0, gradientDepthEnd: 0 } }]);
  close(topInterior(zeroDepth.positions), 5, 'zero depth must still cover when opacity is one');
});

test('enabled opacity Cover preserves lower relief through soft masks and boundary falloff', async () => {
  const upperHard = new Uint8Array([1,1,0,0,1,1,1,1,1,1,1,1]);
  const upperCorners = new Float32Array(36);
  upperHard.forEach((v, face) => upperCorners.fill(v ? 1 : 0.25, face * 3, face * 3 + 3));
  const upper = { ...layer({ amplitude: 0.8, boundaryFalloff: 2, boundaryFalloffCurve: 'linear',
    ...gradient({ gradientDepthStart: 1, gradientDepthEnd: 1 }) }),
    hardFaces: upperHard, exclude: upperCorners };
  const source = await exportLayers([layer({ amplitude: 0 })]);
  const bottom = await exportLayers([layer()]);
  const upperOnly = await exportLayers([upper]);
  const combined = await exportLayers([layer(), { ...upper, settings: { ...upper.settings,
    gradientOpacityStart: 0.5, gradientOpacityEnd: 0.5 } }]);
  let partialSamples = 0;
  for (let i = 0; i < source.positions.length; i += 3) {
    // Stay within the flat top face to avoid the cube's mitred corners.
    if (source.positions[i + 2] !== 5 || Math.abs(source.positions[i]) >= 4.9 || Math.abs(source.positions[i + 1]) >= 4.9) continue;
    const upperDelta = upperOnly.positions[i + 2] - 5;
    const lowerDelta = bottom.positions[i + 2] - 5;
    const coverage = upperDelta / 0.8;
    if (coverage > 0.02 && coverage < 0.7) {
      partialSamples++;
      const expected = 5 + lowerDelta * (1 - coverage * 0.5) + upperDelta * 0.5;
      assert.ok(Math.abs(combined.positions[i + 2] - expected) < 1e-5,
        `soft/falloff Cover discarded lower relief at coverage ${coverage}`);
    }
  }
  assert.ok(partialSamples > 10, 'fixture did not exercise a partially covered boundary');
});

test('enabled opacity Cover uses the angle blend weight at shared smooth vertices', () => {
  // A horizontal triangle is masked by the 20-degree top limit; its 45-degree
  // neighbor remains textured. Their doubled areas are 1 and sqrt(2).
  // Smooth +Z normals and inward relief make the shared displacement directly
  // measurable without the overhang/angle upward-motion clamp.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0,0,0, 1,0,0, 0,1,0,
    1,0,0, 0,0,0, 0,-1,-1,
  ]), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1,
  ]), 3));
  const bottom = layer({ amplitude: -0.4 });
  const upper = layer({ amplitude: -0.8, ...gradient({ gradientDepthStart: 1,
    gradientDepthEnd: 1, gradientOpacityStart: 0.5, gradientOpacityEnd: 0.5 }) });
  const result = applyDisplacementLayers(geometry, [bottom, upper], { ...settings, topAngleLimit: 20 }, cubeBounds);
  const unmasked = Math.SQRT2 / (1 + Math.SQRT2);
  const expected = -0.4 * unmasked * (1 - 0.5 * unmasked) - 0.8 * unmasked * 0.5;
  for (const vertex of [0, 1, 3, 4]) {
    assert.ok(Math.abs(result.attributes.position.getZ(vertex) - expected) < 1e-6,
      'angle blend Cover failed to preserve partially covered lower relief');
  }
  close(result.attributes.position.getZ(2), 0, 'masked triangle interior');
  assert.ok(Math.abs(result.attributes.position.getZ(5) - (-1.6)) < 1e-6, 'unmasked interior did not crossfade at half opacity');
  result.dispose();
  geometry.dispose();
});

test('gradient exports stay closed and finite through decimation and repair', async () => {
  const result = await exportLayers([layer({ ...gradient({ gradientMode: 'band',
    gradientDepthStart: 0.2, gradientDepthEnd: 1.5, gradientScaleStart: 0.75, gradientScaleEnd: 1.5 }) }, patternMap())],
    { maxTriangles: 500, harvestFlatFaces: true, harvestTol: 0.005 });
  assert.equal(result.runDecimation, true);
  assert.ok(result.repairStats);
  assert.deepEqual([result.repairStats.open, result.repairStats.nonManifold, result.repairStats.slivers], [0, 0, 0]);
});
