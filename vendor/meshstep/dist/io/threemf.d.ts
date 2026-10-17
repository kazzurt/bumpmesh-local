export type RGB3MF = [number, number, number];
export interface ThreeMFItem {
    /** Object display name (`name` attribute); null when the file carries none (most slicers). */
    name: string | null;
    /** 3MF object type: "model" | "solidsupport" are solids; "surface" and "support" are open
     * geometry BY DESIGN and must not be audited for watertightness. */
    type: string;
    /** 3 numbers per vertex, in mm, build transform applied. */
    positions: Float64Array;
    /** 3 indices per triangle. */
    indices: Uint32Array;
    /** Palette index per triangle (-1 = unstyled); null when nothing in this item is colored. */
    colorOfTri: Int32Array | null;
}
export interface ThreeMFModel {
    /** Length-unit label of the model part ("mm", "inch", …); positions are always mm. */
    unit: string;
    /** One entry per build item (a re-used object appears once per instance). */
    items: ThreeMFItem[];
    /** Distinct sRGB colors (0..1) referenced by the items' colorOfTri indices. */
    palette: RGB3MF[];
}
/** Read a 3MF archive into per-build-item meshes (mm, transforms applied) plus a color palette. */
export declare function read3MF(buf: ArrayBuffer | Uint8Array): Promise<ThreeMFModel>;
//# sourceMappingURL=threemf.d.ts.map