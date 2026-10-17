export interface StepHeader {
    /** FILE_DESCRIPTION text (all description strings joined). */
    description?: string;
    /** FILE_NAME[0] — the model/file name recorded by the exporter. */
    name?: string;
    /** FILE_NAME[1] — ISO-8601 timestamp of the export. */
    timeStamp?: string;
    /** FILE_NAME[2] — author(s), joined. */
    author?: string;
    /** FILE_NAME[3] — organization(s), joined. */
    organization?: string;
    /** FILE_NAME[4] — preprocessor version string. */
    preprocessor?: string;
    /** FILE_NAME[5] — originating system: the CAD program that wrote the file. */
    originatingSystem?: string;
    /** FILE_SCHEMA[0] raw schema identifier (e.g. `AUTOMOTIVE_DESIGN { ... }`). */
    schema?: string;
    /** Friendly application-protocol label derived from the schema (AP203 / AP214 / AP242 / …). */
    schemaLabel?: string;
}
/**
 * Parse the ISO-10303-21 HEADER section. Returns whatever provenance fields are present; missing or
 * malformed headers yield an empty object rather than throwing (a viewer should still render the geometry).
 */
export declare function parseStepHeader(src: string): StepHeader;
//# sourceMappingURL=header.d.ts.map