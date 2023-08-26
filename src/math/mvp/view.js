import {Matrix4} from "../matrix4.js";

export default {
    lookAt(cameraPosition, target, up) {
        const zAxis = cameraPosition.subtract(target).normalize();
        const xAxis = up.cross(zAxis).normalize();
        const yAxis = zAxis.cross(xAxis).normalize();

        return new Matrix4([
            xAxis.x, yAxis.x, zAxis.x, cameraPosition.x,
            xAxis.y, yAxis.y, zAxis.y, cameraPosition.y,
            xAxis.z, yAxis.z, zAxis.z, cameraPosition.z,
            0, 0, 0, 1
        ])
    }
}