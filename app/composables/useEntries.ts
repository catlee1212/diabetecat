import { ref, computed } from 'vue'

export interface DiabetesEntry {
  id: string
  type: 'glucose' | 'insulin' | 'food'
  value: number | null
  unit: number | null
  measured_at: string
  level: -1 | 0 | 1 | 2
  note: string
}

const STORAGE_KEY = 'diabetecat-entries'
const entries = ref<DiabetesEntry[]>([])
let initialized = false

export function calculateLevel(value: number | null): -1 | 0 | 1 | 2 {
  if (value === null) return 1
  if (value < 80) return -1
  if (value <= 199) return 1
  if (value <= 400) return 2
  return -1
}

export function levelText(level: number): string {
  const labels: Record<number, string> = { '-1': 'Danger', '0': 'Low', '1': 'Normal', '2': 'High' }
  return labels[level] ?? 'N/A'
}

export function levelClass(level: number): string {
  const classes: Record<number, string> = { '-1': 'level-danger', '0': 'level-low', '1': 'level-normal', '2': 'level-high' }
  return classes[level] ?? 'level-normal'
}

export function useEntries() {
  if (import.meta.client && !initialized) {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { entries.value = JSON.parse(saved) } catch { entries.value = [] }
    }
    initialized = true
  }

  function persist() {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
    }
  }

  function addEntry(entry: Omit<DiabetesEntry, 'id'>) {
    entries.value.unshift({ ...entry, id: crypto.randomUUID() })
    persist()
  }

  function updateEntry(id: string, data: Partial<DiabetesEntry>) {
    const idx = entries.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      entries.value[idx] = { ...entries.value[idx], ...data }
      persist()
    }
  }

  function deleteEntry(id: string) {
    entries.value = entries.value.filter(e => e.id !== id)
    persist()
  }

  function exportEntries(): string {
    return JSON.stringify(entries.value, null, 2)
  }

  function importEntries(json: string): boolean {
    try {
      const data = JSON.parse(json)
      if (!Array.isArray(data)) return false
      entries.value = data
      persist()
      return true
    } catch {
      return false
    }
  }

  function clearAll() {
    entries.value = []
    persist()
  }

  const sortedEntries = computed(() =>
    [...entries.value].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
  )

  const lastGlucose = computed(() =>
    sortedEntries.value.find(e => e.type === 'glucose' && e.value !== null)
  )

  const glucoseTrend = computed<'rising' | 'stable' | 'falling'>(() => {
    const glucoseEntries = sortedEntries.value.filter(e => e.type === 'glucose' && e.value !== null)
    if (glucoseEntries.length < 2) return 'stable'
    const diff = glucoseEntries[0].value! - glucoseEntries[1].value!
    if (diff > 10) return 'rising'
    if (diff < -10) return 'falling'
    return 'stable'
  })

  const weeklyStats = computed(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weekEntries = sortedEntries.value.filter(e => new Date(e.measured_at) >= weekAgo)
    const glucoseEntries = weekEntries.filter(e => e.type === 'glucose' && e.value !== null)

    const avgGlucose = glucoseEntries.length > 0
      ? Math.round(glucoseEntries.reduce((s, e) => s + e.value!, 0) / glucoseEntries.length)
      : null

    const inRange = glucoseEntries.filter(e => e.value! >= 80 && e.value! <= 199).length
    const timeInRange = glucoseEntries.length > 0
      ? Math.round((inRange / glucoseEntries.length) * 100)
      : null

    return {
      avgGlucose,
      totalMeasurements: weekEntries.length,
      glucoseMeasurements: glucoseEntries.length,
      timeInRange,
    }
  })

  return {
    entries,
    sortedEntries,
    lastGlucose,
    glucoseTrend,
    weeklyStats,
    addEntry,
    updateEntry,
    deleteEntry,
    exportEntries,
    importEntries,
    clearAll,
  }
}
