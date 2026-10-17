/*
 * Copyright (c) 2026 CNCKitchen (Stefan Hermann) and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Per-layer gradients are evaluated on the original model, before displacement. */
export const GRADIENT_DEFAULTS = Object.freeze({
  gradientEnabled: false,
  gradientAxis: 'z',
  gradientMode: 'ramp',
  gradientCurve: 'smooth',
  gradientStart: 0,
  gradientEnd: 1,
  gradientDepthStart: 0,
  gradientDepthEnd: 1,
  gradientScaleStart: 1,
  gradientScaleEnd: 1,
  gradientOpacityStart: 1,
  gradientOpacityEnd: 1,
});

export const GRADIENT_KEYS = Object.freeze(Object.keys(GRADIENT_DEFAULTS));
const MIN_EXTENT = 0.001;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function finiteNumber(value, fallback) {
  if (value === null || value === '' || typeof value === 'boolean') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Keep old projects disabled, and sanitize project/preset input before math or uniforms. */
export function normalizeGradientSettings(settings = {}) {
  const s = settings || {};
  const start = clamp(finiteNumber(s.gradientStart, 0), 0, 1 - MIN_EXTENT);
  const end = clamp(finiteNumber(s.gradientEnd, 1), start + MIN_EXTENT, 1);
  return {
    gradientEnabled: s.gradientEnabled === true,
    gradientAxis: ['x', 'y', 'z'].includes(s.gradientAxis) ? s.gradientAxis : 'z',
    gradientMode: s.gradientMode === 'band' ? 'band' : 'ramp',
    gradientCurve: s.gradientCurve === 'linear' ? 'linear' : 'smooth',
    gradientStart: start,
    gradientEnd: end,
    gradientDepthStart: clamp(finiteNumber(s.gradientDepthStart, 0), 0, 2),
    gradientDepthEnd: clamp(finiteNumber(s.gradientDepthEnd, 1), 0, 2),
    gradientScaleStart: clamp(finiteNumber(s.gradientScaleStart, 1), 0.25, 4),
    gradientScaleEnd: clamp(finiteNumber(s.gradientScaleEnd, 1), 0.25, 4),
    gradientOpacityStart: clamp(finiteNumber(s.gradientOpacityStart, 1), 0, 1),
    gradientOpacityEnd: clamp(finiteNumber(s.gradientOpacityEnd, 1), 0, 1),
  };
}

/**
 * Compile the invariant bounds/settings once for a mesh export. Optional `out`
 * reuses an object in the hot vertex loop. A zero-width model axis uses its
 * stable midpoint rather than an arbitrary tiny denominator.
 */
export function createTextureGradientEvaluator(settings, bounds) {
  const s = normalizeGradientSettings(settings);
  const axis = s.gradientAxis;
  const min = finiteNumber(bounds?.min?.[axis], 0);
  const size = Math.max(0, finiteNumber(bounds?.size?.[axis], 0));
  const extent = s.gradientEnd - s.gradientStart;
  return (pos, out = {}) => {
    if (!s.gradientEnabled) {
      out.depth = out.scale = out.opacity = 1;
      return out;
    }
    const fraction = size > 1e-6 ? (finiteNumber(pos?.[axis], min) - min) / size : 0.5;
    let t = clamp((fraction - s.gradientStart) / extent, 0, 1);
    if (s.gradientMode === 'band') t = 1 - Math.abs(2 * t - 1);
    if (s.gradientCurve === 'smooth') t = t * t * (3 - 2 * t);
    out.depth = s.gradientDepthStart + (s.gradientDepthEnd - s.gradientDepthStart) * t;
    out.scale = s.gradientScaleStart + (s.gradientScaleEnd - s.gradientScaleStart) * t;
    out.opacity = s.gradientOpacityStart + (s.gradientOpacityEnd - s.gradientOpacityStart) * t;
    return out;
  };
}

/** Return depth, projection-size and coverage multipliers at an original model point. */
export function evaluateTextureGradient(pos, settings, bounds) {
  return createTextureGradientEvaluator(settings, bounds)(pos);
}

/** Exact shader mirror of createTextureGradientEvaluator. */
export const TEXTURE_GRADIENT_GLSL = /* glsl */`
  uniform int  layerGradientEnabled[MAX_LAYERS];
  uniform int  layerGradientAxis[MAX_LAYERS];
  uniform int  layerGradientMode[MAX_LAYERS];
  uniform int  layerGradientCurve[MAX_LAYERS];
  uniform vec2 layerGradientExtent[MAX_LAYERS];
  uniform vec2 layerGradientDepth[MAX_LAYERS];
  uniform vec2 layerGradientScale[MAX_LAYERS];
  uniform vec2 layerGradientOpacity[MAX_LAYERS];

  // Components are depth, projection-size and coverage multipliers.
  vec3 textureGradient(int l, vec3 pos) {
    if (layerGradientEnabled[l] == 0) return vec3(1.0);
    int axis = layerGradientAxis[l];
    float p = axis == 0 ? pos.x : axis == 1 ? pos.y : pos.z;
    float mn = axis == 0 ? boundsMin.x : axis == 1 ? boundsMin.y : boundsMin.z;
    float sz = axis == 0 ? boundsSize.x : axis == 1 ? boundsSize.y : boundsSize.z;
    float fraction = sz > 1e-6 ? (p - mn) / sz : 0.5;
    float t = clamp((fraction - layerGradientExtent[l].x) /
                    (layerGradientExtent[l].y - layerGradientExtent[l].x), 0.0, 1.0);
    if (layerGradientMode[l] == 1) t = 1.0 - abs(2.0 * t - 1.0);
    if (layerGradientCurve[l] == 1) t = t * t * (3.0 - 2.0 * t);
    return vec3(mix(layerGradientDepth[l].x, layerGradientDepth[l].y, t),
                mix(layerGradientScale[l].x, layerGradientScale[l].y, t),
                mix(layerGradientOpacity[l].x, layerGradientOpacity[l].y, t));
  }
`;
