type P2 = [number, number];
/**
 * Triangulate the region bounded by loops[0] (outer) minus loops[1..] (holes), using all listed
 * points (loop vertices + interior). Returns triangle index triples into `points`.
 */
export declare function constrainedTriangulate(points: P2[], loops: number[][], interior: number[], out?: {
    missing: number;
    rescue?: string;
}): [number, number, number][];
export {};
//# sourceMappingURL=cdt2d.d.ts.map