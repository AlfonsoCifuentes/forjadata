<script setup lang="ts">
import type { MaterialAttribute } from '@forjadata/contracts'
import { Box, Eye, RotateCw } from '@lucide/vue'
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ attributes: MaterialAttribute[] }>()

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeHotspot = ref('housing')

const hotspots = [
  {
    id: 'housing',
    label: 'Carcasa y potencia',
    node: 'Housing',
    attributeCodes: ['POWER', 'EFFICIENCY', 'MANUFACTURER'],
    position: 'hotspot--housing',
  },
  {
    id: 'terminal',
    label: 'Conexión eléctrica',
    node: 'Terminal box',
    attributeCodes: ['VOLTAGE', 'FREQUENCY'],
    position: 'hotspot--terminal',
  },
  {
    id: 'shaft',
    label: 'Eje y velocidad',
    node: 'Shaft',
    attributeCodes: ['RPM', 'SHAFT_DIAMETER'],
    position: 'hotspot--shaft',
  },
] as const

const selectedAttributes = computed(() => {
  const selected = hotspots.find((item) => item.id === activeHotspot.value)
  if (!selected) return []
  return props.attributes.filter((attribute) =>
    selected.attributeCodes.some((code) => code === attribute.code),
  )
})

let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let modelRoot: Awaited<ReturnType<GLTFLoader['loadAsync']>>['scene'] | null = null
let resizeHandler: (() => void) | null = null

function render(): void {
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function selectHotspot(id: string): void {
  activeHotspot.value = id
  const selected = hotspots.find((item) => item.id === id)
  if (!modelRoot || !selected) return

  modelRoot.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const material = object.material
    if (!(material instanceof MeshStandardMaterial)) return
    material.emissive = new Color(object.name === selected.node ? 0x19c7bc : 0x000000)
    material.emissiveIntensity = object.name === selected.node ? 0.3 : 0
  })
  render()
}

onMounted(async () => {
  if (!host.value) return

  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      'Modelo 3D interactivo de un motor industrial. Arrastra para rotar y usa la rueda para acercar.',
    )
    host.value.append(renderer.domElement)

    scene = new Scene()
    camera = new PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(5.4, 3.2, 6.2)
    scene.add(new AmbientLight(0xffffff, 1.5))
    const keyLight = new DirectionalLight(0xffffff, 3.2)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)
    const rimLight = new DirectionalLight(0x21d4c7, 2)
    rimLight.position.set(-5, 2, -4)
    scene.add(rimLight)

    const gltf = await new GLTFLoader().loadAsync('/models/forjadata-industrial-motor.gltf')
    modelRoot = gltf.scene
    modelRoot.rotation.set(-0.16, -0.42, 0)
    modelRoot.traverse((object) => {
      if (!(object instanceof Mesh)) return
      object.name = object.parent?.name ?? object.name
      if (object.material instanceof MeshStandardMaterial) object.material = object.material.clone()
    })
    scene.add(modelRoot)

    const bounds = new Box3().setFromObject(modelRoot)
    const center = bounds.getCenter(new Vector3())
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false
    controls.enablePan = false
    controls.minDistance = 4
    controls.maxDistance = 10
    controls.target.copy(center)
    controls.addEventListener('change', render)
    controls.update()

    resizeHandler = (): void => {
      if (!host.value || !renderer || !camera) return
      const { width, height } = host.value.getBoundingClientRect()
      renderer.setSize(Math.max(width, 1), Math.max(height, 1), false)
      camera.aspect = Math.max(width, 1) / Math.max(height, 1)
      camera.updateProjectionMatrix()
      render()
    }
    window.addEventListener('resize', resizeHandler)
    resizeHandler()
    selectHotspot(activeHotspot.value)
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? `El visor 3D no está disponible: ${cause.message}`
        : 'El visor 3D no está disponible en este dispositivo.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  controls?.dispose()
  modelRoot?.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
    else object.material.dispose()
  })
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <article class="panel model-viewer">
    <div class="panel__header">
      <div>
        <span class="eyebrow"><Box :size="14" /> Visor 3D · P2</span>
        <h2>Modelo industrial vinculado a atributos</h2>
      </div>
      <span class="viewer-hint"><RotateCw :size="14" /> Arrastra para rotar</span>
    </div>

    <div
      v-if="error"
      class="model-fallback"
      role="img"
      aria-label="Vista 2D de un motor industrial"
    >
      <div class="motor-illustration" aria-hidden="true">
        <span class="motor-illustration__body"></span>
        <span class="motor-illustration__shaft"></span>
        <span class="motor-illustration__terminal"></span>
      </div>
      <p>{{ error }}</p>
      <small>La ficha y sus atributos siguen completamente disponibles.</small>
    </div>

    <template v-else>
      <div class="canvas-wrap">
        <div ref="host" class="canvas-host" :aria-busy="loading"></div>
        <span v-if="loading" class="loading-label">Cargando GLTF…</span>
        <button
          v-for="hotspot in hotspots"
          :key="hotspot.id"
          type="button"
          class="hotspot"
          :class="[hotspot.position, { 'hotspot--active': activeHotspot === hotspot.id }]"
          :aria-pressed="activeHotspot === hotspot.id"
          :aria-label="`Resaltar ${hotspot.label}`"
          @click="selectHotspot(hotspot.id)"
        >
          <span aria-hidden="true"></span>{{ hotspot.label }}
        </button>
      </div>

      <div class="attribute-highlight" aria-live="polite">
        <Eye :size="16" />
        <div>
          <strong>{{ hotspots.find((item) => item.id === activeHotspot)?.label }}</strong>
          <p v-if="selectedAttributes.length">
            <span v-for="attribute in selectedAttributes" :key="attribute.id">
              {{ attribute.label }}: {{ attribute.normalizedValue }} {{ attribute.unit }}
            </span>
          </p>
          <p v-else>Sin atributos específicos en esta ficha; el punto sigue disponible.</p>
        </div>
      </div>
    </template>
  </article>
