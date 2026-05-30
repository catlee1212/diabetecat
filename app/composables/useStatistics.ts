import { computed, type Ref } from 'vue'
import type { DiabetesEntry } from './useEntries'

export type TimeRange = 'day' | 'week' | 'month'

export interface ChartDataPoint {
  index: number
  glucose: number | null
  label: string
  timestamp: number
}

export interface EventMarker {
  entry: DiabetesEntry
  index: number
  label: string
}

export interface PeriodStats {
  avgGlucose: number | null
  maxGlucose: number | null
  minGlucose: number | null
  glucoseCount: number
  totalInsulinUnits: number
  foodCount: number
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function rangeStart(range: TimeRange): Date {
  const now = new Date()
  if (range === 'day') {
    return startOfDay(now)
  }
  if (range === 'week') {
    const d = startOfDay(now)
    d.setDate(d.getDate() - 6)
    return d
  }
  // month
  const d = startOfDay(now)
  d.setDate(d.getDate() - 29)
  return d
}

export function useStatistics(entries: Ref<DiabetesEntry[]>, range: Ref<TimeRange>) {

  const filteredEntries = computed(() => {
    const start = rangeStart(range.value)
    return entries.value
      .filter(e => new Date(e.measured_at) >= start)
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
  })

  const glucoseInRange = computed(() =>
    filteredEntries.value.filter(e => e.type === 'glucose' && e.value !== null)
  )

  const insulinInRange = computed(() =>
    filteredEntries.value.filter(e => e.type === 'insulin' && e.unit !== null)
  )

  const foodInRange = computed(() =>
    filteredEntries.value.filter(e => e.type === 'food')
  )

  // Statistics summary for the selected period
  const periodStats = computed<PeriodStats>(() => {
    const gEntries = glucoseInRange.value
    const values = gEntries.map(e => e.value!)

    return {
      avgGlucose: values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null,
      maxGlucose: values.length > 0 ? Math.max(...values) : null,
      minGlucose: values.length > 0 ? Math.min(...values) : null,
      glucoseCount: gEntries.length,
      totalInsulinUnits: insulinInRange.value.reduce((s, e) => s + (e.unit ?? 0), 0),
      foodCount: foodInRange.value.length,
    }
  })

  // Build chart data: glucose line points
  const chartData = computed<ChartDataPoint[]>(() => {
    const gEntries = glucoseInRange.value
    if (gEntries.length === 0) return []

    if (range.value === 'day') {
      // Individual measurements
      return gEntries.map((e, i) => ({
        index: i,
        glucose: e.value,
        label: new Date(e.measured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(e.measured_at).getTime(),
      }))
    }

    // Weekly / Monthly: aggregate by day
    const byDay = new Map<string, { values: number[]; date: Date }>()
    gEntries.forEach(e => {
      const d = new Date(e.measured_at)
      const key = dateKey(d)
      if (!byDay.has(key)) byDay.set(key, { values: [], date: startOfDay(d) })
      byDay.get(key)!.values.push(e.value!)
    })

    // Fill in all days in range so the x-axis is continuous
    const start = rangeStart(range.value)
    const end = startOfDay(new Date())
    const allDays: ChartDataPoint[] = []
    let idx = 0
    const cursor = new Date(start)
    while (cursor <= end) {
      const key = dateKey(cursor)
      const dayData = byDay.get(key)
      const avg = dayData ? Math.round(dayData.values.reduce((s, v) => s + v, 0) / dayData.values.length) : null
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

      let label: string
      if (range.value === 'week') {
        label = dayNames[cursor.getDay()]
      } else {
        label = `${monthNames[cursor.getMonth()]} ${cursor.getDate()}`
      }

      allDays.push({
        index: idx++,
        glucose: avg,
        label,
        timestamp: cursor.getTime(),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    return allDays
  })

  // Event markers for insulin
  const insulinMarkers = computed<EventMarker[]>(() => {
    const data = chartData.value
    if (data.length === 0) return []

    return insulinInRange.value.map(entry => {
      const ts = new Date(entry.measured_at).getTime()
      // Find nearest chart data point
      let closest = 0
      let minDiff = Infinity
      data.forEach((p, i) => {
        const diff = Math.abs(p.timestamp - ts)
        if (diff < minDiff) { minDiff = diff; closest = i }
      })
      return {
        entry,
        index: closest,
        label: `${entry.unit} units`,
      }
    })
  })

  // Event markers for food
  const foodMarkers = computed<EventMarker[]>(() => {
    const data = chartData.value
    if (data.length === 0) return []

    return foodInRange.value.map(entry => {
      const ts = new Date(entry.measured_at).getTime()
      let closest = 0
      let minDiff = Infinity
      data.forEach((p, i) => {
        const diff = Math.abs(p.timestamp - ts)
        if (diff < minDiff) { minDiff = diff; closest = i }
      })
      return {
        entry,
        index: closest,
        label: entry.note || 'Food',
      }
    })
  })

  return {
    filteredEntries,
    glucoseInRange,
    insulinInRange,
    foodInRange,
    periodStats,
    chartData,
    insulinMarkers,
    foodMarkers,
  }
}
