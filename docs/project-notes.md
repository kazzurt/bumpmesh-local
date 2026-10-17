# BumpMesh Local project notes

Updated October 17, 2026 (America/Los_Angeles).

## Decision and baseline

- Project: C:\Users\Kurtz\Documents\KURT\bumpmesh-local.
- Upstream remote: https://github.com/CNCKitchen/stlTexturizer.git. Fork origin: https://github.com/kazzurt/bumpmesh-local.git.
- Baseline: main v1.4.0, ee02c390484d7d47c9023470380cba9a58f88299, September 30, 2026.
- Development branch: local/kurtz-texture-library. Initial fork publication packages the local implementation through October 16; commit and push subsequent edits before updating upstream.
- Chose upstream after public fork/branch review: it already has four fully independent texture layers, 96 presets, recent seam/crease fixes and adaptive painting. Elliacness has eight zones and useful filament previews but predates four months of upstream work and uses shared zone settings. Detailed evidence: fork-comparison.md.

## Local additions

- Native Local library category: 14 original 512x512 grayscale maps, appended after the 96 upstream presets to preserve stored preset indices. Search names/filenames/tags, favorites, accessible names and 128px WebP thumbs.
- Raw inputs: C:\Users\Kurtz\Documents\3D Printing\Textures. Original images and generators were not changed. scripts/sync-textures.ps1 / .py reproduce copies, thumbnails, static JS catalogue and provenance manifest. Manifest includes hashes and an edge-gradient screening heuristic; it is not a seamlessness guarantee.
- Pinned local dependencies: Three.js 0.170.0, fflate 0.8.2, meshStep 0.1.0. package-lock.json + npm run vendor reproduce vendor/. Browser import map, worker Three fallback, STEP worker, and preload now use local files. Licenses retained.
- Node 24.14.0 is installed. npm start serves 127.0.0.1:8765 with no-store headers. Start-BumpMesh.cmd starts a hidden server and normal browser; Stop-BumpMesh.cmd stops only the process identified by this checkout's local health endpoint. Working logs: bumpmesh-local-working/server-logs/.
- Server allows app/runtime assets and rejects .git, node_modules and helper scripts; GET/HEAD only.

## Verification

- npm test: 25 passed (12 prior plus 13 gradient checks).
- npm run test:paint: 22/22 passed, including two-layer masks, watertight flattening and serialization round trip for paint trees.
- sync-textures.ps1 -Check: 14 maps, 0 differences. Original/source copies byte-identical; repeat sync writes 0 changes.
- Browser: 110 gallery entries; Local library filter/search; unique accessible map names; two additive layers using local Diamond Plate and Wave Interference; displaced GPU preview; both layers restored after reload.
- Actual layered STL export pipeline: 644,354 triangles, final open=0, non-manifold=0, slivers=0. The earlier preview compiler warning was fixed by deterministic shader initialization/fallback during the gradient upgrade; current preview compilation has no new warnings/errors.
- Actual module worker via test-worker.html: PASS, 106 triangles; stages subdivide1 > displace > decimate > repair. Local worker dependency fallback verified in browser.
- Launch/stop/restart verified. HTTP checks returned 200 for index, app modules, Three.js, meshStep and health; 404 for .git/config, node_modules and server script.
- Full production module graph, including lazy language imports and all three workers, resolves to packaged files without network module URLs. A physically disconnected-network browser session and representative STEP-file import were not run.
- Project save was invoked in the embedded browser, but its download event timed out with no app error. Project download/reopen in the normal browser is still unverified. Do not report an end-to-end save/load pass.

## Resolved setup issues

- Git's Windows Schannel credential handshake failed in this environment; cloning with per-command -c http.sslBackend=openssl succeeded. No global Git settings changed.
- npm default user cache was outside writable workspace; use --cache .npm-cache. Installation used --ignore-scripts.
- PowerShell CIM process inspection returned Access denied; the stop script now checks Get-Process against the PID returned by this checkout's health endpoint. Stop/restart succeeded.

