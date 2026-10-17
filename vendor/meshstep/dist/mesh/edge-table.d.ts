export declare class EdgeTable {
    private keys;
    private mask;
    private growAt;
    private lanes;
    /** Occupied-slot count. */
    size: number;
    /** Saturating per-edge use-count, 0 on an empty/never-bumped slot (255 = "many"). */
    cnt: Uint8Array;
    /** First caller lane (lanes >= 1), -1 initialised. */
    v0: Int32Array;
    /** Second caller lane (lanes = 2), -1 initialised. */
    v1: Int32Array;
    constructor(expectedEdges: number, lanes?: 0 | 1 | 2);
    /** Slot count (for iterating occupied slots via cnt[s] > 0). */
    get capacity(): number;
    private static hash;
    /** Slot of edge (a,b), inserting an empty slot (cnt 0, lanes -1) when absent. */
    slot(a: number, b: number): number;
    /** Slot of edge (a,b), or -1 when absent. */
    find(a: number, b: number): number;
    /** Insert-or-find + saturating count increment. Returns the slot (read cnt[slot] for the count). */
    bump(a: number, b: number): number;
    private rehash;
}
//# sourceMappingURL=edge-table.d.ts.map