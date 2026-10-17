import type { IndexedMesh } from "../io/stl.ts";
/** "error" = geometry is missing or the mesh is defective — the import cannot be trusted.
 * "warning" = a heuristic repair produced a result that is PROBABLY right but was not derived
 * from clean topology — worth an inspection of the preview. */
export type WarningSeverity = "error" | "warning";
export type WarningCode = 
/** A malformed face record was dropped while reading the B-rep — its geometry is entirely
 * missing from the mesh. */
"face-dropped"
/** The face's surface kind is not implemented — the face was skipped (geometry missing). */
 | "face-unsupported-surface"
/** Every mesher failed on the face — the face was skipped (geometry missing). */
 | "face-untriangulated"
/** The face's boundary degenerated in the CDT (unenforceable constraints or duplicate-vertex
 * equivalence) and its region was rebuilt by a rescue fill — topology is reconstructed, and on
 * multi-loop trims the fill can over-cover (watertight but wrong). */
 | "cdt-degenerate-boundary"
/** A structurally folded multi-loop plane was rebuilt by the earcut hole-bridge fill. */
 | "heuristic-fill"
/** A folded (u,v) projection laid a second sheet over part of the face; the redundant
 * triangles were peeled off. */
 | "folded-triangles-dropped"
/** The face's trim loops genuinely overlap in (u,v) even at 64× sampling density (e.g. tangent
 * letter engravings) — meshed as-is. */
 | "boundary-self-intersects"
/** A body claiming CLOSED_SHELL is structurally a sheet (B-rep boundary edges) and found no
 * mate ring to sew — reclassified as an open surface body. */
 | "open-shell"
/** More warnings occurred than the cap; the excess was dropped. */
 | "warnings-truncated";
export interface MeshWarning {
    code: WarningCode;
    severity: WarningSeverity;
    /** STEP entity id of the affected face, when known. */
    faceId?: number;
    detail: string;
}
/** Consolidated conversion verdict returned by importStep as `diagnostics`. */
export interface ImportDiagnostics {
    /** True only when the conversion is fully trustworthy: mesh closed and manifold, no faces
     * missing, no heuristic repairs. When false, grade the message by severity: any "error"
     * warning or a non-zero edge counter means geometry is missing or leaking (advise exporting a
     * mesh directly from CAD); only "warning"-severity findings means the mesh is closed but some
     * faces were reconstructed heuristically (advise checking the preview). */
    ok: boolean;
    /** Edges bounding exactly one triangle — cracks/holes. Open-by-design shells excluded. */
    openEdges: number;
    /** Edges bounding more than two triangles — non-manifold welds. */
    nonManifoldEdges: number;
    /** Faces dropped while reading the B-rep; their geometry is absent from the mesh. */
    facesDropped: number;
    /** Faces the tessellator could not mesh (unsupported surface kind or all meshers failed). */
    facesSkipped: number;
    warnings: MeshWarning[];
}
export declare function beginWarnings(): void;
/** Record a warning, deduplicated by (code, faceId) — retry loops re-report the same condition.
 * No-op when no collection is active (direct mesher calls from harnesses). */
export declare function warn(code: WarningCode, faceId: number | undefined, detail: string): void;
export declare function takeWarnings(): MeshWarning[];
export interface EdgeDefects {
    openEdges: number;
    nonManifoldEdges: number;
}
/** Count boundary defects: edges bounding exactly one triangle (open — a crack or hole) and edges
 * bounding more than two (non-manifold). Triangles of `openSolids` bodies (OPEN_SHELL surface
 * models) are excluded — their boundary is open by design. Bodies are welded independently, so
 * every edge belongs to exactly one solid and the exclusion cannot split a shared edge's count. */
export declare function meshDefects(mesh: IndexedMesh, solidOfTri?: Uint32Array, openSolids?: number[]): EdgeDefects;
//# sourceMappingURL=diag.d.ts.map