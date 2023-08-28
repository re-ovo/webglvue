import {Vec3} from "./vec3.js";
import {Matrix4} from "./matrix4.js";

export class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    static fromEuler(euler) {
        const x = euler.x, y = euler.y, z = euler.z
        const cos = Math.cos
        const sin = Math.sin
        const c1 = cos(x / 2)
        const c2 = cos(y / 2)
        const c3 = cos(z / 2)
        const s1 = sin(x / 2)
        const s2 = sin(y / 2)
        const s3 = sin(z / 2)
        return new Quaternion(
            s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3
        )
    }

    static fromMatrix4(matrix) {
        const w = Math.sqrt(1 + matrix.get(0, 0) + matrix.get(1, 1) + matrix.get(2, 2)) / 2
        const w4 = (4 * w)
        const x = (matrix.get(2, 1) - matrix.get(1, 2)) / w4
        const y = (matrix.get(0, 2) - matrix.get(2, 0)) / w4
        const z = (matrix.get(1, 0) - matrix.get(0, 1)) / w4
        return new Quaternion(x, y, z, w)
    }

    set(x, y, z, w) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
        return this
    }

    multiply(quaternion) {
        const x = this.x, y = this.y, z = this.z, w = this.w
        const qx = quaternion.x, qy = quaternion.y, qz = quaternion.z, qw = quaternion.w
        const result = new Quaternion()
        result.x = x * qw + w * qx + y * qz - z * qy
        result.y = y * qw + w * qy + z * qx - x * qz
        result.z = z * qw + w * qz + x * qy - y * qx
        result.w = w * qw - x * qx - y * qy - z * qz
        return result
    }

    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w)
    }

    equals(quaternion) {
        return (quaternion.x === this.x) && (quaternion.y === this.y) && (quaternion.z === this.z) && (quaternion.w === this.w)
    }

    setFromEuler(euler) {
        const x = euler.x, y = euler.y, z = euler.z
        const cos = Math.cos
        const sin = Math.sin
        const c1 = cos(x / 2)
        const c2 = cos(y / 2)
        const c3 = cos(z / 2)
        const s1 = sin(x / 2)
        const s2 = sin(y / 2)
        const s3 = sin(z / 2)
        this.x = s1 * c2 * c3 + c1 * s2 * s3
        this.y = c1 * s2 * c3 - s1 * c2 * s3
        this.z = c1 * c2 * s3 + s1 * s2 * c3
        this.w = c1 * c2 * c3 - s1 * s2 * s3
        return this
    }

    toEuler() {
        const x = this.x, y = this.y, z = this.z, w = this.w
        const cos = Math.cos
        const sin = Math.sin
        const euler = new Vec3()
        const c1 = cos(x / 2)
        const c2 = cos(y / 2)
        const c3 = cos(z / 2)
        const s1 = sin(x / 2)
        const s2 = sin(y / 2)
        const s3 = sin(z / 2)
        euler.x = Math.atan2(2 * (w * s1 * s2 * c3 + c1 * c2 * s3), 1 - 2 * (s1 * s1 * c2 * c2 + c1 * c1 * s3 * s3))
        euler.y = Math.asin(2 * (w * c1 * c2 * s3 - s1 * s2 * c3))
        euler.z = Math.atan2(2 * (w * s1 * c2 * s3 + c1 * s2 * c3), 1 - 2 * (s1 * s1 * s2 * s2 + c1 * c1 * c3 * c3))
        return euler
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)
    }

    normalize() {
        let length = this.length()
        if (length === 0) {
            this.x = 0
            this.y = 0
            this.z = 0
            this.w = 1
        } else {
            length = 1 / length
            this.x = this.x * length
            this.y = this.y * length
            this.z = this.z * length
            this.w = this.w * length
        }
        return this
    }

    toMatrix4() {
        let x2 = this.x * this.x;
        let y2 = this.y * this.y;
        let z2 = this.z * this.z;
        let xy = this.x * this.y;
        let xz = this.x * this.z;
        let yz = this.y * this.z;
        let wx = this.w * this.x;
        let wy = this.w * this.y;
        let wz = this.w * this.z;
        return new Matrix4([
            1 - 2 * (y2 + z2), 2 * (xy - wz), 2 * (xz + wy), 0,
            2 * (xy + wz), 1 - 2 * (x2 + z2), 2 * (yz - wx), 0,
            2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (x2 + y2), 0,
            0, 0, 0, 1
        ])
    }
}
