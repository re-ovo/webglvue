import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {Mesh} from "../scene/actor.js";
import {Group, Scene} from "../scene/group.js";
import {ShaderMaterial} from "../scene/material.js";
import {BufferGeometry} from "../scene/geometery.js";

const STRUCT_JSON_CHUNK = 0x4E4F534A
const STRUCT_BIN_CHUNK = 0x004E4942

export async function loadGlb(path) {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(path)
    const scene = new Scene()
    console.log(gltf.scene)
    const handleObject = (object, parent) => {
        if (object.isMesh) {
            const material = new ShaderMaterial()
            Object.assign(material, object.material)

            const geometry = new BufferGeometry(
                {
                    position: object.geometry.attributes.position.array,
                    normal: object.geometry.attributes.normal.array,
                    uv: object.geometry.attributes.uv.array,
                },
                object.geometry.index.array
            )

            const mesh = new Mesh(geometry, material)
            mesh.position.set(object.position.x, object.position.y, object.position.z)
            mesh.rotation.set(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w)
            mesh.scale.set(object.scale.x, object.scale.y, object.scale.z)
            mesh.updateWorldMatrix()

            parent.add(mesh)
        } else if (object.children) {
            const group = new Group()

            group.position.set(object.position.x, object.position.y, object.position.z)
            group.rotation.set(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w)
            group.scale.set(object.scale.x, object.scale.y, object.scale.z)
            group.updateWorldMatrix()

            parent.add(group)

            object.children.forEach(child => handleObject(child, group))
        } else {
            console.log('Unknown object type')
        }
    }
    handleObject(gltf.scene, scene)
    return scene
}

// export async function loadGlb(path) {
//     const blob = await fetch(path).then(res => res.blob())
//     const arrayBuffer = await blob.arrayBuffer()
//
//     // The GLB file format header consists of three 4-byte entries:
//     const [magic, version, length] = new Uint32Array(arrayBuffer, 0, 3)
//     console.log({
//         magic,
//         version,
//         length
//     })
//
//     // The first 12 bytes of the file are the header, so we can skip them
//     let data = arrayBuffer.slice(12)
//
//     // Read chunks until we have no data left
//     while (data.byteLength > 0) {
//         const [chunkLength, chunkType] = new Uint32Array(data, 0, 2)
//         console.log('length: ' + chunkLength, 'type: 0x' + chunkType.toString(16))
//
//         if (chunkType === STRUCT_JSON_CHUNK) {
//             const jsonChunk = new Uint8Array(data, 8, chunkLength)
//             const json = JSON.parse(new TextDecoder('utf8').decode(jsonChunk))
//             console.log(json)
//         } else if (chunkType === STRUCT_BIN_CHUNK) {
//             const binChunk = new Uint8Array(data, 8, chunkLength)
//             console.log(binChunk)
//         } else {
//             console.log('Unknown chunk type: 0x' + chunkType.toString(16))
//         }
//
//         // Move to the next chunk, which starts at the end of this chunk
//         data = data.slice(chunkLength + 8)
//     }
//
//     return {
//         name: 'GLOB'
//     }
// }
