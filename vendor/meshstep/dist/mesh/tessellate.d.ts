import type { Vec3 } from "../geom/vec.ts";
import type { BrepModel, BLoop } from "../brep/build.ts";
import type { IndexedMesh } from "../io/stl.ts";
import type { Surface } from "../geom/surfaces.ts";
import { type MeshWarning } from "./diag.ts";
type P2 = [number, number];
export interface TessOptions {
    /** Max chord deviation (mm) for curve/surface sampling. */
    chordTol?: number;
    /** Target / maximum edge length (mm). */
    targetEdge?: number;
    /** Max normal turn across an edge (radians) — drives curvature-adaptive interior density. */
    normalDev?: number;
    /** Called once per face with the mesher that produced it ("grid", "band", "thinRing",
     * "untriangulated", …). Characterization hook: the fallback dispatch order is semantic, and this
     * makes "which mesher handled which face class" testable instead of tribal knowledge. */
    trace?: (faceId: number, mesher: string) => void;
    /** Progress hook: called after every work unit (edge sampled, face meshed, solid stitched) with
     * monotone counts. `total` is fixed up front, so done/total is a usable fraction — including for
     * assemblies, where every solid's faces are in the count. Callers throttle; this stays sync. */
    onProgress?: (done: number, total: number) => void;
    /** Attach the per-edge boundary polylines (part-local mm, post-densification) to the result.
     * These are the exact samplings the mesh was built from, so measurement/snap geometry derived
     * from them is coincident with rendered feature edges — resampling outside tessellate is not. */
    collectEdgePolylines?: boolean;
}
export interface MeshResult {
    mesh: IndexedMesh;
    faceOfTri: Uint32Array;
    /** STEP solid (body) id per triangle; bodies are welded independently and kept disjoint. */
    solidOfTri: Uint32Array;
    /** Ids of surface bodies built from OPEN_SHELLs: their boundary edges are open by design, so
     * watertightness checks must exclude their triangles rather than report defects. */
    openSolids: number[];
    stats: {
        solids: number;
        facesTotal: number;
        facesTessellated: number;
        skipped: Record<string, number>;
    };
    /** Structured findings from the rescue/fallback meshing paths (dropped/skipped faces, heuristic
     * fills, degenerate boundaries) — the per-face half of the import diagnostics. */
    warnings: MeshWarning[];
    /** Per-edge boundary polylines (part-local mm) when `collectEdgePolylines` was set. */
    edgePolylines?: Map<number, Vec3[]>;
}
/** The projected loop boundary. windU/windV: closure drift in whole periods on the universal cover
 * — non-zero means the loop WINDS the periodic surface (a bare rim), so it bounds no trimmed patch
 * and must go to the band/unroll meshers instead. tangled: the loop still self-intersects after the
 * phase-C repair (gates the tolerant-CDT path). */
interface LoopUV {
    p3: Vec3[];
    p2: P2[];
    windU: number;
    windV: number;
    tangled: boolean;
}
/** Project a boundary loop to (u,v). The proven whole-loop chained projection is the fast path,
 * kept bit-for-bit for every loop it handles cleanly. When its result SELF-INTERSECTS on a periodic
 * surface (a seam-tangled loop), the seam-aware machinery takes over: per-edge pcurves (phase A)
 * assembled on the universal cover (phase B), repaired over the bounded seam-representative choices
 * (phase C) — and the better of the two candidates is returned. expectSign is the loop's expected
 * winding sign in (u,v) (repair tiebreak; 0 = unknown). Exported for tests. */
export declare function loopParam(surface: Surface, loop: BLoop, sampled: Map<number, Vec3[]>, expectSign?: number): LoopUV;
export declare function tessellate(brep: BrepModel, opts?: TessOptions): MeshResult;
/** Weld coincident triangle-soup vertices into an indexed mesh (positions quantised to eps). */
export declare function weld(verts: number[], eps?: number): {
    mesh: IndexedMesh;
};
export {};
//# sourceMappingURL=tessellate.d.ts.map