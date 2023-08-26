import {createProgram, createShader} from "./setup.js";
import {DirectionalLight} from "../scene/light/directional.light.js";
import {AmbientLight} from "../scene/light/ambient.light.js";
import {showTexture} from "../util/texture.debugger.js";

export class Renderer {
    constructor(canvas, gl) {
        this.gl = gl
        this.canvas = canvas

        this.lights = []

        this.programs = new Map()
        this.vaos = new Map()
        this.texture = new Map()
    }

    getLight(type) {
        return this.lights.filter(light => light.constructor.name === type)
    }

    render(scene, camera) {
        const gl = this.gl

        gl.viewport(0, 0, this.canvas.width, this.canvas.height)

        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.CULL_FACE)

        let stack = [scene]

        while (stack.length > 0) {
            let node = stack.pop()

            // Render Mesh
            node.updateWorldMatrix()
            if (node.material && node.geometry) {
                this.renderNode(node, camera)
            }

            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    stack.push(node.children[i])
                }
            }
        }
    }

    computeWorldMatrix(node) {
        let worldMatrix = node.worldMatrix;
        let parent = node.parent;
        while (parent) {
            worldMatrix = parent.worldMatrix.mul(worldMatrix);
            parent = parent.parent;
        }
        return worldMatrix;
    }

    renderNode(node, camera) {
        const gl = this.gl

        // console.log("%crender node", "color: red")
        // console.log(node.material)
        // console.log(node.envMap)
        // console.log('ao', node.material.aoMap)
        // console.log('map', node.material.map)
        // console.log('metalness', node.material.metalnessMap)
        // console.log('normal', node.material.normalMap)
        // console.log('roughness', node.material.roughnessMap)
        // showTexture(node.material.map?.image, 'color')
        // showTexture(node.material.normalMap?.image, 'normal')
        // showTexture(node.material.aoMap?.image, 'ao (channel R)')
        // showTexture(node.material.roughnessMap?.image, 'roughness (channel G)')
        // showTexture(node.material.metalnessMap?.image, 'metalness (channel B)')


        let program = this.getMaterialProgram(node.material)
        gl.useProgram(program)

        // set up uniforms
        let worldMatrixLocation = gl.getUniformLocation(program, "u_worldMatrix")
        let viewMatrixLocation = gl.getUniformLocation(program, "u_viewMatrix")
        let projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix")
        let cameraPosLocation = gl.getUniformLocation(program, "u_cameraPos")
        let worldMatrix = this.computeWorldMatrix(node)
        gl.uniformMatrix4fv(worldMatrixLocation, false, worldMatrix.to_opengl_array())
        gl.uniformMatrix4fv(viewMatrixLocation, false, camera.worldMatrixInverse.to_opengl_array())
        gl.uniformMatrix4fv(projectionMatrixLocation, false, camera.projectionMatrix.to_opengl_array())
        gl.uniform3fv(cameraPosLocation, camera.position.to_array())

        // set up lights
        let ambientLight = this.getLight('AmbientLight')[0]
        gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight.color"), ambientLight.color.to_array())
        gl.uniform1f(gl.getUniformLocation(program, "u_ambientLight.intensity"), ambientLight.intensity)
        let directionalLight = this.getLight('DirectionalLight')[0]
        gl.uniform3fv(gl.getUniformLocation(program, "u_directionalLight.color"), directionalLight.color.to_array())
        gl.uniform1f(gl.getUniformLocation(program, "u_directionalLight.intensity"), directionalLight.intensity)
        gl.uniform3fv(gl.getUniformLocation(program, "u_directionalLight.direction"), directionalLight.direction.to_array())
        let pointLight = this.getLight('PointLight')[0]
        gl.uniform3fv(gl.getUniformLocation(program, "u_pointLight.color"), pointLight.color.to_array())
        gl.uniform1f(gl.getUniformLocation(program, "u_pointLight.intensity"), pointLight.intensity)
        gl.uniform3fv(gl.getUniformLocation(program, "u_pointLight.position"), pointLight.position.to_array())

        // set up vao
        let vao = this.getGeometryVao(program, node.geometry)
        gl.bindVertexArray(vao)

        // set up texture
        let textureColorLocation = gl.getUniformLocation(program, "u_texture")
        let textureNormalLocation = gl.getUniformLocation(program, "u_normalMap")
        let textureMetalnessLocation = gl.getUniformLocation(program, "u_metallicMap")
        let textureRoughnessLocation = gl.getUniformLocation(program, "u_roughnessMap")
        let textureAOLocation = gl.getUniformLocation(program, "u_aoMap")

        // console.log('set up texture color')
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.getTexture(node.material.map?.image))
        gl.uniform1i(textureColorLocation, 0)

        // console.log('set up texture normal')
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.getTexture(node.material.normalMap?.image))
        gl.uniform1i(textureNormalLocation, 1)

        {
            gl.activeTexture(gl.TEXTURE4)
            let texture = this.getTexture(node.material.aoMap?.image)
            if (!texture) {
                texture = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, texture)
                let data = new Uint8Array([255, 0, 0, 255])
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
                // console.log('use default ao map')
            }
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.uniform1i(textureAOLocation, 4)
        }

        {
            gl.activeTexture(gl.TEXTURE3)
            let texture = this.getTexture(node.material.roughnessMap?.image)
            if (!texture) {
                texture = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, texture)
                let roughness = node.material.roughness
                let data = new Uint8Array([0, 255 * roughness, 0, 255])
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
                // console.log('use default roughness map: ', roughness)
            }
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.uniform1i(textureRoughnessLocation, 3)
        }

        {
            gl.activeTexture(gl.TEXTURE2)
            let texture = this.getTexture(node.material.metalnessMap?.image)
            if (!texture) {
                texture = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, texture)
                let metalness = node.material.metalness
                let data = new Uint8Array([0, 0, 255 * metalness, 255])
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
                // console.log('use default metalness map: ', metalness)
            }
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.uniform1i(textureMetalnessLocation, 2)
        }

        // draw
        gl.drawElements(gl.TRIANGLES, node.geometry.index.length, gl.UNSIGNED_SHORT, 0);
    }

    getMaterialProgram(material) {
        const gl = this.gl

        let program = this.programs.get(material)

        if (!program) {
            const vertexShader = createShader(gl, gl.VERTEX_SHADER, material.vertexShader)
            const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, material.fragmentShader)
            program = createProgram(gl, vertexShader, fragmentShader)
            this.programs.set(material, program)
        }

        return program
    }

    getGeometryVao(program, geometry) {
        const gl = this.gl

        let vao = this.vaos.get(geometry)

        if (!vao) {
            vao = gl.createVertexArray()
            gl.bindVertexArray(vao)

            // write position data and index data to buffers
            let positionBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, geometry.attributes.position, gl.STATIC_DRAW)

            let positionAttributeLocation = gl.getAttribLocation(program, "a_position")
            gl.enableVertexAttribArray(positionAttributeLocation)
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)

            let barycentricBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, barycentricBuffer)
            let barycentric = new Float32Array(geometry.attributes.position.length)
            geometry.index.forEach((index, i) => {
                let bary = i % 3 === 0 ? [1, 0, 0] : i % 3 === 1 ? [0, 1, 0] : [0, 0, 1];
                barycentric.set(bary, index * 3)
            });
            gl.bufferData(gl.ARRAY_BUFFER, barycentric, gl.STATIC_DRAW)

            let barycentricAttributeLocation = gl.getAttribLocation(program, "a_barycentric")
            gl.enableVertexAttribArray(barycentricAttributeLocation)
            gl.bindBuffer(gl.ARRAY_BUFFER, barycentricBuffer)
            gl.vertexAttribPointer(barycentricAttributeLocation, 3, gl.FLOAT, false, 0, 0)

            // write normal data to buffer
            let normalBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, geometry.attributes.normal, gl.STATIC_DRAW)

            let normalAttributeLocation = gl.getAttribLocation(program, "a_normal")
            gl.enableVertexAttribArray(normalAttributeLocation)
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
            gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0)

            // set up texture attribute
            let textureBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, geometry.attributes.uv, gl.STATIC_DRAW)

            let textureAttributeLocation = gl.getAttribLocation(program, "a_texcoord")
            gl.enableVertexAttribArray(textureAttributeLocation)
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer)
            gl.vertexAttribPointer(textureAttributeLocation, 2, gl.FLOAT, false, 0, 0)

            // index
            let indexBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
            // Warning: 这里需要使用Uint16Array，WebGL只支持Uint16Array和Uint8Array（默认）
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.index), gl.STATIC_DRAW)

            this.vaos.set(geometry, vao)
        }

        return vao
    }

    getTexture(image) {
        if (!image) {
            return null
        }

        const gl = this.gl
        let texture = this.texture.get(image)

        if (!texture) {
            texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            )
            gl.generateMipmap(gl.TEXTURE_2D)

            this.texture.set(image, texture)
        }

        return texture
    }
}
