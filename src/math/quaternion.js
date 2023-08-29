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
        const c1 = Math.cos(euler.x / 2);
        const c2 = Math.cos(euler.y / 2);
        const c3 = Math.cos(euler.z / 2);

        const s1 = Math.sin(euler.x / 2);
        const s2 = Math.sin(euler.y / 2);
        const s3 = Math.sin(euler.z / 2);

        const _x = s1 * c2 * c3 + c1 * s2 * s3;
        const _y = c1 * s2 * c3 - s1 * c2 * s3;
        const _z = c1 * c2 * s3 + s1 * s2 * c3;
        const _w = c1 * c2 * c3 - s1 * s2 * s3;

        return new Quaternion(_x, _y, _z, _w);
    }

    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
    static fromRotationMatrix4(matrix) {
        const trace = matrix.get(0, 0) + matrix.get(1, 1) + matrix.get(2, 2);
        let w, x, y, z;

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            w = 0.25 / s;
            x = (matrix.get(2, 1) - matrix.get(1, 2)) * s;
            y = (matrix.get(0, 2) - matrix.get(2, 0)) * s;
            z = (matrix.get(1, 0) - matrix.get(0, 1)) * s;
        } else if ((matrix.get(0, 0) > matrix.get(1, 1)) && (matrix.get(0, 0) > matrix.get(2, 2))) {
            const s = 2.0 * Math.sqrt(1.0 + matrix.get(0, 0) - matrix.get(1, 1) - matrix.get(2, 2));
            w = (matrix.get(2, 1) - matrix.get(1, 2)) / s;
            x = 0.25 * s;
            y = (matrix.get(0, 1) + matrix.get(1, 0)) / s;
            z = (matrix.get(0, 2) + matrix.get(2, 0)) / s;
        } else if (matrix.get(1, 1) > matrix.get(2, 2)) {
            const s = 2.0 * Math.sqrt(1.0 + matrix.get(1, 1) - matrix.get(0, 0) - matrix.get(2, 2));
            w = (matrix.get(0, 2) - matrix.get(2, 0)) / s;
            x = (matrix.get(0, 1) + matrix.get(1, 0)) / s;
            y = 0.25 * s;
            z = (matrix.get(1, 2) + matrix.get(2, 1)) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + matrix.get(2, 2) - matrix.get(0, 0) - matrix.get(1, 1));
            w = (matrix.get(1, 0) - matrix.get(0, 1)) / s;
            x = (matrix.get(0, 2) + matrix.get(2, 0)) / s;
            y = (matrix.get(1, 2) + matrix.get(2, 1)) / s;
            z = 0.25 * s;
        }

        return new Quaternion(x, y, z, w);
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
        const cy = Math.cos(euler.z * 0.5);
        const sy = Math.sin(euler.z * 0.5);
        const cp = Math.cos(euler.y * 0.5);
        const sp = Math.sin(euler.y * 0.5);
        const cr = Math.cos(euler.x * 0.5);
        const sr = Math.sin(euler.x * 0.5);

        this.w = cy * cp * cr + sy * sp * sr;
        this.x = cy * cp * sr - sy * sp * cr;
        this.y = sy * cp * sr + cy * sp * cr;
        this.z = sy * cp * cr - cy * sp * sr;

        return this
    }

    toEuler() {
        let roll, pitch, yaw;
        let test = this.x * this.y + this.z * this.w;
        if (test > 0.499) { // singularity at north pole
            roll = 2 * Math.atan2(this.x, this.w);
            pitch = Math.PI / 2;
            yaw = 0;
        } else if (test < -0.499) { // singularity at south pole
            roll = -2 * Math.atan2(this.x, this.w);
            pitch = -Math.PI / 2;
            yaw = 0;
        } else {
            let sqx = this.x * this.x;
            let sqy = this.y * this.y;
            let sqz = this.z * this.z;
            roll = Math.atan2(2 * this.y * this.w - 2 * this.x * this.z, 1 - 2 * sqy - 2 * sqz);
            pitch = Math.asin(2 * test);
            yaw = Math.atan2(2 * this.x * this.w - 2 * this.y * this.z, 1 - 2 * sqx - 2 * sqz);
        }
        return new Vec3(roll, pitch, yaw)
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
