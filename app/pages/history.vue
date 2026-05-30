<template>
  <div class="page">
    <h1 class="page-title">History</h1>

    <!-- Toggle / Form -->
    <div class="app-card" v-if="showForm">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="app-card-title mb-0">{{ editingEntry ? 'Edit Entry' : 'New Entry' }}</span>
        <button class="btn-app btn-app--secondary btn-app--sm" @click="closeForm">✕</button>
      </div>
      <DiabetesEntryForm :initial-type="formType" :edit-entry="editingEntry" :auto-focus="true" @save="onSave"
        @cancel="closeForm" />
    </div>

    <button v-else class="btn-app btn-app--primary btn-app--block mb-3" @click="openNewForm()">
      + New Entry
    </button>

    <!-- Entry List -->
    <div class="app-card">
      <div class="app-card-title">Entries</div>
      <EntryList :entries="sortedEntries" @edit="onEdit" @delete="onDelete" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiabetesEntry } from '~/composables/useEntries'

const route = useRoute()
const router = useRouter()
const { sortedEntries, addEntry, updateEntry, deleteEntry } = useEntries()

const showForm = ref(false)
const formType = ref<'glucose' | 'insulin' | 'food'>('glucose')
const editingEntry = ref<DiabetesEntry | null>(null)

// Handle query params on mount and watch for changes
function applyQueryParams() {
  const q = route.query
  if (q.create || q.type) {
    showForm.value = true
    if (q.type && ['glucose', 'insulin', 'food'].includes(q.type as string)) {
      formType.value = q.type as 'glucose' | 'insulin' | 'food'
    }
  }
}

onMounted(applyQueryParams)
watch(() => route.query, applyQueryParams)

function openNewForm(type?: 'glucose' | 'insulin' | 'food') {
  editingEntry.value = null
  formType.value = type ?? 'glucose'
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingEntry.value = null
  // Clean query params
  if (route.query.create || route.query.type) {
    router.replace({ path: '/history' })
  }
}

function onSave(data: Omit<DiabetesEntry, 'id'>) {
  if (editingEntry.value) {
    updateEntry(editingEntry.value.id, data)
  } else {
    addEntry(data)
  }
  closeForm()
}

function onEdit(entry: DiabetesEntry) {
  editingEntry.value = entry
  formType.value = entry.type
  showForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onDelete(id: string) {
  deleteEntry(id)
  if (editingEntry.value?.id === id) {
    closeForm()
  }
}

useHead({ title: 'History – Diabetecat' })
</script>
