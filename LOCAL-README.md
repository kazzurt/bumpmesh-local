# BumpMesh Local

Local editable copy of CNC Kitchen's BumpMesh, based on upstream v1.4.0 (`ee02c390484d7d47c9023470380cba9a58f88299`, September 30, 2026). Source: https://github.com/CNCKitchen/stlTexturizer. Local development branch: `local/kurtz-texture-library`.

## Launch

Double-click **Start-BumpMesh.cmd** in this folder. It starts a hidden local server and opens your normal browser at http://127.0.0.1:8765. Node.js is already installed on this machine. Use **Stop-BumpMesh.cmd** when finished. You can also run `npm start` in a terminal and stop it with Ctrl+C. Keep the same address and browser for saved favorites, settings and uploaded textures.

The app binds only to this computer's loopback address. It serves the app files with caching disabled, so upgrades show up after a refresh. Three.js, fflate and meshStep are included in `vendor/`; normal use, including STEP import, requires no CDN connection. The full local module graph is checked automatically; a disconnected-network STEP-file trial remains unverified. Attribution/store/source links still open online destinations when clicked. No cloud backend or build step is required to run this copy.

## Multiple textures

Upstream v1.4.0 already supports **four independent layers**. Each layer has its own texture, mapping, size, height and surface mask.

1. Load a model, then choose a texture for the first layer.
2. Click **Add layer**. The new layer starts empty in **Include Only** mode.
3. Choose another texture, then use **Fill** or **Brush** on the model to select the surfaces it should cover.
4. **Cover** replaces relief from lower layers in the selected region; click it to change to **Add** and combine heights. Click a layer to edit it, or use its eye button to hide it.
5. **Save Project** preserves model, layers, masks and settings in `.bumpmesh`. **Export STL / 3MF** creates the printable displaced mesh.

For texture overlap across the whole model, use Exclude mode with no masked faces on the additional layer. For different textures on different faces, leave Include Only enabled and fill or paint the region. The four-layer limit applies to simultaneously editable layers; Bake Textures flattens relief into geometry and should be saved as a separate project before further editing.

## Texture gradients

Select a layer and use **Texture gradient** beneath Texture Depth. Fade in/out, Center grip, Grow pattern and Crossfade presets vary depth, projected pattern size or blend along X/Y/Z. Each layer has its own region, curve and endpoint percentages. Controls update the preview and exported mesh, and participate in Undo/Redo and saved settings. Old projects start with gradients disabled.

Try `examples/gradient-textures/layered-gradient-cylinder.bumpmesh` with **Load Project → Model + settings**. See [the gradient guide](docs/texture-gradients.md) for examples, percentage meanings and reproduction instructions. Pattern-size gradients stretch the projected texture and may create wrapped seams.

## Local texture library

The gallery now includes **110 presets: 96 upstream + 14 local maps**. Filter **Local library**, search by names/filenames/tags, and star favorites. Originals remain at `C:\Users\Kurtz\Documents\3D Printing\Textures`. The app uses byte-identical copied maps and generated 128px thumbnails in `textures/local-library/`, so it remains usable if the original folder is temporarily unavailable.

After adding or changing images in the original folder, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-textures.ps1
```

Then refresh the app. Verify instead of modifying with `-Check`; choose another source folder with `-Source 'C:\path\to\textures'`. Sync needs Python and Pillow, both available on this machine. The manifest stores source hashes, dimensions and a seam screening result. All 14 current maps pass that heuristic; it does not guarantee visual seamlessness at every scale/projection. PNG/JPG/JPEG/WebP/BMP inputs directly in the source folder are supported by the sync script. Original generator scripts are left in place and were not run.

## Editing and upgrading

The app stays plain JavaScript with ES modules; retain that architecture for small extensions. The `origin` remote points to your fork at https://github.com/kazzurt/bumpmesh-local; `upstream` points to CNC Kitchen. Work on `local/kurtz-texture-library`, commit changes, and use `git push` to back them up to the fork. Review upstream changes before merging because they can conflict with the gallery, preview or import map. See `docs/fork-comparison.md` for the branch audit and `docs/upgrade-roadmap.md` for recommended next work.

Pinned dependencies are in package.json/package-lock.json. To recreate their local copies:

```powershell
npm ci --ignore-scripts --cache .npm-cache
npm run vendor
npm test
npm run test:paint
```

The app and meshStep retain their AGPL-3.0-only licensing and attribution. Three.js and fflate retain MIT licenses. Original texture license information is preserved; no new license was assumed for your maps.

## Verification

All 25 Node tests (including 13 gradient tests) and 22 adaptive paint-tree checks passed. Browser testing confirmed the local gallery, layered gradient project import, numeric edits, Undo/Redo, and two/four-layer GPU previews. The browser gradient worker smoke test passes with finite closed meshes through decimation and repair. The actual layered STL pipeline produced 644,354 triangles and reported 0 open edges, 0 non-manifold edges and 0 slivers. The embedded browser did not expose a project-save download event, so project download/reopen needs a check in the normal browser opened by the launcher. See docs/project-notes.md for final verification details and limitations.
