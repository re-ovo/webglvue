import {Vec3} from "../math/vec3.js";
import {Matrix4} from "../math/matrix4.js";
import transform from "../math/mvp/model.transform.js";
import {BufferGeometry} from "./geometery.js";
import {ShaderMaterial} from "./material.js";

export class Actor {
    constructor() {
        this.position = new Vec3(0, 0, 0)
        this.rotation = new Vec3(0, 0, 0)
        this.scale = new Vec3(1, 1, 1)
        this.worldMatrix = Matrix4.identity()
        this.updateWorldMatrix()
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
        const scaleMatrix = transform.scale(
            this.scale.x,
            this.scale.y,
            this.scale.z
        )
        this.worldMatrix = translationMatrix.mul(rotationMatrix).mul(scaleMatrix)
    }
}

export class Mesh extends Actor {
    constructor(geometry, material) {
        super()
        this.geometry = geometry
        this.material = material
    }
}

export class Cube extends Mesh {
    constructor() {
        super(
            new BufferGeometry({
                position: new Float32Array([ // 8 points
                    -1, -1, -1, // 0
                    -1, -1, 1, // 1
                    -1, 1, -1, // 2
                    -1, 1, 1, // 3
                    1, -1, -1, // 4
                    1, -1, 1, // 5
                    1, 1, -1, // 6
                    1, 1, 1,
                ])
            }, new Uint16Array([ // 12 triangles
                0, 2, 1, // -x
                1, 2, 3,
                4, 5, 6, // +x
                5, 7, 6,
                0, 1, 5, // -y
                0, 5, 4,
                2, 6, 7, // +y
                2, 7, 3,
                0, 4, 6, // -z
                0, 6, 2,
                1, 3, 7, // +z
                1, 7, 5,
            ])),
            new ShaderMaterial(),
        )
    }
}