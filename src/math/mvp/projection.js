import {Matrix4} from "../matrix4.js";

export default {
    // 正交投影
    orthographic(left, right, top, bottom, near, far) {
        const w = 1.0 / (right - left);
        const h = 1.0 / (top - bottom);
        const p = 1.0 / (far - near);

        const x = (right + left) * w;
        const y = (top + bottom) * h;
        const z = (far + near) * p;
        const zInv = -2 * p;

        return new Matrix4([
            2 * w, 0, 0, -x,
            0, 2 * h, 0, -y,
            0, 0, zInv, -z,
            0, 0, 0, 1
        ])
    },
    // 透视投影
    perspective(left, right, bottom, top, near, far) {
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);
        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);
        const c = -(far + near) / (far - near);
        const d = -2 * far * near / (far - near);
        return new Matrix4([
            x, 0, a, 0,
            0, -y, b, 0,
            0, 0, c, d,
            0, 0, -1, 0
        ])
    }
}
