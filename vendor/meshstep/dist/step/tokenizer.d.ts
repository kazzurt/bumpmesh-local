export type TokKind = "kw" | "ref" | "num" | "str" | "enum" | "lparen" | "rparen" | "comma" | "semi" | "eq" | "dollar" | "star" | "eof";
export interface Token {
    kind: TokKind;
    /** str: decoded content · ref: digits · num: raw · enum: inner word · kw: name. */
    text: string;
    pos: number;
}
/** Extract the DATA section body (between `DATA;` and the following `ENDSEC;`). */
export declare function extractDataSection(src: string): string;
export declare function tokenize(src: string): Token[];
//# sourceMappingURL=tokenizer.d.ts.map