## Gradient milestone: 1.4.0-local.2

- User chose gradients as the sole new upgrade; other roadmap proposals are deferred.
- Flat per-layer gradient settings: enabled, axis X/Y/Z, ramp/band, smooth/linear, normalized From/To extent, and depth/scale/opacity endpoints. Defaults disabled; missing legacy fields explicitly normalize disabled.
- Shared js/textureGradient.js mirrors numeric export math in GLSL. Evaluated against original model coordinates. GPU shading includes gradient depth and coverage slopes; CPU Cover uses complete mask × angle × falloff × opacity when gradients are enabled. Disabled CPU output retains exact legacy behavior.
- New sidebar controller/presets/profile; layer persistence, autosave, Undo/Redo and .bumpmesh settings include all gradient keys. Smart uses the active gradient's smallest scale / largest depth, retaining its existing active-layer scope.
- Browser confirmed region-value commit (blur/Enter), independent layer values, two- and four-layer displaced GPU previews, complete cylinder project import with rear strip mask, Undo/Redo restoring a center band, legacy layered settings disabling both layer gradients, Undo restoring the four-layer stack, and gradient settings surviving page reload. Actual test-texture-gradient.html worker: PASS for disabled legacy parity, masked Cover/Add, clone, finite closed output, decimation/repair.
- Shader initialization fixed a pre-existing ANGLE warning. Hidden active preview slots now have zero opacity while retaining painting capability and persisted values, so they do not cover lower relief.
- Example: examples/gradient-textures/layered-gradient-cylinder.bumpmesh. Recipe: node scripts/generate-gradient-examples.mjs. Working fixtures include four-layer, old layered and pre-layer projects plus original generated STL; all ZIP/paint roundtrips checked. No raw user media changed.
- Variable pattern size is projected UV stretching, not exact physical local pitch. Cylindrical/spherical wraps can develop seams despite base-scale snap. Enabled export allocates 16 extra bytes per unique vertex for factor caches, reclaimed between layers.
- Current tests: 25 Node, 22 paint checks. Final screenshot: docs/gradient-preview.jpg. Browser left on the editable layered cylinder example. Browser Save action executed but download event timed out without an app error; download/reopen of a newly saved project remains unverified. Full project import works. An existing settings-only layered import appears to clear current paint when rebuilding IDs; it was not changed in this upgrade.

## Export popup removal: October 4, 2026

- User requested removing the CNC Kitchen processing/store popup entirely.
- Deleted its overlay markup, export trigger/remember-dismiss logic and unused overlay/link styles. STL and 3MF buttons now call the existing export handler directly; progress, workers and export-token behavior remain unchanged.
- Kept styles shared by the welcome dialog, source attribution and license information. Unused translated sponsor strings are retained with upstream language files; no live code can display them.
- Verification: main.js syntax and diff checks pass; 25 Node tests pass. Fresh browser tab has zero sponsor-overlay elements during actual STL and 3MF exports; normal progress remains visible. STL pipeline produced 19,862 triangles with zero open/non-manifold/sliver defects. Screenshot: docs/export-without-store-popup.jpg. Existing open tab was preserved so the user can refresh when ready.

## Legacy mask import fix: October 16, 2026

- Bug: a pre-layer .bumpmesh (settings.json without `layers`, top-level mask.json `{"selectionMode": true, "excluded": [...]}`) loaded with Model + settings reported "N faces selected", but every face showed masked and export textured nothing. importProject() painted mask.json into the active layer's paint-tree slot, then replaced `layers` with a fresh `_newLayer()` whose new id had no slot, orphaning the paint. A settings-only load of a pre-layer project dropped the current mask the same way.
- Fix (js/main.js, importProject pre-layer branch): the replacement layer keeps the active layer's id, then `_syncTreeLayers()` drops the slots of any other old layers. The layered path (`_importLayers`) is unchanged.
- No Node test: main.js touches the DOM and WebGL at import time, and importProject is not exported. Manual browser repro:
  1. Zip `settings.json` = `{"activeMapName":"Crystal"}`, `mask.json` = `{"selectionMode":true,"excluded":[0,1,...,95]}` and any binary STL as `model.stl` into `legacy.bumpmesh`. The bone mallet (CADkz/projects/bone-mallet/bone-mallet.stl, 15,958 triangles) was used.
  2. Load Project → legacy.bumpmesh → Model + settings → Load.
  3. Expect "96 faces selected", Include Only active and the Crystal relief on those faces only. Before the fix the whole model stayed orange. Loading the same file again with Settings only must keep the 96 faces.
