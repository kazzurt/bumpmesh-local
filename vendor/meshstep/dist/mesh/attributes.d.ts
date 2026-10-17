import type { BrepModel } from "../brep/build.ts";
import type { IndexedMesh } from "../io/stl.ts";
export interface FaceUV {
    /** B-rep face id — the values stored in `faceOfTri`. */
    faceId: number;
    /** Observed (u,v) range over the face's corners, after seam unwrapping — the box to normalize
     * against when mapping a texture onto this face. */
    uRange: [number, number];
    vRange: [number, number];
    /** Parameter period when the surface wraps in that direction (2π for analytic surfaces, knot
     * span for closed B-splines); undefined on non-periodic directions. */
    uPeriod?: number;
    vPeriod?: number;
}
export interface SurfaceAttributes {
    /** Unit per-vertex normals (3 per vertex, aligned with mesh.positions), analytic where the
     * vertex lies on its faces' surfaces, faceted elsewhere. Present when `normals` was requested. */
    normals?: Float32Array;
    /** Parameter-space (u,v) per triangle corner (2 per corner, aligned with mesh.indices), in the
     * face surface's own parameterization (mm for planes/extrusions, radians on periodic axes).
     * NaN for corners that don't lie on an analytic surface. Present when `uvs` was requested. */
    uv?: Float32Array;
    /** Per-face parameter ranges/periods for the faces that produced UVs, keyed like faceOfTri. */
    faceUV?: Map<number, FaceUV>;
}
export declare function computeSurfaceAttributes(mesh: IndexedMesh, faceOfTri: Uint32Array, brep: BrepModel, want: {
    normals?: boolean;
    uvs?: boolean;
}, 
/** Max |surface(u,v) − vertex| for the projection to count as on-surface, mm. */
tol: number): SurfaceAttributes;
//# sourceMappingURL=attributes.d.ts.map