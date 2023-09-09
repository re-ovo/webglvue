import {createProgram, createShader} from "./setup.js";
import {DirectionalLight} from "../scene/light/directional.light.js";
import {AmbientLight} from "../scene/light/ambient.light.js";
import {OrthographicCamera} from "../scene/camera/orthographic.camera.js";
import {Vec3} from "../math/vec3.js";
import {Matrix4} from "../math/matrix4.js";
import {PerspectiveCamera} from "../scene/camera/perspective.camera.js";

export class Renderer {
    constructor(canvas, gl) {
        this.gl = gl
        this.canvas = canvas

        this.lights = []

        this.programs = new Map()
        this.vaos = new Map()
        this.texture = new Map()

        this.directionalLightCam = new OrthographicCamera()
        this.directionalLightCam.updateSize(100, 100)
        this.directionalLightCam.position = new Vec3(35, 3, 3)
        this.directionalLightCam.lookAt(new Vec3(0, 0, 0))
        this.directionalLightCam.updateWorldMatrix()
        this.directionalLightCam.updateProjectionMatrix()
        this.lightSize = 1
    }

    getLight(type) {
        return this.lights.filter(light => light.constructor.name === type)
    }

    shadowLightLookAt(target) {
        this.directionalLightCam.lookAt(target)
        this.directionalLightCam.updateWorldMatrix()
    }

    render(scene, camera) {
        const gl = this.gl

        let directionalLightCam = this.directionalLightCam

        const depthTextureSize = 1024 * 2
        const depthTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, depthTexture)
        gl.texImage2D(
            gl.TEXTURE_2D, // 目标
            0, // 贴图级别
            gl.DEPTH_COMPONENT32F, // 内部格式
            depthTextureSize, // 宽
            depthTextureSize, // 高
            0, // 边框
            gl.DEPTH_COMPONENT, // 格式
            gl.FLOAT, // 类型
            null
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        const depthFramebuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, // 目标
            gl.DEPTH_ATTACHMENT, // 附着点
            gl.TEXTURE_2D, // 纹理目标
            depthTexture, // 纹理
            0
        )

        // 渲染shadow map
        this.preparePass({
            width: depthTextureSize,
            height: depthTextureSize,
        })
        this.depthTexture = null
        this.depthTextureMatrix = null
        // gl.cullFace(gl.FRONT)
        this.render0(scene, directionalLightCam)
        // gl.cullFace(gl.BACK)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        this.depthTexture = depthTexture
        this.depthTextureMatrix = directionalLightCam.projectionMatrix.mul(directionalLightCam.worldMatrixInverse)

        // 正式渲染
        this.preparePass({
            width: this.canvas.width,
            height: this.canvas.height
        })
        this.render0(scene, camera)

