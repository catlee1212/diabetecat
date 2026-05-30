<template>
  <div>
    <!-- Filters -->
    <div class="filter-bar" role="group" aria-label="Filter entries">
      <button v-for="f in filters" :key="f.value" class="filter-chip"
        :class="{ 'filter-chip--active': activeFilter === f.value }" @click="activeFilter = f.value"
        :aria-pressed="activeFilter === f.value">
        {{ f.label }}
      </button>

      <button class="filter-chip" @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
        :aria-label="`Sort ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`">
        {{ sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest' }}
      </button>
    </div>

    <!-- List -->
    <div v-if="filteredEntries.length === 0" class="empty-state">
      <div class="empty-state-icon">📋</div>
      <p class="empty-state-text">No entries yet. Add your first entry above.</p>
    </div>

    <div v-else>
      <div v-for="item in filteredEntries" :key="item.id" class="entry-item">
        <div class="entry-type-badge" :class="typeBadgeClass(item.type)">
          {{ typeIcon(item.type) }}
        </div>

        <div class="entry-content">
          <div class="entry-main">{{ entryTitle(item) }}</div>
          <div class="entry-meta">{{ formatTime(item.measured_at) }}</div>
          <div v-if="item.note" class="entry-note">{{ item.note }}</div>
        </div>

        <div class="entry-actions">
          <button class="entry-action-btn" @click="$emit('edit', item)" aria-label="Edit entry">
            ✏️
          </button>
          <button class="entry-action-btn entry-action-btn--danger" @click="confirmDelete(item.id)"
            aria-label="Delete entry">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DiabetesEntry } from '~/composables/useEntries'

const props = defineProps<{
  entries: DiabetesEntry[]
}>()

const emit = defineEmits<{
  edit: [entry: DiabetesEntry]
  delete: [id: string]
}>()

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Glucose', value: 'glucose' },
  { label: 'Insulin', value: 'insulin' },
  { label: 'Food', value: 'food' },
]

const activeFilter = ref('all')
const sortOrder = ref<'asc' | 'desc'>('desc')

const filteredEntries = computed(() => {
  let result = [...props.entries]
  if (activeFilter.value !== 'all') {
    result = result.filter(e => e.type === activeFilter.value)
  }
  result.sort((a, b) => {
    const diff = new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    return sortOrder.value === 'desc' ? -diff : diff
  })
  return result
})

function typeBadgeClass(type: string) {
  const map: Record<string, string> = {
    glucose: 'quick-action-icon--glucose',
    insulin: 'quick-action-icon--insulin',
    food: 'quick-action-icon--food',
  }
  return map[type] ?? ''
}

function typeIcon(type: string) {
  const map: Record<string, string> = { glucose: '🩸', insulin: '💉', food: '🍎' }
  return map[type] ?? '📝'
}

function entryTitle(entry: DiabetesEntry) {
  if (entry.type === 'glucose' && entry.value !== null) return `${entry.value} mg/dL`
  if (entry.type === 'insulin' && entry.unit !== null) return `${entry.unit} units`
  if (entry.type === 'food') return entry.note || 'Food entry'
  return entry.type.charAt(0).toUpperCase() + entry.type.slice(1)
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffHr < 48) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function confirmDelete(id: string) {
  if (confirm('Delete this entry?')) {
    emit('delete', id)
  }
}
</script>
