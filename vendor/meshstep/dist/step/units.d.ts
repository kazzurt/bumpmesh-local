import type { Table } from "./entities.ts";
export interface Units {
    /** Multiply STEP length values by this to obtain millimetres. */
    mmPerUnit: number;
    /** Multiply STEP plane-angle values by this to obtain radians (1 for radian, π/180 for degree). */
    radPerAngle: number;
    label: string;
}
/**
 * Find the model's length and plane-angle units. Prefers the units the geometry context actually
 * assigns (GLOBAL_UNIT_ASSIGNED_CONTEXT) — a file routinely also contains the RADIAN basis unit its
 * DEGREE conversion is defined in, so a global scan can pick the wrong one. Handles SI_UNIT
 * (MILLI METRE, RADIAN) and CONVERSION_BASED_UNIT (INCH, DEGREE, ...). Falls back to mm / radians.
 */
/**
 * Per-representation-context length scale (mm per unit). A multi-part assembly may declare a
 * DIFFERENT length unit per part representation (Inventor 2026 mixes plain METRE and MILLI METRE
 * contexts in one file); geometry must be scaled by the unit of the context its representation
 * references, not a single global pick. Returns only contexts that resolve a length unit — callers
 * fall back to the global detectUnits() scale for anything absent.
 */
export declare function contextLengthScales(table: Table): Map<number, number>;
/** The file's declared modelling tolerance in millimetres (UNCERTAINTY_MEASURE_WITH_UNIT with a
 * LENGTH_MEASURE value): per ISO 10303, two points closer than this ARE the same point. Returns
 * the largest declaration (multi-context assemblies repeat it per representation context) or null
 * when the file declares none. */
export declare function detectUncertainty(table: Table): number | null;
export declare function detectUnits(table: Table): Units;
//# sourceMappingURL=units.d.ts.map