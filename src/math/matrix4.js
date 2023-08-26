import {inv, matrix, multiply, transpose} from "mathjs";
import {Vec3} from "./vec3.js";

export class Matrix4 {
    constructor(data) {
        this.elements = data || [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
    }

    static identity() {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ])
    }

    set(i, j, value) {
        this.elements[i * 4 + j] = value
    }

    get(i, j) {
        return this.elements[i * 4 + j]
    }

    mul(other) {
        return from_math_matrix(multiply(to_math_matrix(this), to_math_matrix(other)))
    }

    mulVec3(vec3) {
        let math_vec3 = matrix([
            [vec3.x],
            [vec3.y],
            [vec3.z],
            [1]
        ])
        let result = multiply(to_math_matrix(this), math_vec3)
        return new Vec3(
            result.get([0, 0]),
            result.get([1, 0]),
            result.get([2, 0])
        )
    }

    inverse() {
        return from_math_matrix(
            inv(
                to_math_matrix(
                    this
                )
            )
        )
    }

    transpose() {
        return from_math_matrix(
            transpose(
                to_math_matrix(
                    this
                )
            )
        )
    }

    equals(other) {
        return this.elements.every((value, index) => {
            return value === other.elements[index]
        })
    }

    toString() {
        let str = ""
        for (let i = 0; i < 16; i++) {
            str += this.elements[i].toFixed(2).toString().padStart(8, " ")
            if (i % 4 === 3) {
                str += "\n"
            }
        }
        return str
    }

    to_opengl_array() {
        // OpenGL采用列主序
        return [
            this.elements[0], this.elements[4], this.elements[8], this.elements[12],
            this.elements[1], this.elements[5], this.elements[9], this.elements[13],
            this.elements[2], this.elements[6], this.elements[10], this.elements[14],
            this.elements[3], this.elements[7], this.elements[11], this.elements[15],
        ]
    }
}

function to_math_matrix(matrix4) {
    let arr = []
    for (let i = 0; i < 4; i++) {
        arr.push(matrix4.elements.slice(i * 4, i * 4 + 4))
    }
    return matrix(arr)
}

function from_math_matrix(math_matrix) {
    let flat = math_matrix.toArray().flat()
    return new Matrix4(flat)
}
