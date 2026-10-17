import type { Vec3 } from "../geom/vec.ts";
import { Table } from "../step/entities.ts";
import { type Units } from "../step/units.ts";
import { type Frame } from "../geom/placement.ts";
export interface BEdge {
    v0: Vec3;
    v1: Vec3;
    curveId: number;
    sameSense: boolean;
    /** mm per unit for this edge's curve geometry, when its solid's representation context differs
     * from the file-global unit. Samplers must use this over the global scale. */
    scale?: number;
}
export interface OrientedEdge {
    edgeId: number;
    /** True if the loop traverses the edge in its v0->v1 direction. */
    orient: boolean;
}
export interface BLoop {
    outer: boolean;
    edges: OrientedEdge[];
}
export interface BFace {
    faceId: number;
    surfaceId: number;
    surfaceKind: string;
    /** ADVANCED_FACE.same_sense: true if the face normal agrees with the surface normal. */
    sameSense: boolean;
    loops: BLoop[];
}
export interface BSolid {
    id: number;
    faces: BFace[];
    /** World placement from the STEP assembly tree (identity for a single part). Applied to the final
     * mesh AFTER tessellation/remesh, since the analytic surfaces stay in each part's local frame.
     * Equal to instances[0] when the part occurs in the assembly. */
    transform?: Frame;
    /** ALL world placements of this part (one per assembly occurrence). A part used N times in the
     * assembly is meshed once and replicated at each frame; absent = single occurrence at identity. */
    instances?: Frame[];
    /** mm per length unit of this solid's own representation context, when it differs from the
     * file-global unit (Inventor mixes plain-METRE part reps into a millimetre assembly). Geometry
     * readers must use this over the global scale for the solid's points/curves/surfaces. */
    scale?: number;
    /** True for a surface body built from OPEN_SHELLs (a SHELL_BASED_SURFACE_MODEL): its boundary
     * edges are open BY DESIGN, so watertightness accounting must not count them as defects. */
    open?: boolean;
}
export interface BrepModel {
    solids: BSolid[];
    edges: Map<number, BEdge>;
    units: Units;
    table: Table;
    scale: number;
    /** Face entity ids dropped during construction (malformed records) — geometry that is missing
     * from the model entirely; surfaced to consumers via the import diagnostics. */
    droppedFaces: number[];
}
export declare function buildBrep(src: string): BrepModel;
//# sourceMappingURL=build.d.ts.map