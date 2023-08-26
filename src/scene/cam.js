import {Vec3} from "../math/vec3.js";
import projection from "../math/mvp/projection.js";
import transform from "../math/mvp/model.transform.js";
import {degToRad} from "three/src/math/MathUtils.js";

export class PerspectiveCamera {
    constructor(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.position = new Vec3(0, 0, 0)
        this.rotation = new Vec3(0, 0, 0)
        this.target = null

        this.updateProjectionMatrix()
        this.updateWorldMatrix()
    }

    updateAspectRatio(aspect) {
        this.aspect = aspect
        this.updateProjectionMatrix()
    }

    updateProjectionMatrix() {
        const fovRad = degToRad(this.fov)
        const top = this.near * Math.tan(fovRad / 2)
        const height = 2 * top
        const width = this.aspect * height
        const left = -width / 2.0

        this.projectionMatrix = projection.perspective(
            left,
            left + width,
            top,
            top - height,
            this.near,
            this.far
        )
    }

    lookAt(target, update = true) {
        const dir = target.subtract(this.position).normalize()
        const x = Math.asin(dir.y)
        const y = -Math.atan2(dir.x, -dir.z)
        this.rotation = new Vec3(x, y, 0)
        if (update) this.updateWorldMatrix()
    }

    setTarget(target) {
        this.target = target
        this.lookAt(target)
    }

    updateWorldMatrix() {
        const xRotationMatrix = transform.xRotation(this.rotation.x)
        const yRotationMatrix = transform.yRotation(this.rotation.y)
        const zRotationMatrix = transform.zRotation(this.rotation.z)
        const translationMatrix = transform.translation(
            this.position.x,
            this.position.y,
            this.position.z
        )
        const rotationMatrix = zRotationMatrix.mul(yRotationMatrix).mul(xRotationMatrix)
        this.worldMatrix = translationMatrix.mul(rotationMatrix)
        this.worldMatrixInverse = this.worldMatrix.inverse()
    }

    move(forward, strafe, speed) {
        if (forward === 0 && strafe === 0) return

        // forward, strafe in [-1, 0, 1]
        // forward: 1 = forward, -1 = backward, 0 = none
        // strafe: 1 = right, -1 = left, 0 = none
        const forwardVec = new Vec3(
            -Math.sin(this.rotation.y),
            0,
            -Math.cos(this.rotation.y)
        );
        const rightVec = new Vec3(
            Math.cos(this.rotation.y),
            0,
            -Math.sin(this.rotation.y)
        );

        this.position.x += forward * forwardVec.x * speed + strafe * rightVec.x * speed
        this.position.y += forward * forwardVec.y * speed + strafe * rightVec.y * speed
        this.position.z += forward * forwardVec.z * speed + strafe * rightVec.z * speed

        this.updateWorldMatrix()
    }

    moveUp(delta) {
        if (delta === 0) return
        this.position.y += delta
        this.updateWorldMatrix()
    }

    rotate(deltaX, deltaY, speed = 0.01) {
        if (this.target) {
            // 计算摄像机位置与目标点之间的向量
            let dir = this.position.subtract(this.target);

            // 计算旋转角度
            let angleX = -deltaY * speed;
            let angleY = -deltaX * speed;

            // 创建旋转矩阵
            let rotationMatrixX = transform.xRotation(angleX);
            let rotationMatrixY = transform.yRotation(angleY);

            // 对向量进行旋转
            dir = rotationMatrixX.mulVec3(dir);
            dir = rotationMatrixY.mulVec3(dir);

            // 更新摄像机位置
            this.position = this.target.add(dir);

            // 更新摄像机的世界矩阵
            this.lookAt(this.target, true)
        } else {
            // Update the camera's rotation based on the mouse delta values
            this.rotation.x += -deltaY * speed;
            this.rotation.y += -deltaX * speed;

            // Update the camera's world matrix
            this.updateWorldMatrix();
        }
    }
}
