<script setup>
import {onMounted, onUnmounted, ref} from "vue";
import {setupGL} from "./renderer/setup.js";
import {Renderer} from "./renderer/renderer.js";
import {loadGlb} from "./loader/glb.loader.js";
import {PerspectiveCamera} from "./scene/cam.js";
import {Vec3} from "./math/vec3.js";
import {GUI} from "dat.gui";
import {Controls} from "./scene/controls.js";
import {DirectionalLight} from "./scene/light/directional.light.js";
import {AmbientLight} from "./scene/light/ambient.light.js";
import {PointLight} from "./scene/light/point.light.js";
import {Cube} from "./scene/actor.js";
import {Quaternion} from "./math/quaternion.js";
import {Scene} from "./scene/group.js";

const containerRef = ref(null);

const currentFPS = ref(0);
const currentLocation = ref(null)

let gui

onMounted(async () => {
  const gl = setupGL(containerRef.value)

  const renderer = new Renderer(containerRef.value, gl)
  const scene = new Scene();

  const model = await loadGlb('ship_in_a_bottle.glb')
  scene.add(model)

  const cube = new Cube()
  cube.material.color = new Vec3(1, 0, 0)
  cube.material.roughness = 0.5
  cube.material.metalness = 1
  cube.position.set(0, 0, 0)
  cube.scale.set(0.5, 0.5, 1)
  cube.lookAt(new Vec3(0, 1, 1))
  cube.updateWorldMatrix()
  scene.add(cube)

  const camera = new PerspectiveCamera(
      60,
      gl.canvas.width / gl.canvas.height,
      0.1,
      10000
  )

  camera.position.set(0, 2, 5)
  camera.lookAt(new Vec3(0, 0, 0))
  // camera.setTarget(new Vec3(0, 0, 0))
  camera.updateWorldMatrix()
  camera.updateProjectionMatrix()

  const controls = new Controls(containerRef.value, camera)

  let lastFpsUpdateTime = Date.now()
  let frames = 0

  let directionalLight = new DirectionalLight()
  let ambientLight = new AmbientLight()
  let pointLight = new PointLight()

  ambientLight.intensity = 0.05
  ambientLight.color.set(1, 1, 1)

  directionalLight.position.set(0, 0, 5)
  directionalLight.intensity = 0.75
  directionalLight.color.set(1, 1, 1)
  directionalLight.direction = new Vec3(0, -1, -1)

  pointLight.position.set(2.69, 11.6, 0.14)
  pointLight.intensity = 0.5
  pointLight.color.set(1, 1, 1)

  renderer.lights = [
    directionalLight,
    ambientLight,
    pointLight,
  ]

  function render() {
    controls.update()

    // scene.rotation = Quaternion.fromEuler(new Vec3(0, 0.01, 0)).multiply(scene.rotation)
    cube.lookAt(camera.position)

    camera.updateAspectRatio(gl.canvas.width / gl.canvas.height)
    camera.updateWorldMatrix()

    currentLocation.value = {...camera.position}

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
  sceneFolder.add(scene.scale, 'x', 0.1, 2).name('场景缩放.X')
  sceneFolder.add(scene.scale, 'y', 0.1, 2).name('场景缩放.Y')
  sceneFolder.add(scene.scale, 'z', 0.1, 2).name('场景缩放.Z')
  sceneFolder.open()

  const lightFolder = gui.addFolder('光照')
  lightFolder.add(directionalLight.direction, 'x', -1, 1).name('平行光方向.X')
  lightFolder.add(directionalLight.direction, 'y', -1, 1).name('平行光方向.Y')
  lightFolder.add(directionalLight.direction, 'z', -1, 1).name('平行光方向.Z')
  lightFolder.add(directionalLight, 'intensity', 0, 100).name('平行光强度')
  lightFolder.add(ambientLight, 'intensity', 0, 1).name('环境光强度')
  lightFolder.add(pointLight.position, 'x', -10, 10).name('点光源位置.X')
  lightFolder.add(pointLight.position, 'y', -10, 10).name('点光源位置.Y')
  lightFolder.add(pointLight.position, 'z', -10, 10).name('点光源位置.Z')
  lightFolder.add(pointLight, 'intensity', 0, 3).name('点光源强度')
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
    <div style="display: flex; flex-direction: column; gap: 0.2rem">
      <div>FPS: {{ currentFPS }}</div>
      <div>
        相机:
        <span v-for="(value, key) in currentLocation" :key="key" style="margin-left: 1rem">
          {{ key }}: {{ value.toFixed(2) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fps {
  position: absolute;
  top: 0;
  left: 0;
  color: #00ff00;
  font-size: 15px;
  padding: 10px;
}
</style>
