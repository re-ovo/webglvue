import {Vec3} from "../math/vec3.js";
import {Matrix4} from "../math/matrix4.js";
import transform from "../math/mvp/model.transform.js";
import {BufferGeometry} from "./geometery.js";
import {ShaderMaterial} from "./material.js";
import {Quaternion} from "../math/quaternion.js";

export class Actor {
    constructor() {
        this.position = new Vec3(0, 0, 0)
        this.rotation = new Quaternion(0, 0, 0, 1)
        this.scale = new Vec3(1, 1, 1)
        this.worldMatrix = Matrix4.identity()
        this.updateWorldMatrix()
    }

    rotateX(angle) {
        this.rotation.rotateX(angle)
        this.updateWorldMatrix()
    }

    rotateY(angle) {
        this.rotation.rotateY(angle)
        this.updateWorldMatrix()
    }

    rotateZ(angle) {
        this.rotation.rotateZ(angle)
        this.updateWorldMatrix()
    }

    updateWorldMatrix() {
        const rotationMatrix = this.rotation.toMatrix4()
        const translationMatrix = transform.translation(
            this.position.x,
            this.position.y,
            this.position.z
        )
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
            new BufferGeometry(
                {
                    // For cube, we do not use index buffer
                    // 6 faces, 2 triangles each, 3 vertices each
                    // 6 * 2 * 3 = 36
                    position: new Float32Array([
                        // Front face
                        -1.0, -1.0, 1.0,
                        1.0, -1.0, 1.0,
                        1.0, 1.0, 1.0,
                        -1.0, 1.0, 1.0,

                        // Back face
                        -1.0, -1.0, -1.0,
                        -1.0, 1.0, -1.0,
                        1.0, 1.0, -1.0,
                        1.0, -1.0, -1.0,

                        // Top face
                        -1.0, 1.0, -1.0,
                        -1.0, 1.0, 1.0,
                        1.0, 1.0, 1.0,
                        1.0, 1.0, -1.0,

                        // Bottom face
                        -1.0, -1.0, -1.0,
                        1.0, -1.0, -1.0,
                        1.0, -1.0, 1.0,
                        -1.0, -1.0, 1.0,

                        // Right face
                        1.0, -1.0, -1.0,
                        1.0, 1.0, -1.0,
                        1.0, 1.0, 1.0,
                        1.0, -1.0, 1.0,

                        // Left face
                        -1.0, -1.0, -1.0,
                        -1.0, -1.0, 1.0,
                        -1.0, 1.0, 1.0,
                        -1.0, 1.0, -1.0,
                    ]),
                    normal: new Float32Array([ // 8 normals
                        // Front face
                        0.0, 0.0, 1.0,
                        0.0, 0.0, 1.0,
                        0.0, 0.0, 1.0,
                        0.0, 0.0, 1.0,

                        // Back face
                        0.0, 0.0, -1.0,
                        0.0, 0.0, -1.0,
                        0.0, 0.0, -1.0,
                        0.0, 0.0, -1.0,

                        // Top face
                        0.0, 1.0, 0.0,
                        0.0, 1.0, 0.0,
                        0.0, 1.0, 0.0,
                        0.0, 1.0, 0.0,

                        // Bottom face
                        0.0, -1.0, 0.0,
                        0.0, -1.0, 0.0,
                        0.0, -1.0, 0.0,
                        0.0, -1.0, 0.0,

                        // Right face
                        1.0, 0.0, 0.0,
                        1.0, 0.0, 0.0,
                        1.0, 0.0, 0.0,
                        1.0, 0.0, 0.0,

                        // Left face
                        -1.0, 0.0, 0.0,
                        -1.0, 0.0, 0.0,
                        -1.0, 0.0, 0.0,
                        -1.0, 0.0, 0.0,
                    ]),
                },
                new Uint16Array([
                    0, 1, 2, 0, 2, 3,    // front
                    4, 5, 6, 4, 6, 7,    // back
                    8, 9, 10, 8, 10, 11,   // top
                    12, 13, 14, 12, 14, 15,   // bottom
                    16, 17, 18, 16, 18, 19,   // right
                    20, 21, 22, 20, 22, 23,   // left
                ]),
            ),
            new ShaderMaterial(),
        )
    }
}