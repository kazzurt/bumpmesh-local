export type Param = {
    k: "num";
    v: number;
} | {
    k: "str";
    v: string;
} | {
    k: "ref";
    v: number;
} | {
    k: "enum";
    v: string;
} | {
    k: "none";
} | {
    k: "derived";
} | {
    k: "list";
    v: Param[];
} | {
    k: "typed";
    type: string;
    params: Param[];
};
export interface EntityRecord {
    type: string;
    params: Param[];
}
/** A simple instance, or a "complex" instance: an AND-combination of partial records. */
export type Entity = EntityRecord | {
    complex: EntityRecord[];
};
export interface StepModel {
    entities: Map<number, Entity>;
}
export declare function parseStep(src: string): StepModel;
export type { TokKind } from "./tokenizer.ts";
//# sourceMappingURL=parser.d.ts.map