<script setup>
import {onMounted, onUnmounted, ref} from "vue";
import {setupGL} from "./renderer/setup.js";
import {Renderer} from "./renderer/renderer.js";
import {loadGlb} from "./loader/glb.loader.js";
import {PerspectiveCamera} from "./scene/cam.js";
import {Vec3} from "./math/vec3.js";
import {GUI} from "dat.gui";
import {Controls} from "./scene/controls.js";

const containerRef = ref(null);
const currentFPS = ref(0)

let gui

onMounted(async () => {
  const gl = setupGL(containerRef.value)

  const renderer = new Renderer(containerRef.value, gl)

  const scene = await loadGlb('shotgun_remington_model_31_in_3_types_rigged.glb')
  // scene.rotation.x = -Math.PI / 2
  // scene.scale.set(0.1, 0.1, 0.1)
  scene.updateWorldMatrix()

  const camera = new PerspectiveCamera(
      60,
      gl.canvas.width / gl.canvas.height,
      0.1,
      10000
  )

  camera.position.set(10, 0, 5)
  camera.lookAt(new Vec3(0, 0, 0))
  camera.setTarget(new Vec3(0, 0, 0))
  camera.updateWorldMatrix()
  camera.updateProjectionMatrix()

  const controls = new Controls(containerRef.value, camera)
  const light = {
    angle: 0
  }

  let lastFpsUpdateTime = Date.now()
  let frames = 0

  function render() {
    controls.update()
    camera.updateAspectRatio(gl.canvas.width / gl.canvas.height)
    camera.updateWorldMatrix()
    // renderer.updateLightDirection(light.angle)

    renderer.render(scene, camera)

    const now = Date.now()
    frames++
    if (now - lastFpsUpdateTime > 1000) {
      currentFPS.value = Math.round((frames * 1000) / (now - lastFpsUpdateTime))
      lastFpsUpdateTime = now
      frames = 0
    }

    requestAnimationFrame(render)
  }

  render()

  gui = new GUI()
  const cameraFolder = gui.addFolder('相机位置')
  cameraFolder.add(camera.position, 'x', -100, 100)
  cameraFolder.add(camera.position, 'y', -100, 100)
  cameraFolder.add(camera.position, 'z', -100, 100)
  cameraFolder.open()

  const sceneFolder = gui.addFolder('场景')
  sceneFolder.add(scene.rotation, 'x', -Math.PI, Math.PI).name('场景旋转.X')
  sceneFolder.add(scene.rotation, 'y', -Math.PI, Math.PI).name('场景旋转.Y')
  sceneFolder.add(scene.rotation, 'z', -Math.PI, Math.PI).name('场景旋转.Z')
  sceneFolder.add(scene.scale, 'x', 0.1, 2).name('场景缩放.X')
  sceneFolder.add(scene.scale, 'y', 0.1, 2).name('场景缩放.Y')
  sceneFolder.add(scene.scale, 'z', 0.1, 2).name('场景缩放.Z')
  sceneFolder.open()

  const lightFolder = gui.addFolder('光照')
  lightFolder.add(light, 'angle', 0, 360).name('光照角度')
  lightFolder.add(renderer.lightDirection, 'x', -1.0, 1).name('光照方向.X')
  lightFolder.add(renderer.lightDirection, 'y', -1.0, 1).name('光照方向.Y')
  lightFolder.add(renderer.lightDirection, 'z', -1.0, 1).name('光照方向.Z')
  lightFolder.open()

  const controlsFolder = gui.addFolder('控制器')
  controlsFolder.add(controls, 'speed', 0.1, 1).name('移动速度')
  controlsFolder.add(controls, 'sensitivity', 0.001, 0.01)
  controlsFolder.open()
})

onUnmounted(() => {
  gui.destroy()
})
</script>

<template>
  <canvas ref="containerRef"/>
  <div class="fps">
    FPS: {{ currentFPS }}
  </div>
</template>

<style scoped>
.fps {
  position: absolute;
  top: 0;
  left: 0;
  color: #00ff00;
  font-size: 20px;
  padding: 10px;
}
</style>