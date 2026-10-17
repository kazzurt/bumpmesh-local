import type { Vec3 } from "./vec.ts";
import { Table } from "../step/entities.ts";
export interface Curve3 {
    kind: string;
    /** Parameter domain. */
    t0: number;
    t1: number;
    /** True if evaluate(t0) === evaluate(t1) (full circle/ellipse, closed B-spline). */
    closed: boolean;
    evaluate(t: number): Vec3;
    /** Parameter of the closest point (exact for conics/lines, iterative for B-splines). */
    project(p: Vec3): number;
    /** Smallest radius of curvature over the curve; Infinity for a line. Drives sampling density. */
    minRadius(): number;
}
/**
 * Construct an evaluable Curve3 from a STEP curve entity (LINE, CIRCLE, ELLIPSE, B-spline simple or
 * complex/rational, TRIMMED_CURVE). `aRad` converts file plane-angle units to radians (trim values
 * on conics are given in the file's angle unit). Returns null for unsupported curve types.
 */
export declare function makeCurve(t: Table, id: number, s: number, aRad?: number): Curve3 | null;
/** Analytic identity of one EDGE_CURVE, for measurement tools. Params are in mm (scaled). */
export interface EdgeCurveInfo {
    kind: "line" | "circle" | "ellipse" | "other";
    /** Circle/ellipse center and plane normal. */
    center?: Vec3;
    axis?: Vec3;
    /** Circle radius / ellipse semi-axes. */
    radius?: number;
    radius2?: number;
    /** Unit direction for a line edge. */
    dir?: Vec3;
    /** Signed traversed arc angle v0 -> v1 (rad); ±2π for a full circle. */
    sweep?: number;
    /** Exact analytic length where closed-form (line, circular arc); undefined otherwise. */
    length?: number;
}
/**
 * Classify the curve of an EDGE_CURVE from vertex v0 to v1 and extract its analytic parameters.
 * Mirrors `sampleEdgePolyline`'s dispatch (unwraps SURFACE_CURVE/SEAM_CURVE/INTERSECTION_CURVE and
 * TRIMMED_CURVE to the underlying conic/line) and its arc-sweep convention, so the reported
 * radius/center/sweep describe exactly the geometry the mesh boundary was sampled from.
 */
export declare function analyzeEdgeCurve(t: Table, curveId: number, v0: Vec3, v1: Vec3, sameSense: boolean, s: number): EdgeCurveInfo;
/**
 * Adaptively sample a Curve3 over [ta, tb] (defaults to its whole domain): start uniform, then
 * bisect any segment whose midpoint sags more than chordTol off the chord or that is longer than
 * maxSegLen. Returns ≥ 2 points, capped to stay bounded on pathological input.
 */
export declare function sampleCurve(c: Curve3, chordTol: number, maxSegLen: number, ta?: number, tb?: number, normalDev?: number): Vec3[];
/**
 * Sample the curve of an EDGE_CURVE from vertex v0 to v1.
 * `sameSense` is the EDGE_CURVE flag (edge direction agrees with the curve's parametrisation).
 * Returns points from v0 to v1 inclusive (≥ 2 points).
 */
export declare function sampleEdgePolyline(t: Table, curveId: number, v0: Vec3, v1: Vec3, sameSense: boolean, s: number, chordTol: number, maxSegLen: number, aRad?: number, normalDev?: number): Vec3[];
//# sourceMappingURL=curves.d.ts.map