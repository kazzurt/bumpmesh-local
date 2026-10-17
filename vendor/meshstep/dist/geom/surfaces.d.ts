import type { Vec3 } from "./vec.ts";
import { type Frame } from "./placement.ts";
import { Table } from "../step/entities.ts";
export interface Surface {
    kind: string;
    /** True if the surface wraps in u — cylinder, cone, sphere, closed B-spline. */
    periodicU: boolean;
    /** True if the surface also wraps in v — torus (tube angle), closed B-spline. */
    periodicV?: boolean;
    /** Parameter period in u / v (2π for the analytic surfaces; v1-v0 for a closed B-spline). */
    uPeriod?: number;
    vPeriod?: number;
    /** Parameter value of the periodic branch cut ("seam") in u / v: where project() wraps — ±π for
     *  the analytic atan2 surfaces, the knot-domain start for a closed B-spline / extrusion. The
     *  seam-aware boundary projector needs it to spot edges that lie ON the seam (ambiguous side). */
    uSeam?: number;
    vSeam?: number;
    /** Bounded parameter domain per direction, when the surface has one (B-spline knot span, SoR
     *  profile span). Absent on unbounded analytic directions (plane axes, cylinder/cone height). */
    uDomain?: [number, number];
    vDomain?: [number, number];
    evaluate(u: number, v: number): Vec3;
    /** Inverse-map p to (u,v). Optional (hu,hv) seeds an iterative solver so a boundary projects
     *  continuously across a seam (used by the B-spline surface; ignored by the analytic ones). */
    project(p: Vec3, hu?: number, hv?: number): [number, number];
    normal(u: number, v: number): Vec3;
    /** Smallest principal radius of curvature at (u,v); Infinity for flat. Drives adaptive refinement. */
    curvatureRadius(u: number, v: number): number;
}
declare class Sphere implements Surface {
    kind: string;
    periodicU: boolean;
    uSeam: number;
    f: Frame;
    r: number;
    constructor(f: Frame, r: number);
    evaluate(u: number, v: number): Vec3;
    project(p: Vec3, hu?: number): [number, number];
    normal(u: number, v: number): Vec3;
    curvatureRadius(): number;
}
declare class BSplineSurface implements Surface {
    kind: string;
    periodicU: boolean;
    periodicV: boolean;
    uPeriod: number;
    vPeriod: number;
    uSeam: number;
    vSeam: number;
    uDeg: number;
    vDeg: number;
    cpsF: Float64Array;
    nuCps: number;
    nvCps: number;
    uKnots: number[];
    vKnots: number[];
    u0: number;
    u1: number;
    v0: number;
    v1: number;
    uDomain: [number, number];
    vDomain: [number, number];
    gU: number[];
    gV: number[];
    gPF: Float64Array<ArrayBuffer>;
    rc: number;
    rcGrid: number[][];
    closedU: boolean;
    closedV: boolean;
    constructor(uDeg: number, vDeg: number, cps: number[][][], uKnots: number[], vKnots: number[]);
    private buildGrid;
    private evaluateRaw;
    evaluate(u: number, v: number): Vec3;
    private normalAt;
    normal(u: number, v: number): Vec3;
    curvatureRadius(u: number, v: number): number;
    project(p: Vec3, hu?: number, hv?: number): [number, number];
    private newton;
}
/** Construct a Surface from a STEP surface entity; returns null for unsupported. */
export declare function makeSurface(t: Table, id: number, s: number, aRad?: number): Surface | null;
export { Sphere, BSplineSurface };
export declare const isSphere: (s: Surface) => s is Sphere;
export declare const isBSpline: (s: Surface) => s is BSplineSurface;
/** Analytic identity of a face surface, for measurement tools. Params in mm / radians. */
export interface SurfaceInfo {
    kind: string;
    origin?: Vec3;
    /** Plane normal / cylinder-cone-revolution axis. */
    axis?: Vec3;
    radius?: number;
    semiAngle?: number;
}
/**
 * Extract the analytic parameters of a face surface (placement origin, axis, radius) without
 * building an evaluable Surface. Mirrors `makeSurface`'s record layout for the fixed quadrics;
 * swept/B-spline/complex surfaces report only their kind.
 */
export declare function analyzeSurface(t: Table, id: number, s: number, aRad?: number): SurfaceInfo;
//# sourceMappingURL=surfaces.d.ts.map