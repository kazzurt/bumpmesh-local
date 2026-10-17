import { analyzeSurface } from "../geom/surfaces.js";
const TYPE_OF_KIND = {
    PLANE: "plane",
    CYLINDRICAL_SURFACE: "cylinder",
    CONICAL_SURFACE: "cone",
    SPHERICAL_SURFACE: "sphere",
    TOROIDAL_SURFACE: "torus",
    DEGENERATE_TOROIDAL_SURFACE: "torus",
    B_SPLINE_SURFACE_WITH_KNOTS: "bspline",
    B_SPLINE_SURFACE: "bspline",
    SURFACE_OF_REVOLUTION: "revolution",
    SURFACE_OF_LINEAR_EXTRUSION: "extrusion",
    OFFSET_SURFACE: "offset",
};
/**
 * Collect per-face metadata from the tessellated mesh + the B-rep it came from. Runs on the
 * PRE-PLACEMENT mesh (part-local coordinates): area is rigid-invariant so it equals the placed
 * face's area, and `surface`/`meanNormal` are documented as part-local. Faces are enumerated from
 * `faceOfTri` so every meshing path is covered — faces of AP242 tessellated bodies (no analytic
 * surface) report kind "" / type "other".
 */
export function collectFaceInfo(mesh, faceOfTri, solidOfTri, brep) {
    // faceId -> (surfaceId, unit scale) from the B-rep, for the analytic identity.
    const surfaceOf = new Map();
    for (const solid of brep.solids) {
        const s = solid.scale ?? brep.scale;
        for (const face of solid.faces)
            surfaceOf.set(face.faceId, { surfaceId: face.surfaceId, scale: s });
    }
    const P = mesh.positions, I = mesh.indices;
    const acc = new Map();
    for (let t = 0; t < faceOfTri.length; t++) {
        const fid = faceOfTri[t];
        let a = acc.get(fid);
        if (!a) {
            a = { solidId: solidOfTri[t], area: 0, n: [0, 0, 0], tris: 0 };
            acc.set(fid, a);
        }
        const i0 = I[t * 3] * 3, i1 = I[t * 3 + 1] * 3, i2 = I[t * 3 + 2] * 3;
        const ux = P[i1] - P[i0], uy = P[i1 + 1] - P[i0 + 1], uz = P[i1 + 2] - P[i0 + 2];
        const vx = P[i2] - P[i0], vy = P[i2 + 1] - P[i0 + 1], vz = P[i2 + 2] - P[i0 + 2];
        // Cross product = 2·area·normal — accumulating it raw IS the area-weighted normal sum.
        const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
        a.area += Math.hypot(cx, cy, cz) / 2;
        a.n[0] += cx;
        a.n[1] += cy;
        a.n[2] += cz;
        a.tris++;
    }
    const out = new Map();
    for (const [fid, a] of acc) {
        const src = surfaceOf.get(fid);
        const surface = src
            ? analyzeSurface(brep.table, src.surfaceId, src.scale, brep.units.radPerAngle)
            : { kind: "" };
        // Complex/rational B-spline surfaces have no simple typeOf → kind "" — but only call them
        // bspline when the face came from an analytic B-rep; facetted faces are genuinely "other".
        const type = TYPE_OF_KIND[surface.kind] ?? (src ? "bspline" : "other");
        const l = Math.hypot(a.n[0], a.n[1], a.n[2]);
        const meanNormal = l > 1e-9 * Math.max(1, a.area) ? [a.n[0] / l, a.n[1] / l, a.n[2] / l] : [0, 0, 0];
        out.set(fid, { faceId: fid, solidId: a.solidId, type, surface, area: a.area, meanNormal, triangleCount: a.tris });
    }
    return out;
}
//# sourceMappingURL=face-info.js.map