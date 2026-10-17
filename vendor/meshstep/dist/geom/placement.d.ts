import type { Vec3 } from "./vec.ts";
import { Table } from "../step/entities.ts";
export interface Frame {
    o: Vec3;
    x: Vec3;
    y: Vec3;
    z: Vec3;
}
export declare function readPoint(t: Table, id: number, s: number): Vec3;
export declare function readDirection(t: Table, id: number): Vec3;
/** Build an orthonormal frame from AXIS2_PLACEMENT_3D(name, location, axis?, refDirection?). */
export declare function readPlacement(t: Table, id: number, s: number): Frame;
//# sourceMappingURL=placement.d.ts.map