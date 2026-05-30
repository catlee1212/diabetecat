<template>
  <form @submit.prevent="handleSubmit" class="diabetes-form d-flex flex-column gap-3">
    <div v-if="entry.type === 'glucose'" class="level-line" :class="currentLevelClass" role="status" aria-live="polite">
      Level: {{ currentLevelText }}
    </div>

    <!-- Type Selection -->
    <div class="form-group">
      <label for="entry-type" class="form-label fw-semibold">Type</label>
      <select id="entry-type" v-model="entry.type" class="form-input" required @change="onTypeChange">
        <option value="glucose">Glucose Measurement</option>
        <option value="insulin">Insulin</option>
        <option value="food">Food</option>
      </select>
    </div>

    <!-- Glucose Value -->
    <div v-if="entry.type === 'glucose'" class="form-group">
      <label for="glucose-value" class="form-label fw-semibold">Glucose Value (mg/dL)</label>
      <input id="glucose-value" ref="glucoseInput" v-model.number="entry.value" type="number" class="form-input"
        placeholder="Enter glucose value" min="0" max="600" step="1" required @input="updateLevel"
        aria-describedby="glucose-help" />
      <p id="glucose-help" class="form-help">Normal range: 80–199 mg/dL</p>
    </div>

    <!-- Insulin Units -->
    <div v-if="entry.type === 'insulin'" class="form-group">
      <label for="insulin-unit" class="form-label fw-semibold">Units</label>
      <input id="insulin-unit" ref="insulinInput" v-model.number="entry.unit" type="number" class="form-input"
        placeholder="Enter insulin units" min="0" max="200" step="0.5" required />
    </div>

    <!-- Food Note hint -->
    <div v-if="entry.type === 'food'" class="form-group">
      <p class="form-help" style="margin:0">Describe what you ate in the notes field below.</p>
    </div>

    <!-- Date & Time -->
    <div class="form-group">
      <label for="measured-at" class="form-label fw-semibold">Date &amp; Time</label>
      <input id="measured-at" v-model="entry.measured_at" type="datetime-local" class="form-input" required />
    </div>

    <!-- Note -->
    <div class="form-group">
      <label for="entry-note" class="form-label fw-semibold">Notes</label>
      <textarea id="entry-note" v-model="entry.note" class="form-input form-textarea" placeholder="Add any notes…"
        rows="2"></textarea>
    </div>

    <!-- Actions -->
    <div class="d-flex gap-2">
      <button type="submit" class="btn-app btn-app--primary flex-grow-1">
        {{ editing ? 'Update' : 'Save Entry' }}
      </button>
      <button type="button" class="btn-app btn-app--secondary" @click="handleCancel">
        {{ editing ? 'Cancel' : 'Clear' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { calculateLevel, levelText, levelClass } from '~/composables/useEntries'
import type { DiabetesEntry } from '~/composables/useEntries'

const props = defineProps<{
  initialType?: 'glucose' | 'insulin' | 'food'
  editEntry?: DiabetesEntry | null
  autoFocus?: boolean
}>()

const emit = defineEmits<{
  save: [entry: Omit<DiabetesEntry, 'id'>]
  cancel: []
}>()

const glucoseInput = ref<HTMLInputElement | null>(null)
const insulinInput = ref<HTMLInputElement | null>(null)

const editing = computed(() => !!props.editEntry)

function createBlank(): Omit<DiabetesEntry, 'id'> {
  return {
    type: props.initialType ?? 'glucose',
    value: null,
    unit: null,
    measured_at: new Date().toISOString().slice(0, 16),
    level: 1,
    note: '',
  }
}

const entry = ref<Omit<DiabetesEntry, 'id'>>(createBlank())

watch(() => props.editEntry, (e) => {
  if (e) {
    entry.value = { type: e.type, value: e.value, unit: e.unit, measured_at: e.measured_at, level: e.level, note: e.note }
  }
}, { immediate: true })

watch(() => props.initialType, (t) => {
  if (t && !props.editEntry) {
    entry.value.type = t
    entry.value.value = null
    entry.value.unit = null
    updateLevel()
    focusInput()
  }
})

const currentLevelText = computed(() => levelText(entry.value.level))
const currentLevelClass = computed(() => levelClass(entry.value.level))

function updateLevel() {
  if (entry.value.type === 'glucose') {
    entry.value.level = calculateLevel(entry.value.value)
  }
}

function onTypeChange() {
  entry.value.value = null
  entry.value.unit = null
  entry.value.level = 1
  nextTick(() => focusInput())
}

function focusInput() {
  nextTick(() => {
    if (entry.value.type === 'glucose') glucoseInput.value?.focus()
    else if (entry.value.type === 'insulin') insulinInput.value?.focus()
  })
}

function handleSubmit() {
  if (entry.value.type === 'glucose' && entry.value.value === null) return
  if (entry.value.type === 'insulin' && entry.value.unit === null) return
  emit('save', { ...entry.value })
  if (!props.editEntry) resetForm()
}

function handleCancel() {
  if (props.editEntry) {
    emit('cancel')
  } else {
    resetForm()
  }
}

function resetForm() {
  entry.value = createBlank()
}

onMounted(() => {
  if (props.autoFocus) focusInput()
})
</script>
