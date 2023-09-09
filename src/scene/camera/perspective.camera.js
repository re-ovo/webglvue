import {Actor} from "../actor.js";
import {Vec3} from "../../math/vec3.js";
import {degToRad} from "three/src/math/MathUtils.js";
import projection from "../../math/mvp/projection.js";
import {Quaternion} from "../../math/quaternion.js";

export class PerspectiveCamera extends Actor {
    constructor(fov, aspect, near, far) {
        super()

        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.updateProjectionMatrix()
        this.updateWorldMatrix()
    }

    lookAt(target) {
        let direction = target.subtract(this.position).normalize();
        let newTarget = this.position.add(direction.negate());

        // Actor的lookAt默认朝向Z+轴，而摄像机默认朝向Z-轴，所以需要基于摄像机
        // 的位置进行反转
        super.lookAt(newTarget);
    }

    getDirection() {
        let direction = new Vec3(0, 0, -1);
        let matrix = this.rotation.toMatrix4().mulVec3(direction);
        return matrix.normalize();
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

    updateWorldMatrix() {
        super.updateWorldMatrix()
        this.worldMatrixInverse = this.worldMatrix.inverse()
        this.rotationMatrixInverse = this.rotation.toMatrix4().inverse()
    }

    rotate(deltaX, deltaY, speed = 0.01) {
        let x = -deltaY * speed
        let y = -deltaX * speed
        let euler = this.rotation.toEuler()
        euler.x += x
        euler.y += y
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x))
        this.rotation.setFromEuler(euler)
        this.updateWorldMatrix()
    }

    move(forward, strafe, speed) {
        if (forward === 0 && strafe === 0) return

        // forward, strafe in [-1, 0, 1]
        // forward: 1 = forward, -1 = backward, 0 = none
        // strafe: 1 = right, -1 = left, 0 = none
        const rotation = this.rotation.toEuler()
        const forwardVec = new Vec3(
            -Math.sin(rotation.y),
            0,
            -Math.cos(rotation.y)
        );
        const rightVec = new Vec3(
            Math.cos(rotation.y),
            0,
            -Math.sin(rotation.y)
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
}