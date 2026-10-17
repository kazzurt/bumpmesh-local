import { type Surface } from "../geom/surfaces.ts";
import type { IndexedMesh } from "../io/stl.ts";
export interface RemeshOptions {
    /** Max chord deviation from the true surface (mm). */
    surfaceDev: number;
    /** Max normal turn across an edge (radians). */
    normalDev: number;
    /** Max edge length (mm). */
    maxEdge: number;
    iterations?: number;
    /** Triangle budget — refinement stops past this (default 800k). */
    maxTris?: number;
}
/** Curvature-adaptive isotropic remesh in place; returns a fresh mesh + per-triangle face id. */
export declare function remesh(mesh: IndexedMesh, faceOfTri: Uint32Array, surf: Map<number, Surface | null>, opts: RemeshOptions): {
    mesh: IndexedMesh;
    faceOfTri: Uint32Array;
};
//# sourceMappingURL=remesh.d.ts.map