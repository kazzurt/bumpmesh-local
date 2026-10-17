# Texture gradients

Implemented in BumpMesh Local 1.4.0-local.2, based on upstream v1.4.0. The current upgrade is limited to spatial texture gradients.

## Use a gradient

1. Load a model and choose a texture. Select the layer you want to change.
2. Under **Texture gradient**, click a preset or enable the layer's gradient.
3. Choose X, Y or Z, **End-to-end** or **Center band**, and Smooth or Linear.
4. Set **From / To** to the desired percentage of the model's extent on that axis.
5. Adjust depth, pattern size and blend in the two columns. Use **3D Preview** to inspect displaced geometry; export STL or 3MF for the printable mesh.

Each layer has independent settings. Gradients use the original model coordinates, before displacement. Rotating the model changes the model axes; gradients are anchored to its current bounds. In an end-to-end ramp, values outside the chosen region stay at the nearest endpoint. In a center band, the Edges value applies outside the region and at both edges; Center applies halfway through it. Smooth eases both ends; Linear follows a straight ramp.

| Preset | Result |
| --- | --- |
| Fade in | Depth grows from 0% to 100%. |
| Fade out | Depth decreases from 100% to 0%. |
| Center grip | Depth rises toward the center and fades toward both ends. |
| Grow pattern | Projected size grows from 50% to 200%, with depth held constant. |
| Crossfade | Blend grows from 0% to 100%, with depth held constant. |

Presets retain the selected axis and reset other gradient fields to deterministic values. Swap reverses the two endpoint values, or the edge/center values in a band.

## What the percentages mean

**Depth** multiplies the existing Texture height: a 0.4 mm layer at 50% gives 0.2 mm relief. Its range is 0–200%. Reverse direction and symmetric displacement continue to work.

**Pattern size** multiplies both base U and V scales, preserving their ratio. Its range is 25–400%. This is a continuous stretch of the projected UV pattern; the displayed U tile values are projection parameters, not a guarantee of exact local physical pitch. Varying size on cylindrical or spherical wraps can introduce seams even when base-scale seamless snapping is on. Depth and blend gradients leave the UV wrap unchanged.

**Blend** controls layer coverage, from 0–100%. A Cover layer at 0% reveals the lower texture, while 100% replaces it in the selected region. Intermediate values crossfade both reliefs. An Add layer scales its added relief instead. Depth 0% can still cover a lower layer with a flat surface; use Blend 0% to reveal the layer below. Existing paint, angle and boundary-falloff masks multiply coverage.

The profile chart uses a shared percentage scale for its three lines and spans the full model axis. The endpoint fields remain the authoritative numeric values. Smart resolution considers the active gradient's smallest projected scale and largest depth; its existing active-layer scope remains unchanged.

## Editable example and preservation

Load `examples/gradient-textures/layered-gradient-cylinder.bumpmesh` and choose **Model + settings**. It contains a generated 32 × 64 mm cylinder, Diamond Plate depth ramp, Wave Interference center band, and a rear mask strip. Select either layer to experiment. Save a new project to retain editable settings and masks; mesh export bakes the relief.

Regenerate the example and compatibility fixtures with:

```powershell
node scripts/generate-gradient-examples.mjs
```

The generator uses pinned dependencies, references the original native maps, and checks source mesh closedness, ZIP settings and paint-tree round trips. It writes validation materials under `bumpmesh-local-working/gradient-validation/` and the editable example under `examples/gradient-textures/`. No original texture or user model is changed.

Gradients participate in layer switching, Undo/Redo, session settings and `.bumpmesh` settings. Older projects with missing gradient fields explicitly disable the feature. Disabled gradients preserve legacy CPU export coordinates byte for byte. New project fields are ignored by older upstream readers, so gradient projects should be opened in this upgraded local copy.

## Verification

25 Node tests and 22 adaptive paint-tree checks pass. Gradient tests exercise axes, ramps/bands, degenerate bounds, malformed settings, all seven projections, independent layers, Cover/Add, soft paint/angle/falloff combinations, disabled legacy parity and finite closed meshes through decimation/repair. `test-texture-gradient.html` also passes through the actual browser export worker and structured-clone boundary.

Browser checks cover numeric field commits, layer switching, two- and four-layer GPU previews, complete example import with masks, Undo/Redo, legacy-layered settings import resetting both gradients, and gradient settings surviving reload. The shader now compiles without new warnings or errors in the tested Windows in-app browser. Project Save was executed; its download event was unavailable in that browser, so a newly saved project's download/reopen needs a check in the normal browser. No physical print test has been run.
