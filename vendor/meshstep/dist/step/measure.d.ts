import { type BrepModel } from "../brep/build.ts";
export interface SizeEstimate {
    /** Approximate axis-aligned bbox in mm: [minX,minY,minZ, maxX,maxY,maxZ]. */
    bbox: [number, number, number, number, number, number];
    /** Bbox diagonal, mm — the "model size" the auto defaults scale with. */
    diag: number;
    /** Detected length-unit label (e.g. "mm", "inch"). */
    units: string;
}
/** Estimate a STEP model's size without tessellating (B-rep topology only). Null when the file
 * yields no measurable topology (e.g. pure AP242 tessellated geometry) or does not parse. */
export declare function estimateStepSize(src: string): SizeEstimate | null;
/** Same estimate for an already-built B-rep (no re-parse) — the safe way to derive scale-relative
 * tessellation tolerances from a brep in hand. Never measure edge ENDPOINTS yourself: a closed
 * circle's two vertices coincide, so a lone cylinder's whole diameter is invisible to an
 * endpoint bbox, and a fully edge-less solid (bare torus/sphere body) has no endpoints at all —
 * tolerances derived that way come out orders of magnitude too fine. */
export declare function estimateBrepSize(brep: BrepModel): SizeEstimate | null;
/**
 * Size-adaptive tessellation defaults, anchored so a ~100 mm part gets the library defaults
 * (0.01 mm surface deviation, 1 mm max edge). Max edge scales linearly with model size, but
 * surface deviation scales linearly below that anchor but only doubles per decade above it
 * (100 mm → 0.01, 1000 mm → 0.02): chord error is an absolute surface-quality budget, so
 * letting it grow 10× on metre-scale parts visibly facets them. Clamps keep tiny models from
 * demanding sub-micron chords.
 */
export declare function autoTessellation(diagMm: number): {
    surfaceDeviation: number;
    maxEdge: number;
};
//# sourceMappingURL=measure.d.ts.map