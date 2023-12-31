import {Actor} from "../actor.js";
import projection from "../../math/mvp/projection.js";
import {Vec3} from "../../math/vec3.js";

export class OrthographicCamera extends Actor {
    constructor(left = -1, right = 1, bottom = -1, top = 1, near = 0.1, far = 1000) {
        super()

        this.left = left
        this.right = right
        this.bottom = bottom
        this.top = top
        this.near = near
        this.far = far

        this.updateProjectionMatrix()
        this.updateWorldMatrix()
    }

    updateSize(width, height) {
        this.left = -width / 2
        this.right = width / 2
        this.bottom = -height / 2
        this.top = height / 2
        // this.updateProjectionMatrix()
    }

    updateProjectionMatrix() {
        const dx = (this.right - this.left) / 2
        const dy = (this.top - this.bottom) / 2
        const cx = (this.right + this.left) / 2
        const cy = (this.top + this.bottom) / 2
        const left = cx - dx
        const right = cx + dx
        const bottom = cy - dy
        const top = cy + dy
        this.projectionMatrix = projection.orthographic(
            left,
            right,
            top,
            bottom,
            this.near,
            this.far
        )
    }

    updateWorldMatrix() {
        super.updateWorldMatrix()
        this.worldMatrixInverse = this.worldMatrix.inverse()
    }

    updateAspectRatio(aspect) {
    }

    lookAt(target) {
        let direction = target.subtract(this.position).normalize();
        let newTarget = this.position.add(direction.negate());

        // Actor的lookAt默认朝向Z+轴，而摄像机默认朝向Z-轴，所以需要基于摄像机
        // 的位置进行反转
        super.lookAt(newTarget);
    }

    rotate(deltaX, deltaY, speed = 0.01) {
        let x = -deltaY * speed
        let y = -deltaX * speed
        let euler = this.rotation.toEuler()
        euler.x += x
        euler.y += y
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
