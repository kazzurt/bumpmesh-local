#!/usr/bin/env python3
"""Copy the local texture library unchanged and build its native gallery catalogue.

Run: python scripts/sync-textures.py [--source PATH] [--check]
Requires Pillow (python -m pip install Pillow). Source images and generators are
never changed or run. Re-running with the same inputs produces identical files.
Only PNG, JPEG, WebP and BMP files directly inside the source folder are included.
"""

import argparse
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
from urllib.parse import quote

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow is required. Install it with: python -m pip install Pillow")


REPO = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path(r"C:\Users\Kurtz\Documents\3D Printing\Textures")
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
LIBRARY = REPO / "textures" / "local-library"
CATALOGUE_JS = REPO / "js" / "localTexturePresets.js"

# Descriptive tags only: these do not assert provenance or printability.
TAGS = {
    "apollonian_gasket": ["fractal", "circles", "packing"],
    "chainmail": ["rings", "weave", "fabric"],
    "diamond_plate": ["industrial", "tread", "grip", "geometric"],
    "hilbert_curve": ["fractal", "maze", "ridge"],
    "lyapunov_fractal": ["fractal", "organic"],
    "moroccan_zellige": ["tiles", "star", "geometric"],
    "newton_fractal": ["fractal", "organic"],
    "organic_crack": ["cracks", "voronoi", "natural"],
    "pyramid_spikes": ["pyramid", "spikes", "grip", "geometric"],
    "pyramid_spikes_sharp": ["pyramid", "spikes", "sharp", "grip", "geometric"],
    "reaction_diffusion": ["organic", "coral", "spots"],
    "scales": ["scales", "natural"],
    "sierpinski_carpet": ["fractal", "grid", "geometric"],
    "wave_interference": ["waves", "ripples", "organic"],
}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def edge_check(image):
    """Match the source generators' edge-gradient heuristic; not a seam guarantee.

    Opposite edges in a sampled periodic function need not be equal. The wrap
    gradient should be comparable to the largest adjacent interior gradient.
    Work on decoded 8-bit luminance, as the app does for its heightmap.
    """
    image = image.convert("L")
    w, h = image.size
    if w < 2 or h < 2:
        return {"status": "unavailable", "reason": "Image needs at least 2 pixels per side."}
    pixels = list(image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata())
    seam_x = max(abs(pixels[y * w] - pixels[y * w + w - 1]) for y in range(h))
    seam_y = max(abs(pixels[x] - pixels[(h - 1) * w + x]) for x in range(w))
    interior_x = max(abs(pixels[y * w + x] - pixels[y * w + x - 1])
                     for y in range(h) for x in range(1, w))
    interior_y = max(abs(pixels[y * w + x] - pixels[(y - 1) * w + x])
                     for y in range(1, h) for x in range(w))
    passed = seam_x <= interior_x * 1.1 and seam_y <= interior_y * 1.1
    return {
        "status": "pass" if passed else "review",
        "seamMaxX": seam_x, "seamMaxY": seam_y,
        "interiorMaxX": interior_x, "interiorMaxY": interior_y,
        "method": "max wrap gradient <= 1.1 * max interior gradient (8-bit luminance)",
    }


def thumbnail_bytes(image):
    thumbnail = image.convert("RGB")
    thumbnail.thumbnail((128, 128), Image.Resampling.LANCZOS)
    result = io.BytesIO()
    thumbnail.save(result, format="WEBP", quality=85, method=6)
    return result.getvalue()


def build_catalogue(source):
    files = sorted((p for p in source.iterdir()
                    if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS),
                   key=lambda p: p.name.casefold())
    if not files:
        raise ValueError(f"No supported image files found in {source}")
    entries = []
    generated = {}
    sources = {}
    for path in files:
        raw = path.read_bytes()
        with Image.open(io.BytesIO(raw)) as image:
            image.load()
            w, h = image.size
            if not w or not h:
                raise ValueError(f"Image has no size: {path}")
            thumb = thumbnail_bytes(image)
            tiling = edge_check(image)
            source_mode = image.mode
        thumb_name = path.name + ".webp"
        name = "Local: " + path.stem.replace("_", " ").replace("-", " ").title()
        entry = {
            "id": "local:" + path.name,
            "name": name,
            "url": "textures/local-library/maps/" + quote(path.name, safe=""),
            "thumb": "textures/local-library/thumbs/" + quote(thumb_name, safe=""),
            "defaultScale": 0.5,
            "category": "local",
            "credit": "local",
            "filename": path.name,
            "width": w, "height": h,
            "sourceMode": source_mode,
            "sourceSha256": sha256(raw),
            "keywords": TAGS.get(path.stem.lower(), []),
            "tiling": tiling,
        }
        entries.append(entry)
        generated[LIBRARY / "maps" / path.name] = raw
        sources[LIBRARY / "maps" / path.name] = path
        generated[LIBRARY / "thumbs" / thumb_name] = thumb
    names = [entry["name"] for entry in entries]
    if len(set(names)) != len(names):
        raise ValueError("Two source images produce the same gallery name; rename one source file.")
    metadata = {
        "sourceFolder": str(source),
        "count": len(entries),
        "originalsCopiedUnchanged": True,
        "thumbnailRecipe": "Pillow RGB conversion, fit 128x128 LANCZOS, WebP quality=85 method=6",
        "edgeCheckCaveat": "A numerical screening heuristic, not a guarantee of seamless tiling or printability.",
        "textures": entries,
    }
    generated[LIBRARY / "manifest.json"] = (json.dumps(metadata, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    js = ("// Generated by scripts/sync-textures.py. Edit the source folder and re-run the sync.\n"
          "// Appended to the upstream presets: existing preset indices stay unchanged.\n"
          "export const LOCAL_TEXTURE_PRESETS = " + json.dumps(entries, indent=2, ensure_ascii=False) + ";\n")
    generated[CATALOGUE_JS] = js.encode("utf-8")
    return entries, generated, sources


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--check", action="store_true", help="Verify current copied maps, thumbnails and catalogue without changing files.")
    args = parser.parse_args()
    source = args.source.expanduser().resolve()
    if not source.is_dir():
        parser.error(f"Source folder does not exist: {source}")
    try:
        entries, generated, sources = build_catalogue(source)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    changed = [path for path, data in generated.items()
               if not path.is_file() or path.read_bytes() != data]
    if args.check:
        if changed:
            for path in changed:
                print(f"Needs sync: {path.relative_to(REPO)}")
            return 1
    else:
        for path in changed:
            path.parent.mkdir(parents=True, exist_ok=True)
            if path in sources:
                shutil.copy2(sources[path], path)
            else:
                path.write_bytes(generated[path])
        # Old copied assets remain available to existing project recipes; only
        # the current source folder's entries are exposed in the catalogue.
    review = [entry["filename"] for entry in entries if entry["tiling"]["status"] != "pass"]
    print(f"{'Verified' if args.check else 'Synced'} {len(entries)} local textures; {len(changed)} files {'differ' if args.check else 'updated'}.")
    print(f"Source originals unchanged. Edge screening: {len(entries) - len(review)} pass, {len(review)} need review.")
    if review:
        print("Review tiling on a repeated surface: " + ", ".join(review))
    return 0


if __name__ == "__main__":
    sys.exit(main())
