import type { Entity, EntityRecord, Param, StepModel } from "./parser.ts";
export declare class Table {
    readonly model: StepModel;
    constructor(model: StepModel);
    get(id: number): Entity;
    /** A simple (non-complex) record; throws if the instance is complex. */
    record(id: number): EntityRecord;
    isComplex(id: number): boolean;
    /** From a (possibly complex) instance, find a partial record of a given type. */
    sub(id: number, type: string): EntityRecord | undefined;
    typeOf(id: number): string | undefined;
    byType(type: string): Generator<[number, EntityRecord]>;
    histogram(): Map<string, number>;
}
export declare const num: (p: Param) => number;
export declare const str: (p: Param) => string;
export declare const ref: (p: Param) => number;
export declare const enumOf: (p: Param) => string;
export declare const list: (p: Param) => Param[];
export declare const refList: (p: Param) => number[];
export declare const numList: (p: Param) => number[];
export declare const isNone: (p: Param) => boolean;
//# sourceMappingURL=entities.d.ts.map