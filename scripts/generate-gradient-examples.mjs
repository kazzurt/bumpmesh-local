/* SPDX-License-Identifier: AGPL-3.0-only */
// Recreate the test projects without changing the application or texture maps.
import assert from 'node:assert/strict';
import { mkdir, writeFile, stat, copyFile } from 'node:fs/promises';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { GRADIENT_DEFAULTS, GRADIENT_KEYS, normalizeGradientSettings } from '../js/textureGradient.js';
import { buildAdjacency } from '../js/exclusion.js';
import { PaintTree } from '../js/paintTree.js';
import { setupGeometry } from '../js/stlLoader.js';
import { countEdgeDefects, countAreaSlivers } from '../js/meshRepair.js';
import { LOCAL_TEXTURE_PRESETS } from '../js/localTexturePresets.js';

const destination = new URL('../bumpmesh-local-working/gradient-validation/', import.meta.url);
await mkdir(destination, { recursive: true });
const source = new THREE.CylinderGeometry(16, 16, 64, 48, 1, false).toNonIndexed();
source.rotateX(Math.PI / 2); // Stand the cylinder along BumpMesh's Z height axis.
const binary = new STLExporter().parse(new THREE.Mesh(source), { binary: true });
const model = new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength);
const geometry = new STLLoader().parse(model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength));
const cleaned = setupGeometry(geometry);
assert.equal(cleaned.nanCount + cleaned.degenerateCount, 0);
assert.deepEqual(countEdgeDefects(geometry), { open: 0, nonManifold: 0, tris: 192 });
assert.equal(countAreaSlivers(geometry), 0);
const adjacency = buildAdjacency(geometry);
const tree = new PaintTree({ positions: geometry.attributes.position.array,
  vertId: adjacency.vertId, vertCount: adjacency.vertCount,
  adjacency: adjacency.adjacency, faceNormals: adjacency.faceNormals });
tree.addLayer(101);
const waveSlot = tree.addLayer(102);
// A small rear strip on the upper layer exposes the lower diamond-plate layer.
const protectedStrip = [];
for (let face = 0; face < geometry.attributes.position.count / 3; face++) {
  if (adjacency.faceNormals[face * 3 + 1] < -0.9 && Math.abs(adjacency.faceNormals[face * 3 + 2]) < 0.01) protectedStrip.push(face);
}
tree.paintFaces(waveSlot, protectedStrip, false);
const serializedPaint = PaintTree.toJSON(tree.serialize());

const common = {
  scaleUnit: 'mm', mappingMode: 3, scaleU: 10, scaleV: 10, lockScale: true,
  offsetU: 0, offsetV: 0, rotation: 0, amplitude: 0.4, textureHeight: 0.4,
  invertDisplacement: false, invertTexture: false, textureSmoothing: 0,
  symmetricDisplacement: false, mappingBlend: 1, seamBandWidth: 0.5, capAngle: 20,
  boundaryFalloff: 1, boundaryFalloffCurve: 'scurve', snapSeamlessWrap: false,
  cylinderCenterX: null, cylinderCenterY: null, cylinderRadius: null,
};
const diamondGradient = { ...common, ...GRADIENT_DEFAULTS, gradientEnabled: true,
  gradientAxis: 'z', gradientMode: 'ramp', gradientStart: 0.08, gradientEnd: 0.92,
  gradientDepthStart: 0.15, gradientDepthEnd: 1.25 };
const waveGradient = { ...common, scaleU: 14, scaleV: 14, amplitude: 0.3, textureHeight: 0.3,
  ...GRADIENT_DEFAULTS, gradientEnabled: true, gradientAxis: 'z', gradientMode: 'band',
  gradientStart: 0.12, gradientEnd: 0.88, gradientDepthStart: 0.25, gradientDepthEnd: 1,
  gradientScaleStart: 0.75, gradientScaleEnd: 1.5,
  gradientOpacityStart: 0, gradientOpacityEnd: 0.75 };
const layers = [
  { id: 101, settings: diamondGradient, activeMapName: 'Local: Diamond Plate', includeOnly: false, visible: true, blendAdd: false },
  { id: 102, settings: waveGradient, activeMapName: 'Local: Wave Interference', includeOnly: false, visible: true, blendAdd: false },
];
const globals = {
  version: 1, refineLength: 0.9, maxTriangles: 100000,
  bottomAngleLimit: 5, topAngleLimit: 5, noDownwardZ: false, smoothBottom: true,
  harvestFlatFaces: true, harvestTol: 0.005, preserveUntextured: true,
  cylinderPanelMinimized: true,
};
const layered = { ...globals, ...waveGradient, activeMapName: layers[1].activeMapName,
  activeLayer: 1, layers, paint: 'paint.json' };
const omitGradient = settings => Object.fromEntries(Object.entries(settings).filter(([key]) => !GRADIENT_KEYS.includes(key)));
const legacyLayered = omitGradient({ ...layered,
  layers: layers.map(layer => ({ ...layer, settings: omitGradient(layer.settings) })) });
const legacySingle = { ...globals, ...common, activeMapName: layers[0].activeMapName };