        // 清理shadow map相关资源
        gl.deleteTexture(depthTexture)
        gl.deleteFramebuffer(depthFramebuffer)
    }

    preparePass(viewportSize) {
        const gl = this.gl

        gl.viewport(0, 0, viewportSize.width, viewportSize.height)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.CULL_FACE)
    }

    render0(scene, camera) {
        const gl = this.gl

        let stack = [scene]
        let opaque = []
        let transparent = []

        while (stack.length > 0) {
            let node = stack.pop()

            // Render Mesh
            node.updateWorldMatrix()

            if (node.material && node.geometry) {
                if (node.material.transparent === false || node.material.transparent === undefined) {
                    opaque.push(node)
                } else {
                    transparent.push(node)
                }
            }

            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    stack.push(node.children[i])
                }
            }
        }

        // 先渲染不透明的物体
        for (let i = 0; i < opaque.length; i++) {
            this.renderNode(opaque[i], camera)
        }

        // 再渲染透明的物体
        gl.depthMask(false) // 暂时关闭深度写入，防止透明物体遮挡后面的物体
        transparent.sort((a, b) => {
            let aDistance = a.position.distance(camera.position)
            let bDistance = b.position.distance(camera.position)
            return bDistance - aDistance
        })
        for (let i = 0; i < transparent.length; i++) {
            this.renderNode(transparent[i], camera)
        }
        gl.depthMask(true)
    }

    computeWorldMatrix(node) {
        let worldMatrix = node.worldMatrix;
        let parent = node.parent;
        while (parent) {
            worldMatrix = parent.worldMatrix.mul(worldMatrix);
            // worldMatrix = worldMatrix.mul(parent.worldMatrix)
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
        // console.log('opacity', node.material.opacity)

        let program = this.getMaterialProgram(node.material)
        gl.useProgram(program)

        // set up uniforms
        let worldMatrixLocation = gl.getUniformLocation(program, "u_worldMatrix")
        let viewMatrixLocation = gl.getUniformLocation(program, "u_viewMatrix")
        let projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix")
        let shadowMatrixLocation = gl.getUniformLocation(program, "u_shadowMatrix")
        let cameraPosLocation = gl.getUniformLocation(program, "u_cameraPos")
        let useNormalMapLocation = gl.getUniformLocation(program, "u_useNormalMap")
        let worldMatrix = this.computeWorldMatrix(node)
        let opacityLocation = gl.getUniformLocation(program, "u_opacity")
        let lightSizeLocation = gl.getUniformLocation(program, "u_lightSize")
        gl.uniformMatrix4fv(worldMatrixLocation, false, worldMatrix.to_opengl_array())
        gl.uniformMatrix4fv(viewMatrixLocation, false, camera.worldMatrixInverse.to_opengl_array())
        gl.uniformMatrix4fv(projectionMatrixLocation, false, camera.projectionMatrix.to_opengl_array())
        gl.uniformMatrix4fv(shadowMatrixLocation, false, this.depthTextureMatrix?.to_opengl_array() ?? Matrix4.identity().to_opengl_array())
        gl.uniform3fv(cameraPosLocation, camera.position.to_array())
        gl.uniform1i(useNormalMapLocation, node.material.normalMap ? 1 : 0)
        gl.uniform1f(opacityLocation, node.material.opacity ?? 1)
        gl.uniform1f(lightSizeLocation, this.lightSize)

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
        let depthTextureLocation = gl.getUniformLocation(program, "u_depthMap")

        {
            gl.activeTexture(gl.TEXTURE0)
            let texture = this.getTexture(node.material.map?.image)
            if (!texture) {
                texture = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, texture)
                let color = {
                    r: node.material.color?.x ?? 1,
                    g: node.material.color?.y ?? 1,
                    b: node.material.color?.z ?? 1,
                }
                let data = new Uint8Array([255 * color.r, 255 * color.g, 255 * color.b, 255])
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
            }
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.uniform1i(textureColorLocation, 0)
        }

        {
            gl.activeTexture(gl.TEXTURE1)
            let texture = this.getTexture(node.material.normalMap?.image)
            // if (!texture) {
            //     console.log('use default normal map')
            // }
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.uniform1i(textureNormalLocation, 1)
        }

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

        {
            gl.activeTexture(gl.TEXTURE6)
            gl.bindTexture(gl.TEXTURE_2D, this.depthTexture)
            gl.uniform1i(depthTextureLocation, 6)
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

            // let barycentricBuffer = gl.createBuffer()
            // gl.bindBuffer(gl.ARRAY_BUFFER, barycentricBuffer)
            // let barycentric = new Float32Array(geometry.attributes.position.length)
            // geometry.index.forEach((index, i) => {
            //     let bary = i % 3 === 0 ? [1, 0, 0] : i % 3 === 1 ? [0, 1, 0] : [0, 0, 1];
            //     barycentric.set(bary, index * 3)
            // });
            // gl.bufferData(gl.ARRAY_BUFFER, barycentric, gl.STATIC_DRAW)
            // let barycentricAttributeLocation = gl.getAttribLocation(program, "a_barycentric")
            // gl.enableVertexAttribArray(barycentricAttributeLocation)
            // gl.bindBuffer(gl.ARRAY_BUFFER, barycentricBuffer)
            // gl.vertexAttribPointer(barycentricAttributeLocation, 3, gl.FLOAT, false, 0, 0)


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
