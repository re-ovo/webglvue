import {Matrix4} from "../matrix4.js";

export default {
    // 正交投影
    orthographic(width, height, depth) {
        return new Matrix4([
            2 / width, 0, 0, -1,
            0, -2 / height, 0, 1,
            0, 0, 2 / depth, -1,
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