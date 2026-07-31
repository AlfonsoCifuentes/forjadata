<script setup lang="ts">
import { ArrowLeft, FileText, UploadCloud, X } from '@lucide/vue'
import { CreateRequestInputSchema, UploadDocumentInputSchema } from '@forjadata/contracts'
import { useField, useForm } from 'vee-validate'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { z } from 'zod'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import { activeApiMode, forjadataApi } from '@/services/forjadata-api'

const router = useRouter()
const selectedFile = ref<File | null>(null)
const fileName = ref<string | null>(activeApiMode === 'demo' ? 'ficha-motor-demo.pdf' : null)
const serverError = ref<string | null>(null)

const { handleSubmit, isSubmitting, setErrors } = useForm({
  initialValues: {
    type: 'CREATE' as const,
    title: 'Motor Siemens para línea de envasado',
    description:
      'Motor Siemens trifásico de 7,5 kW, 400 V, eficiencia IE3 y protección IP55 para la línea de envasado.',
    priority: 'HIGH' as const,
    category: 'Motores eléctricos',
  },
})

const { value: type } = useField<'CREATE' | 'UPDATE' | 'EXTEND'>('type')
const { value: title, errorMessage: titleError } = useField<string>(
  'title',
  (value) =>
    z.string().trim().min(5, 'Escribe al menos 5 caracteres.').max(120).safeParse(value).success ||
    'El título no es válido.',
)
const { value: description, errorMessage: descriptionError } = useField<string>(
  'description',
  (value) =>
    z
      .string()
      .trim()
      .min(20, 'Explica la necesidad con al menos 20 caracteres.')
      .max(2000)
      .safeParse(value).success || 'La descripción no es válida.',
)
const { value: priority } = useField<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('priority')
const { value: category } = useField<string>('category')

const submit = handleSubmit(async (values) => {
  serverError.value = null
  const parsed = CreateRequestInputSchema.safeParse({
    ...values,
    category: values.category || null,
    fileName: activeApiMode === 'demo' && !selectedFile.value ? fileName.value : null,
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? 'title')
      fieldErrors[field] = issue.message
    }
    setErrors(fieldErrors)
    return
  }
  try {
    let request = await forjadataApi.createRequest(parsed.data)
    if (selectedFile.value) {
      const upload = UploadDocumentInputSchema.parse({
        fileName: selectedFile.value.name,
        mimeType: documentMimeType(selectedFile.value),
        contentBase64: await fileAsBase64(selectedFile.value),
      })
      request = await forjadataApi.uploadDocument(request.id, upload)
    }
    await router.push({
      name: 'request-detail',
      params: { requestId: request.id },
      query: { created: 'true' },
    })
  } catch (cause) {
    serverError.value = cause instanceof Error ? cause.message : 'No se pudo crear la solicitud.'
  }
})

function chooseFile(event: Event): void {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  fileName.value = selectedFile.value?.name ?? null
}

function removeFile(): void {
  selectedFile.value = null
  fileName.value = null
}

function fileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el documento.'))
    reader.onload = () => {
      const value = String(reader.result)
      resolve(value.slice(value.indexOf(',') + 1))
    }
    reader.readAsDataURL(file)
  })
}

function documentMimeType(file: File): string {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLocaleLowerCase('en')
  return (
    {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }[extension ?? ''] ?? 'application/octet-stream'
  )
}
</script>

