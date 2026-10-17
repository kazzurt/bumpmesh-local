import type { BrepModel } from "../brep/build.ts";
import type { IndexedMesh } from "../io/stl.ts";
import { type SurfaceInfo } from "../geom/surfaces.ts";
import type { Vec3 } from "../geom/vec.ts";
/** Normalized surface class, for filtering without STEP entity-name knowledge. */
export type FaceSurfaceType = "plane" | "cylinder" | "cone" | "sphere" | "torus" | "bspline" | "revolution" | "extrusion" | "offset" | "other";
export interface FaceInfo {
    /** B-rep face id — the values stored in `faceOfTri`. */
    faceId: number;
    /** Owning body id — the values stored in `solidOfTri`. */
    solidId: number;
    type: FaceSurfaceType;
    /** Analytic surface identity (raw STEP kind + origin/axis/radius/semiAngle, mm / radians).
     * Coordinates are in the PART-LOCAL frame: for a placed assembly occurrence, map them through
     * `instances[i].frame`. Swept/B-spline/facetted surfaces report only their kind. */
    surface: SurfaceInfo;
    /** Face area in mm², summed over one meshed copy of the face (assembly instances share it). */
    area: number;
    /** Area-weighted average of the face's triangle normals (unit length, part-local frame, pointing
     * out of the solid). Near-zero magnitude before normalization — e.g. a full cylinder whose
     * normals cancel — yields [0,0,0]. */
    meanNormal: Vec3;
    triangleCount: number;
}
/**
 * Collect per-face metadata from the tessellated mesh + the B-rep it came from. Runs on the
 * PRE-PLACEMENT mesh (part-local coordinates): area is rigid-invariant so it equals the placed
 * face's area, and `surface`/`meanNormal` are documented as part-local. Faces are enumerated from
 * `faceOfTri` so every meshing path is covered — faces of AP242 tessellated bodies (no analytic
 * surface) report kind "" / type "other".
 */
export declare function collectFaceInfo(mesh: IndexedMesh, faceOfTri: Uint32Array, solidOfTri: Uint32Array, brep: BrepModel): Map<number, FaceInfo>;
//# sourceMappingURL=face-info.d.ts.map