- Verified in the in-app browser by reading the preview mesh's `layerMask` attribute through a `__THREE_DEVTOOLS__` hook. Before: 0 on all 47,874 vertices. After: 1.0 on exactly faces 0–95 (288 vertices) after Model + settings and after a following Settings-only load.
- Fixed the same day: a Settings-only load of a layered project (settings.json with `layers`) cleared the current paint, because `_layersFromSnapshot` issued fresh ids and `_syncTreeLayers()` then removed the old slots. `_importLayers` (settings-only only) now gives imported layer i the id of current layer i. It also keeps that layer's Exclude/Include Only mode when masking was engaged, so the kept strokes keep their meaning. Current layers beyond the file's count are dropped with their paint (Undo brings them back), and extra imported layers start empty. Model + settings is unchanged. Browser repro on layered-gradient-cylinder.bumpmesh (192 triangles): with two Include Only layers of 48 and 144 faces, Settings only gave "0 faces masked" before and 48 / 144 Include Only after. A single 48-face layer stays 48 Include Only, with layer 2 new and empty. Model + settings still restores the file's 12-face strip and Undo returns to the single Crystal layer. The viewport looked plain grey after both load modes of this example in the embedded pane, with or without the fix, so the checks used the face counts and mode buttons.
- Also fixed the same day: that grey cylinder was real, not a hidden-pane artifact. In a visible pane the example still loaded plain grey in the default bump-only preview (3D Preview off), although both Local maps loaded (HTTP 200) and the preview material was correct. Cause: the file's 1 mm boundary falloff with 5° top/bottom angle limits. The cylinder's 96 side triangles run rim to rim, so every corner touches an angle-masked cap and computeBoundaryFalloff set it to 0. The shader's per-fragment edge pass only multiplies on top, so it could never bring the relief back. This is upstream behaviour since falloff was added, and it hits any coarse mesh with falloff > 0 (the default is 0). docs/gradient-preview.jpg was taken with 3D Preview on, which refines the mesh. Fix (js/main.js): computeBoundaryFalloff takes a `faceInteriors` flag, which updateFaceMask sets for every mesh except the 3D preview. With it, a textured face whose corners all lie on the boundary takes the falloff at its centroid. The 3D preview mesh keeps 0 at boundary corners because it displaces them; export (displacement.js) is untouched. Browser check: side-corner falloff went from 0 to 1.0 (layer 1) and 0.98 (layer 2; the rest is the masked strip). Relief shows right after Model + settings with no orbit. 3D Preview falloff is unchanged (0.985 / 0.977 on 292,398 vertices). npm test 25/25, test:paint 22/22 (neither covers main.js). A hidden in-app pane reports a 0×0 window and pauses requestAnimationFrame, so bring it to the front before judging the viewport.

## Header and support banner: October 16, 2026

- User asked to remove the "Support this tool? Shop at CNCKitchen.STORE…" banner at the bottom of the viewport and to show Kurt as the author in the header. Deleted the banner markup (index.html), its dismiss handler (js/main.js) and its styles (style.css). The header and page title now read "BumpMesh Local by Kurt". The welcome, license and imprint dialogs, the copyright headers and the GitHub source link still credit CNC Kitchen, as the AGPL requires. Unused `cta.*` strings stay in the upstream language files. Browser check: no banner, no console errors.

## 3D Preview fixes: October 16, 2026