const fourMaps = ['Local: Diamond Plate', 'Local: Wave Interference', 'Local: Scales', 'Local: Organic Crack'];
const fourLayerSettings = [
  { gradientAxis: 'z', gradientMode: 'ramp', gradientDepthStart: 0.2, gradientDepthEnd: 1.2 },
  { gradientAxis: 'x', gradientMode: 'band', gradientDepthStart: 0.3, gradientDepthEnd: 1,
    gradientOpacityStart: 0.25, gradientOpacityEnd: 0.9 },
  { gradientAxis: 'y', gradientMode: 'ramp', gradientDepthStart: 1, gradientDepthEnd: 0.4,
    gradientScaleStart: 0.8, gradientScaleEnd: 1.2 },
  { gradientAxis: 'z', gradientMode: 'band', gradientDepthStart: 0.1, gradientDepthEnd: 1,
    gradientScaleStart: 1.2, gradientScaleEnd: 0.8, gradientOpacityStart: 0.3, gradientOpacityEnd: 0.8 },
];
const fourLayers = fourMaps.map((name, i) => ({ id: 201 + i, settings: { ...common,
  scaleU: 9 + i * 2, scaleV: 9 + i * 2, amplitude: 0.15, textureHeight: 0.15,
  ...GRADIENT_DEFAULTS, gradientEnabled: true, gradientStart: 0.05, gradientEnd: 0.95,
  ...fourLayerSettings[i] }, activeMapName: name, includeOnly: false, visible: true, blendAdd: i > 0 }));
const fourTree = new PaintTree({ positions: geometry.attributes.position.array,
  vertId: adjacency.vertId, vertCount: adjacency.vertCount,
  adjacency: adjacency.adjacency, faceNormals: adjacency.faceNormals });
fourLayers.forEach(layer => fourTree.addLayer(layer.id)); // Exclude mode, no exclusions.
const fourPaint = PaintTree.toJSON(fourTree.serialize());
const fourLayered = { ...globals, ...fourLayers[3].settings, activeMapName: fourLayers[3].activeMapName,
  activeLayer: 3, layers: fourLayers, paint: 'paint.json' };

for (const name of [...layers, ...fourLayers].map(layer => layer.activeMapName)) {
  const preset = LOCAL_TEXTURE_PRESETS.find(p => p.name === name);
  assert.ok(preset, `missing fixture texture ${name}`);
  assert.ok((await stat(new URL('../' + preset.url, import.meta.url))).size > 0);
}
const fixtures = [
  ['layered-gradient-cylinder', layered, serializedPaint],
  ['legacy-layered-cylinder', legacyLayered, serializedPaint],
  ['legacy-single-cylinder', legacySingle, null],
  ['four-layer-gradient-cylinder', fourLayered, fourPaint],
];
const manifest = [];
for (const [name, settings, paintJSON] of fixtures) {
  const entries = { 'model.stl': model, 'settings.json': strToU8(JSON.stringify(settings, null, 2)) };
  if (paintJSON) entries['paint.json'] = strToU8(JSON.stringify(paintJSON));
  const zipped = zipSync(entries, { level: 6 });
  await writeFile(new URL(`${name}.bumpmesh`, destination), zipped);
  await writeFile(new URL(`${name}.settings.json`, destination), JSON.stringify(settings, null, 2) + '\n');
  const unpacked = unzipSync(zipped);
  const reread = JSON.parse(strFromU8(unpacked['settings.json']));
  assert.deepEqual(reread, settings);
  for (const saved of reread.layers?.map(layer => layer.settings) ?? [reread]) {
    if (name.startsWith('legacy')) assert.equal(normalizeGradientSettings(saved).gradientEnabled, false);
    else assert.equal(normalizeGradientSettings(saved).gradientEnabled, true);
  }
  if (paintJSON) {
    const restored = new PaintTree({ positions: geometry.attributes.position.array,
      vertId: adjacency.vertId, vertCount: adjacency.vertCount,
      adjacency: adjacency.adjacency, faceNormals: adjacency.faceNormals });
    paintJSON.layerIds.forEach(id => restored.addLayer(id));
    assert.ok(restored.deserialize(PaintTree.fromJSON(JSON.parse(strFromU8(unpacked['paint.json'])))));
    assert.ok(PaintTree.serializedEqual(restored.serialize(), PaintTree.fromJSON(paintJSON)));
  }
  manifest.push({ file: `${name}.bumpmesh`, bytes: zipped.length,
    triangles: geometry.attributes.position.count / 3, layers: reread.layers?.length ?? 1,
    gradientsEnabled: !name.startsWith('legacy'), paintedRearStripFaces: paintJSON === serializedPaint ? protectedStrip.length : 0,
    activeLayer: reread.activeLayer ?? 0 });
}
await writeFile(new URL('gradient-cylinder-source.stl', destination), model);
await writeFile(new URL('fixture-manifest.json', destination), JSON.stringify(manifest, null, 2) + '\n');
const exampleDirectory = new URL('../examples/gradient-textures/', import.meta.url);
await mkdir(exampleDirectory, { recursive: true });
await copyFile(new URL('layered-gradient-cylinder.bumpmesh', destination), new URL('layered-gradient-cylinder.bumpmesh', exampleDirectory));
geometry.dispose(); source.dispose();
console.log(JSON.stringify(manifest, null, 2));
