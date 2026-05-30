import { computed, type Ref } from 'vue'
import type { DiabetesEntry } from './useEntries'

export type TimeRange = 'day' | 'week' | 'month'

export interface ChartDataPoint {
  index: number
  glucose: number | null
  average: number | null
  label: string
  timestamp: number
}

export interface EventMarker {
  entry: DiabetesEntry
  index: number
  label: string
  time: string
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

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Get the Monday-based start of the week for a given date.
 */
function weekStart(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = (day === 0 ? 6 : day - 1) // Monday = 0
  d.setDate(d.getDate() - diff)
  return d
}

function weekEnd(date: Date): Date {
  const d = weekStart(date)
  d.setDate(d.getDate() + 6)
  return endOfDay(d)
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthEnd(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function useStatistics(
  entries: Ref<DiabetesEntry[]>,
  range: Ref<TimeRange>,
  selectedDate: Ref<Date>,
) {
  const periodStart = computed(() => {
    if (range.value === 'day') return startOfDay(selectedDate.value)
    if (range.value === 'week') return weekStart(selectedDate.value)
    return monthStart(selectedDate.value)
  })

  const periodEnd = computed(() => {
    if (range.value === 'day') return endOfDay(selectedDate.value)
    if (range.value === 'week') return weekEnd(selectedDate.value)
    return monthEnd(selectedDate.value)
  })

  const filteredEntries = computed(() =>
    entries.value
      .filter(e => {
        const t = new Date(e.measured_at).getTime()
        return t >= periodStart.value.getTime() && t <= periodEnd.value.getTime()
      })
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
  )

  const glucoseInRange = computed(() =>
    filteredEntries.value.filter(e => e.type === 'glucose' && e.value !== null)
  )

  const insulinInRange = computed(() =>
    filteredEntries.value.filter(e => e.type === 'insulin')
  )

  const foodInRange = computed(() =>
    filteredEntries.value.filter(e => e.type === 'food')
  )

  const periodStats = computed<PeriodStats>(() => {
    const values = glucoseInRange.value.map(e => e.value!)
    return {
      avgGlucose: values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null,
      maxGlucose: values.length > 0 ? Math.max(...values) : null,
      minGlucose: values.length > 0 ? Math.min(...values) : null,
      glucoseCount: values.length,
      totalInsulinUnits: insulinInRange.value.reduce((s, e) => s + (e.unit ?? 0), 0),
      foodCount: foodInRange.value.length,
    }
  })

  // ── Day View: individual glucose measurements ──
  const dayChartData = computed<ChartDataPoint[]>(() => {
    return glucoseInRange.value.map((e, i) => ({
      index: i,
      glucose: e.value,
      average: null,
      label: formatTime(new Date(e.measured_at)),
      timestamp: new Date(e.measured_at).getTime(),
    }))
  })

  // ── Week View: daily averages + overall week average line ──
  const weekChartData = computed<ChartDataPoint[]>(() => {
    const start = weekStart(selectedDate.value)
    const byDay = new Map<string, number[]>()
    glucoseInRange.value.forEach(e => {
      const key = dateKey(new Date(e.measured_at))
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(e.value!)
    })

    const weekAvg = periodStats.value.avgGlucose

    const points: ChartDataPoint[] = []
    for (let i = 0; i < 7; i++) {
      const cursor = new Date(start)
      cursor.setDate(cursor.getDate() + i)
      const key = dateKey(cursor)
      const vals = byDay.get(key)
      const dayAvg = vals ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
      points.push({
        index: i,
        glucose: dayAvg,
        average: weekAvg,
        label: DAY_NAMES[cursor.getDay()],
        timestamp: cursor.getTime(),
      })
    }
    return points
  })

  // ── Month View: daily averages + overall month average line ──
  const monthChartData = computed<ChartDataPoint[]>(() => {
    const start = monthStart(selectedDate.value)
    const end = monthEnd(selectedDate.value)
    const daysInMonth = end.getDate()

    const byDay = new Map<string, number[]>()
    glucoseInRange.value.forEach(e => {
      const key = dateKey(new Date(e.measured_at))
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(e.value!)
    })

    const monthAvg = periodStats.value.avgGlucose

    const points: ChartDataPoint[] = []
    for (let i = 0; i < daysInMonth; i++) {
      const cursor = new Date(start)
      cursor.setDate(cursor.getDate() + i)
      const key = dateKey(cursor)
      const vals = byDay.get(key)
      const dayAvg = vals ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
      points.push({
        index: i,
        glucose: dayAvg,
        average: monthAvg,
        label: `${cursor.getDate()}`,
        timestamp: cursor.getTime(),
      })
    }
    return points
  })

  // Active chart data based on current range
  const chartData = computed<ChartDataPoint[]>(() => {
    if (range.value === 'day') return dayChartData.value
    if (range.value === 'week') return weekChartData.value
    return monthChartData.value
  })

  // ── Event markers ──
  function buildMarkers(eventEntries: DiabetesEntry[], labelFn: (e: DiabetesEntry) => string): EventMarker[] {
    const data = chartData.value
    if (data.length === 0) return []

    return eventEntries.map(entry => {
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
        label: labelFn(entry),
        time: formatTime(new Date(entry.measured_at)),
      }
    })
  }

  const insulinMarkers = computed<EventMarker[]>(() =>
    buildMarkers(insulinInRange.value, e => `${e.unit ?? '?'} units`)
  )

  const foodMarkers = computed<EventMarker[]>(() =>
    buildMarkers(foodInRange.value, e => e.note || 'Food')
  )

  // ── Period label ──
  const periodLabel = computed(() => {
    const d = selectedDate.value
    if (range.value === 'day') {
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    }
    if (range.value === 'week') {
      const ws = weekStart(d)
      const we = new Date(ws)
      we.setDate(we.getDate() + 6)
      return `${ws.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
    }
    return d.toLocaleDateString([], { month: 'long', year: 'numeric' })
  })

  // ── Navigation ──
  function navigate(direction: -1 | 1) {
    const d = new Date(selectedDate.value)
    if (range.value === 'day') {
      d.setDate(d.getDate() + direction)
    } else if (range.value === 'week') {
      d.setDate(d.getDate() + direction * 7)
    } else {
      d.setMonth(d.getMonth() + direction)
    }
    selectedDate.value = d
  }

  function goToToday() {
    selectedDate.value = new Date()
  }

  return {
    periodStart,
    periodEnd,
    filteredEntries,
    glucoseInRange,
    insulinInRange,
    foodInRange,
    periodStats,
    chartData,
    insulinMarkers,
    foodMarkers,
    periodLabel,
    navigate,
    goToToday,
  }
}