- User: "3D preview never worked that well". Asked for three quick fixes: keep it on, light the displaced surface properly, remove the sparkle.
- Stays on (js/main.js): the checkbox is now a standing choice. Model and project loads, Rotate / Place on Face and Bake no longer untick it. A masking tool shows the flat mesh only while it is active. `_resumeDisplacementPreview()`, called at the end of updatePreview() and when a masking tool closes, rebuilds the preview one task later, so a load's several updatePreview() calls start one build. The choice also survives page reloads (localStorage `bumpmesh-3d-preview`). Only the user, a missing texture or a failed build untick it.
- Lighting (js/previewMaterial.js): the 3D preview used the flat face normal (the cylinder showed facet bands) plus a ⅓-strength screen-space bump. It now uses the base normal tilted by the composite height's surface gradient on the undisplaced surface (Mikkelsen's method), at the true slope. The base normal is the smooth normal where it stays within 30° of the face, otherwise the face normal: the subdivided mesh's `normal` is not split at hard edges (cube edge vertices carry the diagonal), so this keeps cube edges crisp. Measured on the example: all 213,204 side vertices use the smooth normal, all 1,344 rim vertices the face normal.
- Sparkle: this GPU (Intel UHD, ANGLE D3D11) evaluates dFdx/dFdy once per 2×2 pixel quad; a probe gave equal pairs and zero second derivatives. Blocky bump normals with a tight highlight lit single quads. bumpLayer now takes per-pixel forward differences one pixel step along the surface (two extra height samples per layer). Slopes are capped at 70° so sub-pixel height steps can't flip the normal. The flat preview keeps its ×3 exaggerated diffuse relief, but its highlights now use the true slope, which removed the glint on every bump.
- Browser checks (in-app pane): ticking survives a Model + settings load (rebuild 0.9 s), the brush tool (flat while active, rebuild 1.2 s after), an untick (stays off through a tool cycle) and a reload. Close-ups of the cylinder example are free of glint dots in both modes. Cube edges are crisp in 3D. No console errors. npm test 25/25, test:paint 22/22 (neither covers the shader or main.js).
- The D3D warning `X4000 use of potentially uninitialized variable (f_computeHeightAtPoint_int)` shows on every page load. It predates these changes: the pre-change shader, swapped in temporarily, logs it at the same lines.
- Not changed: preview resolution (edge ≥ refine length and ≤ maxDim/80, 1.5M predicted triangles), so silhouette detail is still limited by vertex spacing. An exact preview built from the export pipeline would be the next step if that matters.

## GitHub fork publication: October 17, 2026

- User authorized creating a personal fork and publishing the current upgrades. Fork: https://github.com/kazzurt/bumpmesh-local, parent CNCKitchen/stlTexturizer.
- Publish the existing local/kurtz-texture-library branch and use it as the fork's default branch, so visitors see this version. Preserve main as the copied upstream branch; do not merge newer upstream changes into this checkpoint.
- Remotes: origin is the personal fork; upstream is CNC Kitchen. The existing checkout and original media stay in place. Working logs, caches, node_modules, and raw STL/3MF files remain ignored. Include the synthetic gradient example and reproducible dependency/texture scripts.
- Prepublication verification: npm test 25/25, npm run test:paint 22/22, staged first-party diff whitespace check passed. Bundled third-party sources retain their original whitespace; their existing whitespace warnings are excluded from this check. First-party text scan found no credential-pattern matches. No browser retest was performed for this publication; previously recorded preview/import checks and limitations still apply.
- README now distinguishes this fork from upstream and links the local setup instructions. No pull request to CNC Kitchen is part of this publication.

## Next step

Use the gradient guide and editable cylinder example in the normal browser. Check a newly saved project's download/reopen, then print a small depth or center-grip sample before applying gradients to a final part. Preserve editable .bumpmesh projects alongside exported meshes. Continue from this local checkout on local/kurtz-texture-library. Commit and push subsequent changes to origin; preserve any uncommitted work before updating upstream.
