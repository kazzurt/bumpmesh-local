# Layered gradient cylinder

Open `layered-gradient-cylinder.bumpmesh` using **Load project**, then choose **Model + settings**.

The editable 32 mm diameter, 64 mm tall cylinder uses your native Diamond Plate and Wave Interference maps. Diamond Plate gradually grows deeper from bottom to top. Wave Interference uses a center band that changes depth, projected texture size and opacity, revealing the first layer near the ends. A masked strip at the back also reveals the first layer. Flat end caps are protected by the existing angle controls.

Select either layer and open **Texture gradient** to change its axis, region, curve or endpoint values. Export a mesh when ready. Save a new `.bumpmesh` project to retain editable layers and masks.

The source cylinder is generated rather than taken from a user model. Its untextured mesh is bundled in the project. Native textures are referenced from this local installation. Reproduction recipe: `node scripts/generate-gradient-examples.mjs`; the companion validation README documents all settings.
