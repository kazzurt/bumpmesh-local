import { Table } from "./entities.ts";
import type { BSolid } from "../brep/build.ts";
/** sRGB color, each channel 0..1 (as stored in COLOUR_RGB). */
export type RGB = [number, number, number];
export interface ModelColors {
    /** Distinct colors present in the model (sRGB, 0..1). */
    palette: RGB[];
    /** Palette index per B-rep face — keys are the same ADVANCED_FACE entity ids as the values of
     * MeshResult.faceOfTri, so `palette[faceColor.get(faceOfTri[t])]` colors triangle t. Face-level
     * styles override the owning solid's color; unstyled faces are absent from the map. */
    faceColor: Map<number, number>;
    /** Palette index per solid (body) — keys match MeshResult.solidOfTri values. Only bodies styled
     * as a whole appear here; their faces already carry the color in faceColor. */
    solidColor: Map<number, number>;
}
/**
 * Resolve every styled item in the file to a color and compose the per-face result over the
 * built solids: face-level styles beat shell-level ones, both beat the solid's body color,
 * and OVER_RIDING_STYLED_ITEM beats STYLED_ITEM at the same level. Returns null when the file
 * carries no surface colors. Malformed style chains are skipped, never fatal.
 */
export declare function extractColors(table: Table, solids: readonly Pick<BSolid, "id" | "faces">[]): ModelColors | null;
//# sourceMappingURL=styles.d.ts.map