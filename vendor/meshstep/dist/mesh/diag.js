import { EdgeTable } from "./edge-table.js";
const SEVERITY = {
    "face-dropped": "error",
    "face-unsupported-surface": "error",
    "face-untriangulated": "error",
    "cdt-degenerate-boundary": "warning",
    "heuristic-fill": "warning",
    "folded-triangles-dropped": "warning",
    "boundary-self-intersects": "warning",
    "open-shell": "warning",
    "warnings-truncated": "warning",
};
// Module-level collector: tessellation is synchronous and single-threaded, so the active sink is
// simply swapped in for the duration of one tessellate() call. Deep meshing code (gridCDT, the
// fold audit) reports through warn() without threading a sink through every signature.
const CAP = 256;
let sink = null;
let seen = null;
let truncated = 0;
export function beginWarnings() { sink = []; seen = new Set(); truncated = 0; }
/** Record a warning, deduplicated by (code, faceId) — retry loops re-report the same condition.
 * No-op when no collection is active (direct mesher calls from harnesses). */
export function warn(code, faceId, detail) {
    if (!sink || !seen)
        return;
    const k = code + ":" + (faceId ?? -1);
    if (seen.has(k))
        return;
    seen.add(k);
    if (sink.length >= CAP) {
        truncated++;
        return;
    }
    if (faceId === undefined)
        sink.push({ code, severity: SEVERITY[code], detail });
    else
        sink.push({ code, severity: SEVERITY[code], faceId, detail });
}
export function takeWarnings() {
    const w = sink ?? [];
    if (truncated > 0)
        w.push({
            code: "warnings-truncated", severity: "warning",
            detail: `${truncated} further warning(s) beyond the ${CAP}-entry cap were dropped`,
        });
    sink = null;
    seen = null;
    truncated = 0;
    return w;
}
/** Count boundary defects: edges bounding exactly one triangle (open — a crack or hole) and edges
 * bounding more than two (non-manifold). Triangles of `openSolids` bodies (OPEN_SHELL surface
 * models) are excluded — their boundary is open by design. Bodies are welded independently, so
 * every edge belongs to exactly one solid and the exclusion cannot split a shared edge's count. */
export function meshDefects(mesh, solidOfTri, openSolids) {
    const skip = openSolids && openSolids.length > 0 && solidOfTri ? new Set(openSolids) : null;
    const I = mesh.indices;
    const nt = I.length / 3;
    // EdgeTable, not a Map: an assembly mesh can carry more unique edges than a Map's 2^24 cap.
    const inc = new EdgeTable(nt * 1.6);
    for (let t = 0; t < nt; t++) {
        if (skip && skip.has(solidOfTri[t]))
            continue;
        for (let e = 0; e < 3; e++)
            inc.bump(I[t * 3 + e], I[t * 3 + (e + 1) % 3]);
    }
    let openEdges = 0, nonManifoldEdges = 0;
    for (let s = 0; s < inc.capacity; s++) {
        const c = inc.cnt[s];
        if (c === 1)
            openEdges++;
        else if (c > 2)
            nonManifoldEdges++;
    }
    return { openEdges, nonManifoldEdges };
}
//# sourceMappingURL=diag.js.map