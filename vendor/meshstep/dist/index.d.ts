import { type MeshResult, type TessOptions } from "./mesh/tessellate.ts";
import type { Frame } from "./geom/placement.ts";
import { type ImportDiagnostics } from "./mesh/diag.ts";
import { type ModelColors } from "./step/styles.ts";
import { type PartNode } from "./step/structure.ts";
import { type MeasureGeometry } from "./brep/measure-geometry.ts";
import { type FaceInfo } from "./mesh/face-info.ts";
import { type FaceUV } from "./mesh/attributes.ts";
/** One placed occurrence of a solid in the assembly. A part used N times is one solid id with N
 * instances; `instanceOfTri` maps every triangle of the final mesh to its entry in this list. */
export interface SolidInstance {
    /** Body id — same ids as solidOfTri / PartBody.id. */
    solidId: number;
    /** Occurrence index within the solid's placement list — matches MeasureFace/MeasureEdge.instance. */
    instance: number;
    /** Placement applied to this occurrence's vertices (null = meshed in place, identity). */
    frame: Frame | null;
}
export { writeBinarySTL, readSTL, isBinarySTL, indexSoup, type IndexedMesh, type TriSoup } from "./io/stl.ts";
export { read3MF, type ThreeMFModel, type ThreeMFItem, type RGB3MF } from "./io/threemf.ts";
export { parseStepHeader, type StepHeader } from "./step/header.ts";
export type { MeshResult, TessOptions } from "./mesh/tessellate.ts";
export type { BrepModel } from "./brep/build.ts";
export { meshDefects, type ImportDiagnostics, type MeshWarning, type WarningCode, type WarningSeverity, type EdgeDefects } from "./mesh/diag.ts";
export { extractColors, type ModelColors, type RGB } from "./step/styles.ts";
export { extractStructure, type PartNode, type PartBody } from "./step/structure.ts";
export { estimateStepSize, estimateBrepSize, autoTessellation, type SizeEstimate } from "./step/measure.ts";
export type { FaceInfo, FaceSurfaceType } from "./mesh/face-info.ts";
export type { SurfaceInfo } from "./geom/surfaces.ts";
export type { FaceUV, SurfaceAttributes } from "./mesh/attributes.ts";
export type { MeasureGeometry, MeasureEdge, MeasureFace } from "./brep/measure-geometry.ts";
export interface ImportProgress {
    /** "parse" fires once before the B-rep build (duration unknown → indeterminate UI);
     * "tessellate" advances per work unit (edges + faces + solids, so assemblies progress per part);
     * "finalize" fires once before orientation / assembly placement / the diagnostics audit. */
    phase: "parse" | "tessellate" | "finalize";
    /** Work units completed / total. Both are 0 for phases without a known total. */
    done: number;
    total: number;
}
export interface ImportOptions {
    /** Progress hook for long imports. Called synchronously and often (once per tessellation work
     * unit) — keep it cheap and throttle any UI updates on the consumer side. */
    onProgress?: (p: ImportProgress) => void;
    /** Run the curvature-adaptive isotropic remesh (default false). The raw tessellation is already
     * watertight, curvature-adaptive and ruling-aligned on fillets; the isotropic pass predates that
     * pipeline and now measurably degrades it (destroys the aligned diagonals, adds normal noise,
     * +5% triangles, +30% time). Kept as an option for uniform-triangle output (e.g. simulation). */
    remesh?: boolean;
    /** Max chord deviation from the true surface, mm (Fusion "Surface Deviation"). Default 0.01. */
    surfaceDeviation?: number;
    /** Max angle between adjacent normals, degrees (Fusion "Normal Deviation"). Default 15. */
    normalDeviation?: number;
    /** Max edge length, mm (Fusion "Maximum Edge Length"). Default 1. */
    maxEdge?: number;
    remeshIterations?: number;
    /** Diagnostic hook: called once per B-rep face with the mesher that produced it. */
    trace?: TessOptions["trace"];
    /** Also collect per-edge/per-face analytic measurement geometry (exact circle centers/radii,
     * boundary polylines coincident with the mesh) into `ImportResult.measure` (default false). */
    measureGeometry?: boolean;
    /** Cooperative cancellation: when the signal aborts, the import throws `signal.reason` (a
     * DOMException "AbortError" by default) at the next work-unit boundary — one edge/face of
     * latency. The synchronous import cannot be preempted mid-face; worker termination remains the
     * hard-stop fallback for a pathological single face. */
    signal?: AbortSignal;
    /** Compute exact per-vertex normals from the B-rep surfaces into `ImportResult.normals`
     * (default false). Curved faces get the true surface normal at every vertex instead of a
     * faceted average — displacement/shading along them shows no tessellation banding. */
    vertexNormals?: boolean;
    /** Export parameter-space (u,v) per triangle corner into `ImportResult.uv` + per-face ranges
     * into `ImportResult.faceUV` (default false). Lets a consumer map textures in each CAD face's
     * own parameterization (e.g. seamlessly around a cylinder) instead of projecting externally. */
    parameterUVs?: boolean;
}
export interface ImportResult extends MeshResult {
    /** Conversion verdict: check `diagnostics.ok` before trusting the mesh; when false, the
     * warnings/counters say whether geometry is missing or leaking (advise the user to export a
     * mesh directly from CAD) or merely heuristically repaired (advise checking the preview). */
    diagnostics: ImportDiagnostics;
    /** Length-unit label detected in the STEP file (e.g. "mm", "inch"); all mesh coordinates are in mm. */
    units: string;
    /** STEP presentation colors (STYLED_ITEM chains), or null when the file has none. Palette-indexed
     * per face/solid with the same ids as faceOfTri/solidOfTri — `palette[faceColor.get(faceOfTri[t])]`
     * is triangle t's sRGB color, and faces sharing a palette index form one color group. */
    colors: ModelColors | null;
    /** Part/component tree from the STEP product structure. The root is the top product (or the
     * single part); each node's `bodies[].id` keys into solidOfTri, so a viewer can hide or
     * highlight a part by filtering triangles on those ids. A part occurring N times in the
     * assembly is one node with `occurrences: N` (instances share solid ids). */
    structure: PartNode;
    /** Analytic measurement geometry (per-edge curve identity + exact boundary polylines,
     * instance-placed like the mesh) when `measureGeometry` was requested. */
    measure?: MeasureGeometry;
    /** Unit per-vertex normals (3 per vertex, aligned with mesh.positions) when `vertexNormals`
     * was requested — analytic from the B-rep surface wherever the vertex lies on one (exact on
     * curved faces, crease-averaged at feature edges), faceted fallback elsewhere. */
    normals?: Float32Array;
    /** Parameter-space (u,v) per triangle corner (2 floats per corner, aligned with mesh.indices)
     * when `parameterUVs` was requested; NaN for corners without an analytic surface. Per corner,
     * not per vertex: a welded vertex has one (u,v) PER FACE, and periodic seams need two branches. */
    uv?: Float32Array;
    /** Per-face parameter ranges/periods for normalizing `uv` into texture space. */
    faceUV?: Map<number, FaceUV>;
    /** Per-face metadata keyed by the ids in `faceOfTri`: normalized surface class, analytic
     * identity (part-local origin/axis/radius), mesh area (mm²) and mean outward normal — enough to
     * flood-select a whole CAD face from one picked triangle or filter faces by type/orientation. */
    faces: Map<number, FaceInfo>;
    /** Every placed part occurrence: a solid used ×N in the assembly is N entries here (its
     * placements are baked into the vertices — this is the only surviving per-copy identity). */
    instances: SolidInstance[];
    /** Per-triangle index into `instances`, aligned with solidOfTri/faceOfTri. */
    instanceOfTri: Uint32Array;
}
/** Parse a STEP file (ISO-10303-21 text) and tessellate it into a uniform, watertight mesh. */
export declare function importStep(src: string, opts?: ImportOptions): ImportResult;
//# sourceMappingURL=index.d.ts.map