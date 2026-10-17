export interface TriSoup {
    /** Flat triangle vertices: 9 numbers per triangle (v0xyz, v1xyz, v2xyz). */
    positions: Float64Array;
    triangleCount: number;
}
export interface IndexedMesh {
    /** 3 numbers per vertex. */
    positions: Float64Array;
    /** 3 indices per triangle. */
    indices: Uint32Array;
}
export interface BBox {
    min: [number, number, number];
    max: [number, number, number];
    diagonal: number;
}
/** Detect format and parse an STL (binary or ASCII) into a flat triangle soup. */
export declare function readSTL(buf: ArrayBuffer | Uint8Array): TriSoup;
/**
 * Robust binary detection: a binary STL is exactly 84 + 50*count bytes, where `count` is the
 * uint32 at offset 80. ASCII files almost never satisfy this by coincidence, and (unlike the
 * "starts with 'solid'" heuristic) this is not fooled by binary headers that begin with "solid".
 */
export declare function isBinarySTL(bytes: Uint8Array): boolean;
export declare function readBinarySTL(bytes: Uint8Array): TriSoup;
export declare function readAsciiSTL(text: string): TriSoup;
/** Write a binary STL from an indexed mesh; flat per-triangle normals are computed. */
export declare function writeBinarySTL(mesh: IndexedMesh, header?: string): Uint8Array;
/** Weld a triangle soup's coincident vertices (quantised to eps) into an indexed mesh, so edge
 * topology — open/non-manifold edge audits — works on it. STL facets repeat shared vertices
 * bitwise-identically, so the quantisation only ever merges genuinely coincident points. */
export declare function indexSoup(soup: TriSoup, eps?: number): IndexedMesh;
export declare function bboxOfSoup(s: TriSoup): BBox;
//# sourceMappingURL=stl.d.ts.map