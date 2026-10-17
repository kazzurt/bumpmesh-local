/** Undirected edge key for vertex indices < 2^22 (well above any face's vertex count). */
export declare const K_EDGE = 4194304;
export declare const ekey: (a: number, b: number) => number;
/** Refine `tris` (flattened index triples over `pts`) toward `target` edge length in place.
 * `boundary` holds ekey()s of the loop segments that must survive verbatim (never split, never
 * duplicated by a flip). All vertices present on entry are treated as immovable. */
export declare function refineTriangulation(pts: number[], tris: number[], boundary: Set<number>, target: number): void;
//# sourceMappingURL=refine.d.ts.map