import { Table } from "./entities.ts";
export interface AssemblyLink {
    /** Rep of the component occurrence (the child being placed). */
    child: number;
    /** Rep of the assembly that instantiates it. */
    parent: number;
    /** Placement id in the child rep — the component frame being mapped (absent: malformed IDT). */
    childItem?: number;
    /** Placement id in the parent rep — where the component frame lands (absent: malformed IDT). */
    parentItem?: number;
}
/** Extract every RRWT assembly link (complex and simple form), oriented child -> parent. */
export declare function assemblyLinks(t: Table): AssemblyLink[];
//# sourceMappingURL=assembly.d.ts.map