</template>

<style scoped>
.model-viewer {
  overflow: hidden;
}

.model-viewer .panel__header {
  align-items: flex-start;
}

.model-viewer h2 {
  margin: 0.2rem 0 0;
}

.eyebrow,
.viewer-hint {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 750;
}

.canvas-wrap {
  position: relative;
  min-height: 25rem;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 70% 25%,
      color-mix(in srgb, var(--color-accent) 16%, transparent),
      transparent 34%
    ),
    linear-gradient(145deg, var(--color-surface-muted), var(--color-surface));
}

.canvas-wrap::after {
  position: absolute;
  right: 8%;
  bottom: 13%;
  left: 8%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  content: '';
}

.canvas-host {
  position: absolute;
  inset: 0;
}

.canvas-host :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.canvas-host :deep(canvas:active) {
  cursor: grabbing;
}

.loading-label {
  position: absolute;
  top: 50%;
  left: 50%;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  transform: translate(-50%, -50%);
}

.hotspot {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  box-shadow: var(--shadow-sm);
  color: var(--color-text);
  font: inherit;
  font-size: 0.64rem;
  font-weight: 750;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.hotspot > span {
  width: 0.5rem;
  height: 0.5rem;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 34%, transparent);
}

.hotspot--active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #041816;
}

.hotspot--housing {
  top: 47%;
  left: 26%;
}

.hotspot--terminal {
  top: 21%;
  left: 48%;
}

.hotspot--shaft {
  top: 48%;
  right: 16%;
}

.attribute-highlight {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.attribute-highlight > svg {
  margin-top: 0.1rem;
  color: var(--color-accent);
}

.attribute-highlight strong {
  font-size: 0.74rem;
}

.attribute-highlight p {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.67rem;
}

.model-fallback {
  display: grid;
  min-height: 20rem;
  place-content: center;
  justify-items: center;
  padding: 2rem;
  text-align: center;
}

.model-fallback p {
  margin: 1rem 0 0.2rem;
  font-size: 0.75rem;
  font-weight: 750;
}

.model-fallback small {
  color: var(--color-text-muted);
}

.motor-illustration {
  position: relative;
  width: 13rem;
  height: 7rem;
}

.motor-illustration__body,
.motor-illustration__shaft,
.motor-illustration__terminal {
  position: absolute;
  display: block;
  border: 2px solid var(--color-border);
  background: color-mix(in srgb, var(--color-accent) 18%, var(--color-surface));
}

.motor-illustration__body {
  inset: 1.5rem 2.5rem 0.7rem 1rem;
  border-radius: 1rem;
}

.motor-illustration__shaft {
  top: 3.1rem;
  right: 0;
  width: 2.6rem;
  height: 1rem;
}

.motor-illustration__terminal {
  top: 0.4rem;
  left: 4rem;
  width: 3.5rem;
  height: 1.5rem;
  border-radius: 0.35rem;
}

@media (max-width: 700px) {
  .viewer-hint {
    display: none;
  }

  .canvas-wrap {
    min-height: 21rem;
  }

  .hotspot {
    font-size: 0;
  }

  .hotspot > span {
    width: 0.75rem;
    height: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .canvas-host :deep(canvas) {
    scroll-behavior: auto;
  }
}
</style>
