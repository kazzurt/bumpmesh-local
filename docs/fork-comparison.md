# BumpMesh base and community branch comparison

Audit date: **October 3, 2026** (America/Los_Angeles). Statuses are a snapshot from live GitHub connector/API reads, not a guarantee of future branch state.

## Decision

Use **CNCKitchen/stlTexturizer upstream `main`, v1.4.0**, pinned to [`ee02c390484d7d47c9023470380cba9a58f88299`](https://github.com/CNCKitchen/stlTexturizer/commit/ee02c390484d7d47c9023470380cba9a58f88299), released September 30. It already includes four texture layers, 96 built-in textures, a searchable texture gallery, STEP import, project persistence, undo/redo, and recent mesh/pipeline fixes. Build local additions on this revision, retaining upstream attribution and license.

The [layer implementation](https://github.com/CNCKitchen/stlTexturizer/commit/e4a9e694b02f12dc212493ef625410afa7b5ddb8) gives each layer its own texture, projection, size, height and painted surface. Later layers can cover or add to lower layers; CPU export and GPU preview implement the same compositing. This directly supplies the requested multiple-texture foundation.

## Scope and verification

- Read the current upstream README and all **58 pull requests** returned by the repository's all-state PR collection.
- Compared all upstream branches. `develop` has zero unique commits and is 179 commits behind `main`; `cloudflare/workers-autoconfig` addresses deployment.
- Examined relevant feature branches, prominent forks and all **11 forks** returned by repository search for push activity since September 1. Ten default branches were identical to or behind upstream. The sole divergent default branch had one `index.html` change and was 57 commits behind.
- Checked the independent Elliacness/BumpMesh copy, including its source and feature commits. It describes itself as a fork but is not registered in GitHub's fork network.
- Checked live PR metadata, comparisons and maintainer comments where available. A cached web PR index still showed September 29 closures as open; the live connector corrected those states.
- This is a targeted starting-point audit, not an exhaustive code review of every fork or independent validation of authors' benchmark/test claims.

## Relevant branches and copies

| Source | Verified status and contribution | Use for this project |
| --- | --- | --- |
| [Elliacness/BumpMesh](https://github.com/Elliacness/BumpMesh) | Last push May 30. [Eight texture zones](https://github.com/Elliacness/BumpMesh/commit/605a52784e1c8f9f8e095f4a18cef8a342ddfbfc), [filament appearance, FDM layer simulation, displacement antialiasing and a launcher](https://github.com/Elliacness/BumpMesh/commit/53b0f2e6a0f11e899f2e3b3dedac9798ba06ae2c). Source stores per-zone maps/faces but shares projection, scale and height settings; its README lists 24 textures and no STEP. | Strong idea donor. Current upstream layers have more independent controls and months of subsequent fixes. Do not replace the base with this copy. |
| [0xMDIV/add-custom-map-repos, PR #26](https://github.com/CNCKitchen/stlTexturizer/pull/26) | Multi-upload, thumbnails and public GitHub texture-repository loading. Closed unmerged September 29; 190 commits behind current main. [Maintainer says gallery changes now conflict across most touched files](https://github.com/CNCKitchen/stlTexturizer/pull/26#issuecomment-5895527465). | Reimplement persistent local-folder indexing against today's gallery. Old session-only picker is unsuitable as the base. |
| [0xMDIV/custom-map-temp-view, PR #25](https://github.com/CNCKitchen/stlTexturizer/pull/25) | Multiple uploaded maps and custom thumbnails. Closed unmerged September 29 because the new gallery conflicts with its UI changes. | Useful historical design context; avoid merging its old picker. |
| [Snail3D/fix/texture-resolution, PR #118](https://github.com/CNCKitchen/stlTexturizer/pull/118) | Configurable 1K-8K image loading. Closed unmerged September 27; 57 commits behind. [Equivalent improvement added in upstream v1.3.1](https://github.com/CNCKitchen/stlTexturizer/pull/118#issuecomment-5858503106). | Already addressed upstream; do not use as base. |
| [alan-polk/feature_fixed-world-texture-scale, PR #42](https://github.com/CNCKitchen/stlTexturizer/pull/42) | Consistent millimeter-based pattern scale across parts. Merged July 23. | Already available upstream. |
| [alan-polk/Profile-Feature, PR #22](https://github.com/CNCKitchen/stlTexturizer/pull/22) | Settings profiles with custom textures. Closed unmerged; [maintainer points to upstream implementation](https://github.com/CNCKitchen/stlTexturizer/pull/22#issuecomment-4319576584). | Current project persistence provides the existing foundation; assess reusable layer-stack presets as a new addition. |

## Ranked future upgrades with community starting points

1. **Persistent local texture catalogue and fully offline operation.** Index the user's texture directory, generate thumbnails/search categories, reference originals in place, and provide refresh/rescan controls. Bundle browser dependencies locally and add a Windows launcher. PR #26 provides the batch-import idea, but its old UI should not be imported wholesale.
2. **Layer workflow controls.** Names, duplicate/reorder, reusable layer-stack presets, and clearer previews of overlapping layers. Build directly on upstream v1.4.0; its four samplers are a real GPU implementation limit that needs deliberate redesign before increasing layer count.
3. **Filament and FDM layer preview.** Port the visual concepts from [Elliacness commit 53b0f2e6](https://github.com/Elliacness/BumpMesh/commit/53b0f2e6a0f11e899f2e3b3dedac9798ba06ae2c). Treat these as appearance estimates, not slicer output.
4. **Preserve 3MF parts and extruder assignments.** [jcarranz97/feat/3mf-color-preservation, PR #111](https://github.com/CNCKitchen/stlTexturizer/pull/111), head `b98edce5a25fd6083703ddfaefb08c0d6938ff56`, carries part/color/tool data through subdivision, decimation and export. Open and conflicting with current main. Particularly valuable for Bambu/Orca multipart jobs; adapt and verify round trips with current layers.
5. **Explicit RAM budget and reliable large exports.** [Dgmtnz/feat/memory-budget-ceiling, PR #115](https://github.com/CNCKitchen/stlTexturizer/pull/115), head `c737614c4dba11f7eacd31db9e0af5e8eea55418`, derives subdivision caps from a user budget and adds allocation rollback. Open and conflicting. Related [edge-key precision #113](https://github.com/CNCKitchen/stlTexturizer/pull/113) and [pipeline memory #114](https://github.com/CNCKitchen/stlTexturizer/pull/114) have already merged. The author notes single-machine measurements and untested defensive rollback; stress-test before adoption.
6. **Smaller exports with bounded geometric error.** [vertti/bounded-export-refinement, PR #129](https://github.com/CNCKitchen/stlTexturizer/pull/129), head `5e948e24731a233d0671f2665896bab5fb3af13f`, proposes final simplification with a 0.005 mm surface bound, time budget and fallback. Open and conflicting. Validate textured seams and dimensional accuracy on actual print models.
7. **Optional multicolor relief.** [birnam/multicolor-painted, PR #121](https://github.com/CNCKitchen/stlTexturizer/pull/121), head `2d622a4ac9054369799e04fb4454eaeba773c20c`, maps heightmap levels to slicer filament assignments and protects color boundaries during decimation. Open and conflicting. Requires layer-aware sampling and slicer compatibility checks.
8. **Batch/headless automation or slicer integration.** [urib94/feat/mcp-server, PR #99](https://github.com/CNCKitchen/stlTexturizer/pull/99), head `66d30207cc1f28cb0a48a8529f66ee9a45867168`, exposes local geometry tools using shared app modules. [WeLizard/orcaslicer-plugin, PR #112](https://github.com/CNCKitchen/stlTexturizer/pull/112), head `5f5a6a28602333bc2b6c9f87d2b4c3bae0c4a0fc`, is recently maintained against v1.3.7 and reports Windows tests with Orca 2.5.0-dev. Both are open and conflicting. Orca integration creates a new object without copying paint/modifiers/settings and still loads runtime dependencies from a CDN; rebase to v1.4.0 and remove network dependencies before local/offline adoption.

## Next review

Keep the pinned upstream revision as a reproducible baseline. Implement and verify the local catalogue/launcher first, then select future geometry or slicer changes against representative user models. Recheck PR state and branches before any future port; several attractive ideas have already been implemented differently upstream.
