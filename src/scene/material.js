import vertexShader from '../shader/vertex.glsl?raw'
import fragmentShader from '../shader/fragment.glsl?raw'

export const DEFAULT_VERTEX_SHADER = vertexShader
export const DEFAULT_FRAGMENT_SHADER = fragmentShader

export class ShaderMaterial {
    constructor(vertexShader = DEFAULT_VERTEX_SHADER, fragmentShader = DEFAULT_FRAGMENT_SHADER) {
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader
    }
}