<template>
  <div class="page create-request">
    <header class="page-header">
      <div>
        <RouterLink class="back-link" to="/app/requests"
          ><ArrowLeft :size="15" /> Solicitudes</RouterLink
        >
        <h1>Nueva solicitud</h1>
        <p>El formulario se valida en cliente y volverá a validarse en la API.</p>
      </div>
      <FjBadge tone="info">Autosave demo · borrador local</FjBadge>
    </header>

    <form class="create-grid" novalidate @submit="submit">
      <section class="panel form-panel">
        <div class="panel__header">
          <div>
            <p class="eyebrow">PASO 1</p>
            <h2>Describe la necesidad</h2>
          </div>
        </div>
        <div class="panel__body form-fields">
          <div class="field">
            <label for="request-type">Tipo de solicitud</label>
            <select id="request-type" v-model="type">
              <option value="CREATE">Crear material</option>
              <option value="UPDATE">Actualizar material</option>
              <option value="EXTEND">Ampliar material</option>
            </select>
          </div>
          <div class="field">
            <label for="request-title">Título</label>
            <input
              id="request-title"
              v-model="title"
              :aria-invalid="Boolean(titleError)"
              :aria-describedby="titleError ? 'title-error' : undefined"
            />
            <p v-if="titleError" id="title-error" class="field__error">{{ titleError }}</p>
          </div>
          <div class="field">
            <label for="request-description">Descripción</label>
            <textarea
              id="request-description"
              v-model="description"
              :aria-invalid="Boolean(descriptionError)"
              :aria-describedby="descriptionError ? 'description-error' : 'description-hint'"
            ></textarea>
            <p id="description-hint" class="field__hint">
              Incluye fabricante, modelo, uso, unidades y cualquier restricción conocida.
            </p>
            <p v-if="descriptionError" id="description-error" class="field__error">
              {{ descriptionError }}
            </p>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="request-priority">Prioridad</label>
              <select id="request-priority" v-model="priority">
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
            <div class="field">
              <label for="request-category">Categoría prevista</label>
              <select id="request-category" v-model="category">
                <option value="">Dejar que la clasifique el mock</option>
                <option>Motores eléctricos</option>
                <option>Bombas</option>
                <option>Válvulas</option>
                <option>Rodamientos</option>
                <option>Sensores</option>
                <option>Cables</option>
                <option>Lubricantes</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <aside class="create-sidebar">
        <section class="panel">
          <div class="panel__header">
            <div>
              <p class="eyebrow">PASO 2</p>
              <h2>Documento fuente</h2>
            </div>
          </div>
          <div class="panel__body">
            <label v-if="!fileName" class="dropzone">
              <UploadCloud :size="27" />
              <strong>Añade un PDF, imagen o tabla</strong>
              <span>Máximo demo: 10 MB</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx" @change="chooseFile" />
            </label>
            <div v-else class="selected-file">
              <span class="selected-file__icon"><FileText :size="20" /></span>
              <span
                ><strong>{{ fileName }}</strong
                ><small>Documento sintético · proveedor mock</small></span
              >
              <button type="button" aria-label="Quitar archivo" @click="removeFile">
                <X :size="16" />
              </button>
            </div>
            <p class="upload-note">
              {{
                activeApiMode === 'demo'
                  ? 'La demo integrada usa un documento sintético identificado como tal.'
                  : 'La API valida firma, tamaño y hash antes de almacenarlo mediante Blob Storage.'
              }}
            </p>
          </div>
        </section>

        <section class="panel readiness">
          <div class="panel__body">
            <h3>Listo para crear</h3>
            <ul>
              <li :data-complete="title.length >= 5">Título descriptivo</li>
              <li :data-complete="description.length >= 20">Contexto suficiente</li>
              <li :data-complete="Boolean(fileName)">Documento de ejemplo</li>
            </ul>
          </div>
        </section>

        <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>
        <FjButton type="submit" block :loading="isSubmitting">Crear borrador</FjButton>
      </aside>
    </form>
  </div>
</template>

<style scoped>
.create-request .page-header > div:first-child {
  display: grid;
  justify-items: start;
  gap: 0.35rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-info-text);
  font-size: 0.72rem;
  font-weight: 700;
}

.create-grid {
  display: grid;
  align-items: start;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.36fr);
}

.eyebrow {
  margin: 0 0 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.form-fields {
  display: grid;
  gap: 1rem;
}

.field__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.form-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

.create-sidebar {
  display: grid;
  gap: 0.8rem;
}

.dropzone {
  display: grid;
  min-height: 12rem;
  place-items: center;
  align-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  cursor: pointer;
  text-align: center;
}

.dropzone :deep(svg) {
  color: var(--color-accent-strong);
}

.dropzone strong {
  font-size: 0.82rem;
}

.dropzone span,
.upload-note {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.dropzone input {
  position: absolute;
  opacity: 0;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}

.selected-file__icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-surface);
  color: var(--color-ai-text);
}

.selected-file > span:nth-child(2) {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 0.2rem;
}

.selected-file strong {
  overflow: hidden;
  font-size: 0.74rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-file small {
  color: var(--color-text-muted);
  font-size: 0.62rem;
}

.selected-file button {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
}

.upload-note {
  margin: 0.7rem 0 0;
  line-height: 1.5;
}

.readiness h3 {
  margin: 0 0 0.7rem;
  font-size: 0.82rem;
}

.readiness ul {
  display: grid;
  gap: 0.45rem;
  padding: 0;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  list-style: none;
}

.readiness li::before {
  display: inline-grid;
  width: 1rem;
  height: 1rem;
  place-items: center;
  border-radius: 999px;
  margin-right: 0.4rem;
  background: var(--color-surface-muted);
  content: '·';
}

.readiness li[data-complete='true']::before {
  background: var(--color-success);
  color: white;
  content: '✓';
}

.server-error {
  padding: 0.7rem;
  border-radius: var(--radius-md);
  margin: 0;
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger-text);
  font-size: 0.75rem;
}

@media (max-width: 900px) {
  .create-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
