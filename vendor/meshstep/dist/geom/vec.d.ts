export type Vec3 = readonly [number, number, number];
export declare const v: (x: number, y: number, z: number) => Vec3;
export declare const add: (a: Vec3, b: Vec3) => Vec3;
export declare const sub: (a: Vec3, b: Vec3) => Vec3;
export declare const scale: (a: Vec3, s: number) => Vec3;
export declare const mul: (a: Vec3, b: Vec3) => Vec3;
export declare const dot: (a: Vec3, b: Vec3) => number;
export declare const cross: (a: Vec3, b: Vec3) => Vec3;
export declare const len: (a: Vec3) => number;
export declare const len2: (a: Vec3) => number;
export declare const dist: (a: Vec3, b: Vec3) => number;
export declare const lerp: (a: Vec3, b: Vec3, t: number) => Vec3;
export declare const normalize: (a: Vec3) => Vec3;
/** Angle between two vectors in radians (numerically stable). */
export declare const angleBetween: (a: Vec3, b: Vec3) => number;
//# sourceMappingURL=vec.d.ts.map