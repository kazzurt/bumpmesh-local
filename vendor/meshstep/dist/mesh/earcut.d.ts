/** Triangulate a polygon with holes. `data` is a flat [x0,y0,x1,y1,...] vertex list; `holeIndices`
 * gives the start VERTEX index of each hole (outer ring is [0, holeIndices[0])). Returns triangle
 * vertex-index triples flattened. Empty on failure. */
export declare function earcut(data: number[], holeIndices: number[] | null): number[];
//# sourceMappingURL=earcut.d.ts.map