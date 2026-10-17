import { Table } from "./entities.ts";
import type { BSolid } from "../brep/build.ts";
/** One solid body: `id` matches the values of MeshResult.solidOfTri. */
export interface PartBody {
    id: number;
    name: string;
}
export interface PartNode {
    /** PRODUCT name from the STEP product structure ('' when the file carries none). */
    name: string;
    /** Assembly occurrences merged into this node (its solids' triangles cover all of them). */
    occurrences: number;
    /** Solid bodies whose geometry lives directly in this node's representation. */
    bodies: PartBody[];
    children: PartNode[];
}
/**
 * Build the part/component tree over the imported solids. Always returns a root node: for a
 * single-part file it is the part itself with its bodies; for an assembly it is the top product
 * with nested children. Solids the product graph doesn't reach (or a malformed graph) degrade to
 * flat bodies on the root, never an error.
 */
export declare function extractStructure(table: Table, solids: readonly Pick<BSolid, "id">[]): PartNode;
//# sourceMappingURL=structure.d.ts.map