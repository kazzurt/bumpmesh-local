import type { Vec3 } from "../geom/vec.ts";
import type { Frame } from "../geom/placement.ts";
import type { BrepModel } from "./build.ts";
export interface MeasureEdge {
    edgeId: number;
    solidId: number;
    /** Assembly occurrence index (0-based) this record is placed for — matches SolidInstance.instance. */
    instance: number;
    kind: "line" | "circle" | "ellipse" | "other";
    /** Edge length in mm — analytic where closed-form (line, circular arc), else polyline sum. */
    length: number;
    /** Circle/ellipse center and plane normal (instance-placed mm / unit). */
    center?: [number, number, number];
    /** Circle/ellipse plane normal; unit direction for a line edge. */
    axis?: [number, number, number];
    /** Circle radius / ellipse semi-major. */
    radius?: number;
    /** Ellipse semi-minor. */
    radius2?: number;
    /** Signed traversed arc angle (rad); |sweep| ≈ 2π means a full circle. */
    sweep?: number;
    /** Adjacent B-rep face ids (1-2, same ids as faceOfTri). */
    faceIds: number[];
    /** Slice into MeasureGeometry.points: floats [first*3, (first+count)*3). */
    first: number;
    count: number;
}
export interface MeasureFace {
    faceId: number;
    solidId: number;
    /** Assembly occurrence index (0-based) this record is placed for — matches SolidInstance.instance. */
    instance: number;
    /** STEP surface kind (PLANE | CYLINDRICAL_SURFACE | ...); "" for complex/rational surfaces. */
    kind: string;
    origin?: [number, number, number];
    /** Plane normal / cylinder-cone axis (instance-placed unit vector). */
    axis?: [number, number, number];
    radius?: number;
    semiAngle?: number;
    /** ADVANCED_FACE.same_sense resolved to a sign: face normal = normalSign * surface normal. */
    normalSign: 1 | -1;
}
export interface MeasureGeometry {
    /** All edge polylines packed, 3 floats per point, instance-placed mm. Transferable. */
    points: Float32Array;
    edges: MeasureEdge[];
    faces: MeasureFace[];
    /** True when the polyline guard rail decimated freeform edges (pathological assemblies). */
    truncated?: boolean;
}
/**
 * Collect measurement geometry for every edge and face of the model, replicated per assembly
 * occurrence with the same instance frames the mesh is placed by (`solidXf` in importStep) —
 * so a hole used ×N measures at each placed position, and solidIds match solidOfTri.
 * `edgePolylines` must be tessellate's own `edgePolylines` output (part-local mm).
 */
export declare function collectMeasureGeometry(brep: BrepModel, edgePolylines: Map<number, Vec3[]>, instances: Map<number, Frame[]>): MeasureGeometry;
//# sourceMappingURL=measure-geometry.d.ts.map