/* SPDX-License-Identifier: AGPL-3.0-only */
import { GRADIENT_DEFAULTS, normalizeGradientSettings, evaluateTextureGradient } from './textureGradient.js';

// Small controller for the existing sidebar. All persistent truth remains in
// the active layer's settings; switching/restoring layers simply calls sync().
export function initGradientControls({ settings, onChange, translate }) {
  const section = document.getElementById('texture-gradient-section');
  const enabled = document.getElementById('gradient-enabled');
  const controls = document.getElementById('gradient-controls');
  const preview = document.getElementById('gradient-profile');
  const summary = document.getElementById('gradient-summary');
  const sizeHint = document.getElementById('gradient-size-hint');
  const t = translate;
  const selects = {
    gradientAxis: document.getElementById('gradient-axis'),
    gradientMode: document.getElementById('gradient-mode'),
    gradientCurve: document.getElementById('gradient-curve'),
  };
  const numbers = {};
  for (const [key, id] of [
    ['gradientStart', 'gradient-start'], ['gradientEnd', 'gradient-end'],
    ['gradientDepthStart', 'gradient-depth-start'], ['gradientDepthEnd', 'gradient-depth-end'],
    ['gradientScaleStart', 'gradient-scale-start'], ['gradientScaleEnd', 'gradient-scale-end'],
    ['gradientOpacityStart', 'gradient-opacity-start'], ['gradientOpacityEnd', 'gradient-opacity-end'],
  ]) numbers[key] = document.getElementById(id);

  const changed = () => {
    Object.assign(settings, normalizeGradientSettings(settings));
    sync();
    onChange();
  };
  enabled.addEventListener('change', () => { settings.gradientEnabled = enabled.checked; changed(); });
  for (const [key, node] of Object.entries(selects)) {
    node.addEventListener('change', () => { settings[key] = node.value; changed(); });
  }
  for (const [key, node] of Object.entries(numbers)) {
    const commit = () => {
      const value = node.valueAsNumber;
      if (!Number.isFinite(value)) { sync(); return; }
      if (settings[key] === value / 100) return;
      settings[key] = value / 100;
      changed();
    };
    node.addEventListener('change', commit);
    node.addEventListener('blur', commit);
    node.addEventListener('keydown', e => { if (e.key === 'Enter') node.blur(); });
  }
  const presets = {
    fadeIn: { gradientDepthStart: 0, gradientDepthEnd: 1 },
    fadeOut: { gradientDepthStart: 1, gradientDepthEnd: 0 },
    center: { gradientMode: 'band', gradientDepthStart: 0, gradientDepthEnd: 1 },
    grow: { gradientDepthStart: 1, gradientDepthEnd: 1, gradientScaleStart: 0.5, gradientScaleEnd: 2 },
    crossfade: { gradientDepthStart: 1, gradientDepthEnd: 1, gradientOpacityStart: 0, gradientOpacityEnd: 1 },
  };
  section.querySelectorAll('[data-gradient-preset]').forEach(button => {
    button.addEventListener('click', () => {
      // Presets preserve the chosen axis; everything else is deterministic.
      const axis = settings.gradientAxis;
      Object.assign(settings, GRADIENT_DEFAULTS, presets[button.dataset.gradientPreset], { gradientEnabled: true, gradientAxis: axis });
      changed();
    });
  });
  document.getElementById('gradient-reverse').addEventListener('click', () => {
    for (const stem of ['gradientDepth', 'gradientScale', 'gradientOpacity']) {
      [settings[stem + 'Start'], settings[stem + 'End']] = [settings[stem + 'End'], settings[stem + 'Start']];
    }
    changed();
  });

  function sync() {
    const g = normalizeGradientSettings(settings);
    enabled.checked = g.gradientEnabled;
    controls.hidden = !g.gradientEnabled;
    for (const [key, node] of Object.entries(selects)) node.value = g[key];
    for (const [key, node] of Object.entries(numbers)) node.value = +(g[key] * 100).toFixed(1);
    const band = g.gradientMode === 'band';
    document.getElementById('gradient-reverse').textContent = t(band ? 'gradient.reverseBand' : 'gradient.reverse');
    document.getElementById('gradient-column-start').textContent = `${t(band ? 'gradient.edges' : 'gradient.start')} (%)`;
    document.getElementById('gradient-column-end').textContent = `${t(band ? 'gradient.center' : 'gradient.end')} (%)`;
    const a = t(band ? 'gradient.edges' : 'gradient.start').toLowerCase();
    const b = t(band ? 'gradient.center' : 'gradient.end').toLowerCase();
    for (const [stem, label] of [['gradientDepth', 'gradient.depth'], ['gradientScale', 'gradient.scale'], ['gradientOpacity', 'gradient.opacity']]) {
      numbers[stem + 'Start'].setAttribute('aria-label', `${t(label)} — ${a} (%)`);
      numbers[stem + 'End'].setAttribute('aria-label', `${t(label)} — ${b} (%)`);
    }
    const mm = v => Number(v).toFixed(2);
    const height = Math.abs(settings.amplitude ?? 0);
    summary.textContent = t('gradient.summary', {
      axis: g.gradientAxis.toUpperCase(), from: +(g.gradientStart * 100).toFixed(1), to: +(g.gradientEnd * 100).toFixed(1),
      h0: mm(height * g.gradientDepthStart), h1: mm(height * g.gradientDepthEnd),
      s0: mm((settings.scaleU ?? 1) * g.gradientScaleStart), s1: mm((settings.scaleU ?? 1) * g.gradientScaleEnd),
    });
    sizeHint.hidden = g.gradientScaleStart === g.gradientScaleEnd;
    const bounds = { min: { x: 0, y: 0, z: 0 }, size: { x: 1, y: 1, z: 1 } };
    const profileMax = Math.max(1, g.gradientDepthStart, g.gradientDepthEnd, g.gradientScaleStart, g.gradientScaleEnd);
    for (const property of ['depth', 'scale', 'opacity']) {
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const q = i / 64;
        const factor = evaluateTextureGradient({ x: q, y: q, z: q }, g, bounds)[property];
        points.push(`${i ? 'L' : 'M'}${(8 + q * 284).toFixed(2)},${(62 - factor / profileMax * 52).toFixed(2)}`);
      }
      preview.querySelector(`[data-gradient-line="${property}"]`).setAttribute('d', points.join(' '));
    }
    preview.setAttribute('aria-label', t('gradient.profileAria'));
    section.querySelectorAll('option[data-i18n-opt]').forEach(opt => { opt.textContent = t(opt.dataset.i18nOpt); });
  }
  sync();
  return { sync };
}
