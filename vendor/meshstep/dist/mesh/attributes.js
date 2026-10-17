import { makeSurface } from "../geom/surfaces.js";
/** Wrap b to the branch nearest a (periodic coordinate unwrap). */
const nearBranch = (b, a, period) => b + period * Math.round((a - b) / period);
export function computeSurfaceAttributes(mesh, faceOfTri, brep, want, 
/** Max |surface(u,v) − vertex| for the projection to count as on-surface, mm. */
tol) {
    const P = mesh.positions, I = mesh.indices;
    const nV = P.length / 3, nT = faceOfTri.length;
    // Surfaces per face (shared across both attribute kinds).
    const surfCache = new Map();
    const faceSrc = new Map();
    for (const solid of brep.solids) {
        const s = solid.scale ?? brep.scale;
        for (const f of solid.faces)
            faceSrc.set(f.faceId, { surfaceId: f.surfaceId, scale: s });
    }
    const surfaceOf = (fid) => {
        let s = surfCache.get(fid);
        if (s === undefined) {
            const src = faceSrc.get(fid);
            try {
                s = src ? makeSurface(brep.table, src.surfaceId, src.scale, brep.units.radPerAngle) : null;
            }
            catch {
                s = null;
            }
            surfCache.set(fid, s);
        }
        return s;
    };
    // Group triangles by face, preserving emission order (spatially coherent → good projection hints).
    const trisOf = new Map();
    for (let t = 0; t < nT; t++) {
        const fid = faceOfTri[t];
        let l = trisOf.get(fid);
        if (!l) {
            l = [];
            trisOf.set(fid, l);
        }
        l.push(t);
    }
    const accN = want.normals ? new Float64Array(nV * 3) : null;
    const uvOut = want.uvs ? new Float32Array(nT * 6).fill(NaN) : null;
    const faceUV = want.uvs ? new Map() : undefined;
    // Scratch, reused across faces (keyed by global vertex id, cleared per face).
    const slotOf = new Map();
    const vx = [], vy = [], vz = []; // vertex position per slot
    const su = [], sv = []; // projected (u,v) per slot
    const sOK = []; // 1 = residual-validated on-surface projection
    const fnx = [], fny = [], fnz = []; // faceted normal accum per slot
    const wsum = []; // corner-angle weight accum per slot (for normals)
    const tolSq = tol * tol;
    for (const [fid, tris] of trisOf) {
        const surface = surfaceOf(fid);
        slotOf.clear();
        vx.length = vy.length = vz.length = su.length = sv.length = sOK.length = 0;
        fnx.length = fny.length = fnz.length = 0;
        wsum.length = 0;
        const slot = (v) => {
            let s = slotOf.get(v);
            if (s === undefined) {
                s = vx.length;
                slotOf.set(v, s);
                vx.push(P[v * 3]);
                vy.push(P[v * 3 + 1]);
                vz.push(P[v * 3 + 2]);
                su.push(NaN);
                sv.push(NaN);
                sOK.push(0);
                fnx.push(0);
                fny.push(0);
                fnz.push(0);
                wsum.push(0);
            }
            return s;
        };
        // Pass 1: per-triangle — register slots, accumulate faceted normals + corner-angle weights,
        // and project unprojected corners (hint-seeded from a projected corner of the same triangle,
        // which keeps B-spline Newton projection warm and seam-continuous across the face).
        for (const t of tris) {
            const a = slot(I[t * 3]), b = slot(I[t * 3 + 1]), c = slot(I[t * 3 + 2]);
            const ux = vx[b] - vx[a], uy = vy[b] - vy[a], uz = vz[b] - vz[a];
            const wx = vx[c] - vx[a], wy = vy[c] - vy[a], wz = vz[c] - vz[a];
            const cx2 = uy * wz - uz * wy, cy2 = uz * wx - ux * wz, cz2 = ux * wy - uy * wx;
            for (const s of [a, b, c]) {
                fnx[s] += cx2;
                fny[s] += cy2;
                fnz[s] += cz2;
            }
            if (accN) {
                // Corner angles (3D) as blend weights — the standard choice for displacement normals.
                const bcx = vx[c] - vx[b], bcy = vy[c] - vy[b], bcz = vz[c] - vz[b];
                const lab = Math.hypot(ux, uy, uz), lac = Math.hypot(wx, wy, wz), lbc = Math.hypot(bcx, bcy, bcz);
                if (lab > 0 && lac > 0 && lbc > 0) {
                    const angA = Math.acos(Math.min(1, Math.max(-1, (ux * wx + uy * wy + uz * wz) / (lab * lac))));
                    const angB = Math.acos(Math.min(1, Math.max(-1, (-ux * bcx - uy * bcy - uz * bcz) / (lab * lbc))));
                    wsum[a] += angA;
                    wsum[b] += angB;
                    wsum[c] += Math.max(0, Math.PI - angA - angB);
                }
            }
            if (surface) {
                let hu = NaN, hv = NaN;
                for (const s of [a, b, c])
                    if (sOK[s]) {
                        hu = su[s];
                        hv = sv[s];
                        break;
                    }
                for (const s of [a, b, c]) {
                    if (sOK[s] || !Number.isNaN(su[s]))
                        continue; // done or already failed
                    const p = [vx[s], vy[s], vz[s]];
                    let uv;
                    try {
                        uv = Number.isNaN(hu) ? surface.project(p) : surface.project(p, hu, hv);
                    }
                    catch {
                        su[s] = Infinity;
                        continue;
                    } // mark failed (non-NaN sentinel, stays !ok)
                    const q = surface.evaluate(uv[0], uv[1]);
                    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
                    if (dx * dx + dy * dy + dz * dz <= tolSq) {
                        su[s] = uv[0];
                        sv[s] = uv[1];
                        sOK[s] = 1;
                        if (Number.isNaN(hu)) {
                            hu = uv[0];
                            hv = uv[1];
                        }
                    }
                    else
                        su[s] = Infinity;
                }
            }
        }
        // Pass 2: per-vertex normal contribution of THIS face — analytic when the projection landed,
        // sign-matched to the face's own faceted normal there (robust against same_sense bookkeeping
        // and orientation fixes); faceted otherwise. Weighted by summed corner angles.
        if (accN) {
            for (const [v, s] of slotOf) {
                let nx = fnx[s], ny = fny[s], nz = fnz[s];
                const fl = Math.hypot(nx, ny, nz);
                if (surface && sOK[s]) {
                    const an = surface.normal(su[s], sv[s]);
                    const flip = fl > 1e-12 && an[0] * nx + an[1] * ny + an[2] * nz < 0 ? -1 : 1;
                    nx = an[0] * flip;
                    ny = an[1] * flip;
                    nz = an[2] * flip;
                }
                else if (fl > 1e-12) {
                    nx /= fl;
                    ny /= fl;
                    nz /= fl;
                }
                else
                    continue;
                const w = wsum[s] > 0 ? wsum[s] : 1e-3;
                accN[v * 3] += nx * w;
                accN[v * 3 + 1] += ny * w;
                accN[v * 3 + 2] += nz * w;
            }
        }
        // Pass 3: per-corner UVs with per-triangle seam unwrap + face range tracking.
        if (uvOut && surface) {
            const uPer = surface.periodicU ? surface.uPeriod ?? 2 * Math.PI : 0;
            const vPer = surface.periodicV ? surface.vPeriod ?? 2 * Math.PI : 0;
            let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity, any = false;
            for (const t of tris) {
                const a = slotOf.get(I[t * 3]), b = slotOf.get(I[t * 3 + 1]), c = slotOf.get(I[t * 3 + 2]);
                if (!sOK[a] || !sOK[b] || !sOK[c])
                    continue; // leave NaN
                let u0 = su[a], u1 = su[b], u2 = su[c];
                let v0 = sv[a], v1 = sv[b], v2 = sv[c];
                if (uPer > 0) {
                    u1 = nearBranch(u1, u0, uPer);
                    u2 = nearBranch(u2, u0, uPer);
                }
                if (vPer > 0) {
                    v1 = nearBranch(v1, v0, vPer);
                    v2 = nearBranch(v2, v0, vPer);
                }
                const o = t * 6;
                uvOut[o] = u0;
                uvOut[o + 1] = v0;
                uvOut[o + 2] = u1;
                uvOut[o + 3] = v1;
                uvOut[o + 4] = u2;
                uvOut[o + 5] = v2;
                uMin = Math.min(uMin, u0, u1, u2);
                uMax = Math.max(uMax, u0, u1, u2);
                vMin = Math.min(vMin, v0, v1, v2);
                vMax = Math.max(vMax, v0, v1, v2);
                any = true;
            }
            if (any) {
                faceUV.set(fid, {
                    faceId: fid, uRange: [uMin, uMax], vRange: [vMin, vMax],
                    ...(uPer > 0 ? { uPeriod: uPer } : {}), ...(vPer > 0 ? { vPeriod: vPer } : {}),
                });
            }
        }
    }
    const out = {};
    if (accN) {
        const normals = new Float32Array(nV * 3);
        for (let v = 0; v < nV; v++) {
            const x = accN[v * 3], y = accN[v * 3 + 1], z = accN[v * 3 + 2];
            const l = Math.hypot(x, y, z);
            if (l > 1e-12) {
                normals[v * 3] = x / l;
                normals[v * 3 + 1] = y / l;
                normals[v * 3 + 2] = z / l;
            }
        }
        out.normals = normals;
    }
    if (uvOut) {
        out.uv = uvOut;
        out.faceUV = faceUV;
    }
    return out;
}
//# sourceMappingURL=attributes.js.map