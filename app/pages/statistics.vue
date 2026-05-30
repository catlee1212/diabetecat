<template>
  <div class="page">
    <h1 class="page-title">Statistics</h1>

    <!-- Time Range Tabs -->
    <div class="range-tabs" role="tablist" aria-label="Time range">
      <button v-for="tab in rangeTabs" :key="tab.value" class="range-tab"
        :class="{ 'range-tab--active': selectedRange === tab.value }" role="tab"
        :aria-selected="selectedRange === tab.value" @click="selectedRange = tab.value">
        {{ tab.label }}
      </button>
    </div>

    <!-- Date Navigation -->
    <div class="date-nav">
      <button class="date-nav-btn" @click="navigate(-1)" aria-label="Previous period">‹</button>
      <button class="date-nav-label" @click="goToToday">{{ periodLabel }}</button>
      <button class="date-nav-btn" @click="navigate(1)" aria-label="Next period">›</button>
    </div>

    <!-- Day view: date picker -->
    <div v-if="selectedRange === 'day'" class="date-picker-row">
      <input type="date" class="form-input" :value="selectedDateStr" @input="onDatePick" aria-label="Select date" />
    </div>

    <!-- Summary Cards -->
    <div class="app-card">
      <div class="app-card-title">{{ rangeTitle }} Summary</div>
      <div class="stat-grid stat-grid--3">
        <div class="stat-item">
          <div class="stat-value">{{ periodStats.avgGlucose ?? '—' }}</div>
          <div class="stat-label">Avg Glucose</div>
        </div>
        <div class="stat-item">
          <div class="stat-value stat-value--high">{{ periodStats.maxGlucose ?? '—' }}</div>
          <div class="stat-label">Highest</div>
        </div>
        <div class="stat-item">
          <div class="stat-value stat-value--low">{{ periodStats.minGlucose ?? '—' }}</div>
          <div class="stat-label">Lowest</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ periodStats.glucoseCount }}</div>
          <div class="stat-label">Measurements</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ periodStats.totalInsulinUnits }}</div>
          <div class="stat-label">Insulin Units</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ periodStats.foodCount }}</div>
          <div class="stat-label">Food Entries</div>
        </div>
      </div>
    </div>

    <!-- Glucose Chart -->
    <div class="app-card">
      <div class="app-card-title mb-1">
        {{ selectedRange === 'day' ? 'Glucose Measurements' : 'Glucose Trend' }}
      </div>

      <div v-if="hasNoGlucose" class="empty-state" style="padding:24px 0">
        <div class="empty-state-icon">📊</div>
        <p class="empty-state-text">No glucose data for this period</p>
      </div>

      <template v-else>
        <!-- Legend hint -->
        <div class="chart-legend-row">
          <span class="chart-legend-item">
            <span class="chart-legend-swatch" style="background:#2563eb"></span>
            {{ selectedRange === 'day' ? 'Glucose' : 'Daily Avg' }}
          </span>
          <span v-if="selectedRange !== 'day'" class="chart-legend-item">
            <span class="chart-legend-swatch chart-legend-swatch--dashed" style="background:#f59e0b"></span>
            {{ selectedRange === 'week' ? 'Week Avg' : 'Month Avg' }}
          </span>
          <span class="chart-range-text" style="margin-left:auto">Target: 80–199 mg/dL</span>
        </div>

        <ClientOnly>
          <LineChart :data="lineChartData" :categories="lineChartCategories" :height="240" :xFormatter="xFormatter"
            :yFormatter="yFormatter" :curveType="selectedRange === 'day' ? 'monotoneX' : 'monotoneX'"
            :yDomain="[0, yMax]" :yGridLine="true" :xNumTicks="xTickCount" :lineWidth="2" :lineDashArray="lineDash" />
        </ClientOnly>

        <!-- Event markers -->
        <div v-if="visibleMarkers.length > 0" class="event-timeline">
          <div class="event-timeline-label">Events on timeline</div>
          <div class="event-markers-scroll">
            <button v-for="(marker, idx) in visibleMarkers" :key="marker.entry.id" class="event-marker"
              :class="`event-marker--${marker.entry.type}`" @click="toggleMarkerDetail(idx)"
              :aria-label="`${marker.entry.type}: ${marker.label}`">
              <span class="event-marker-icon">{{ marker.entry.type === 'insulin' ? '💉' : '🍎' }}</span>
              <span class="event-marker-text">{{ marker.time }} · {{ marker.label }}</span>
            </button>
          </div>

          <Transition name="fade">
            <div v-if="activeMarkerIdx !== null && activeMarker" class="marker-detail">
              <div class="marker-detail-header">
                <span class="marker-detail-type">
                  {{ activeMarker.entry.type === 'insulin' ? '💉 Insulin' : '🍎 Food' }}
                </span>
                <button class="marker-detail-close" @click="activeMarkerIdx = null" aria-label="Close">✕</button>
              </div>
              <div class="marker-detail-body">
                <div v-if="activeMarker.entry.type === 'insulin'" class="marker-detail-value">
                  {{ activeMarker.entry.unit }} units
                </div>
                <div class="marker-detail-time">
                  {{ formatFullTime(activeMarker.entry.measured_at) }}
                </div>
                <div v-if="activeMarker.entry.note" class="marker-detail-note">
                  {{ activeMarker.entry.note }}
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Marker toggles -->
        <div class="marker-toggles">
          <label class="marker-toggle">
            <input type="checkbox" v-model="showInsulin" />
            <span class="marker-toggle-label">💉 Insulin</span>
          </label>
          <label class="marker-toggle">
            <input type="checkbox" v-model="showFood" />
            <span class="marker-toggle-label">🍎 Food</span>
          </label>
        </div>
      </template>
    </div>

    <!-- Entries by Type -->
    <div class="app-card">
      <div class="app-card-title">Entries by Type</div>
      <div class="type-count-row">
        <span class="type-count-label">🩸 Glucose</span>
        <div class="type-count-bar">
          <div class="type-count-fill"
            :style="{ width: typePercent('glucose') + '%', background: 'var(--color-primary)' }">
          </div>
        </div>
        <span class="type-count-num">{{ typeCount('glucose') }}</span>
      </div>
      <div class="type-count-row">
        <span class="type-count-label">💉 Insulin</span>
        <div class="type-count-bar">
          <div class="type-count-fill"
            :style="{ width: typePercent('insulin') + '%', background: 'var(--color-success)' }">
          </div>
        </div>
        <span class="type-count-num">{{ typeCount('insulin') }}</span>
      </div>
      <div class="type-count-row">
        <span class="type-count-label">🍎 Food</span>
        <div class="type-count-bar">
          <div class="type-count-fill"
            :style="{ width: typePercent('food') + '%', background: 'var(--color-warning)' }">
          </div>
        </div>
        <span class="type-count-num">{{ typeCount('food') }}</span>
      </div>
    </div>

    <!-- Data table -->
    <div class="app-card">
      <div class="app-card-title">{{ selectedRange === 'day' ? 'Readings' : 'Daily Averages' }}</div>
      <div v-if="nonNullChartData.length === 0" class="empty-state" style="padding:12px 0">
        <p class="empty-state-text">No data available</p>
      </div>
      <div v-else>
        <div v-for="point in nonNullChartData" :key="point.index" class="stat-bar-row">
          <span class="stat-bar-label">{{ point.label }}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill"
              :style="{ width: barWidth(point.glucose!) + '%', background: barColor(point.glucose!) }">
              {{ point.glucose }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimeRange } from '~/composables/useStatistics'

const { entries } = useEntries()

const selectedRange = ref<TimeRange>('week')
const selectedDate = ref(new Date())
const showInsulin = ref(true)
const showFood = ref(true)
const activeMarkerIdx = ref<number | null>(null)

const rangeTabs = [
  { label: 'Day', value: 'day' as TimeRange },
  { label: 'Week', value: 'week' as TimeRange },
  { label: 'Month', value: 'month' as TimeRange },
]

const rangeTitle = computed(() => {
  const m: Record<TimeRange, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly' }
  return m[selectedRange.value]
})

const selectedDateStr = computed(() => {
  const d = selectedDate.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function onDatePick(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) selectedDate.value = new Date(val + 'T00:00:00')
}

const {
  filteredEntries,
  periodStats,
  chartData,
  insulinMarkers,
  foodMarkers,
  periodLabel,
  navigate,
  goToToday,
} = useStatistics(entries, selectedRange, selectedDate)

// Reset detail when anything changes
watch([selectedRange, selectedDate], () => { activeMarkerIdx.value = null })

// ── Markers ──
const visibleMarkers = computed(() => {
  const markers = [
    ...(showInsulin.value ? insulinMarkers.value : []),
    ...(showFood.value ? foodMarkers.value : []),
  ]
  return markers.sort((a, b) => new Date(a.entry.measured_at).getTime() - new Date(b.entry.measured_at).getTime())
})

const activeMarker = computed(() =>
  activeMarkerIdx.value !== null ? visibleMarkers.value[activeMarkerIdx.value] ?? null : null
)

function toggleMarkerDetail(idx: number) {
  activeMarkerIdx.value = activeMarkerIdx.value === idx ? null : idx
}

// ── Chart config ──
const hasNoGlucose = computed(() => chartData.value.every(p => p.glucose === null))

const lineChartData = computed(() => {
  if (selectedRange.value === 'day') {
    return chartData.value.map(p => ({ idx: p.index, glucose: p.glucose }))
  }
  // Week/Month: two series
  return chartData.value.map(p => ({
    idx: p.index,
    glucose: p.glucose,
    average: p.average,
  }))
})

const lineChartCategories = computed(() => {
  if (selectedRange.value === 'day') {
    return {
      glucose: { name: 'Glucose (mg/dL)', color: '#2563eb' },
    }
  }
  const avgLabel = selectedRange.value === 'week' ? 'Week Average' : 'Month Average'
  return {
    glucose: { name: 'Daily Average', color: '#2563eb' },
    average: { name: avgLabel, color: '#f59e0b' },
  }
})

const lineDash = computed(() => {
  if (selectedRange.value === 'day') return undefined
  return [undefined, [6, 4]] // solid for glucose, dashed for average
})

const yMax = computed(() => {
  const max = periodStats.value.maxGlucose ?? 200
  return Math.max(300, Math.ceil(max / 50) * 50 + 50)
})

const xTickCount = computed(() => {
  if (selectedRange.value === 'day') return Math.min(chartData.value.length, 8)
  if (selectedRange.value === 'week') return 7
  return 10
})

const xFormatter = (i: number) => {
  const point = chartData.value[i]
  return point ? point.label : ''
}

const yFormatter = (tick: number) => `${tick}`

const nonNullChartData = computed(() => chartData.value.filter(p => p.glucose !== null))

// ── Type counts ──
function typeCount(type: string) {
  return filteredEntries.value.filter(e => e.type === type).length
}

function typePercent(type: string) {
  const total = filteredEntries.value.length
  if (total === 0) return 0
  return Math.round((typeCount(type) / total) * 100)
}

function barWidth(avg: number) {
  return Math.min(100, Math.max(8, (avg / 600) * 100))
}

function barColor(avg: number) {
  if (avg < 80 || avg > 400) return 'var(--color-danger)'
  if (avg > 199) return 'var(--color-warning)'
  return 'var(--color-success)'
}

function formatFullTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

useHead({ title: 'Statistics – Diabetecat' })
</script>

<style scoped>
.range-tabs {
  display: flex;
  background: var(--color-card);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
}

.range-tab {
  flex: 1;
  padding: 8px 4px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  min-height: 44px;
  transition: all 0.15s ease;
}

.range-tab--active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
}

/* Date navigation */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.date-nav-btn {
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  border-radius: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-nav-btn:active {
  background: var(--color-bg);
}

.date-nav-label {
  border: none;
  background: none;
  font-size: 0.938rem;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.date-nav-label:active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.date-picker-row {
  margin-bottom: 12px;
}

/* Stats */
.stat-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.stat-value--high {
  color: var(--color-warning);
}

.stat-value--low {
  color: var(--color-primary);
}

/* Chart legend */
.chart-legend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.688rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.chart-legend-swatch {
  width: 16px;
  height: 3px;
  border-radius: 2px;
}

.chart-legend-swatch--dashed {
  background: repeating-linear-gradient(to right,
      currentColor 0,
      currentColor 4px,
      transparent 4px,
      transparent 7px) !important;
  height: 3px;
}

.chart-range-text {
  font-size: 0.625rem;
  color: var(--color-text-muted);
}

/* Event timeline */
.event-timeline {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.event-timeline-label {
  font-size: 0.688rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.event-markers-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.event-markers-scroll::-webkit-scrollbar {
  display: none;
}

.event-marker {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition: transform 0.1s ease;
}

.event-marker:active {
  transform: scale(0.96);
}

.event-marker--insulin {
  border-color: var(--color-success);
  background: var(--color-success-light);
}

.event-marker--food {
  border-color: var(--color-warning);
  background: var(--color-warning-light);
}

.event-marker-icon {
  font-size: 0.875rem;
}

.event-marker-text {
  color: var(--color-text);
}

/* Marker detail */
.marker-detail {
  margin-top: 8px;
  background: var(--color-bg);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid var(--color-border);
}

.marker-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.marker-detail-type {
  font-weight: 700;
  font-size: 0.875rem;
}

.marker-detail-close {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-detail-value {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 2px;
}

.marker-detail-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.marker-detail-note {
  margin-top: 6px;
  font-size: 0.813rem;
  color: var(--color-text);
  background: var(--color-card);
  padding: 8px;
  border-radius: 6px;
}

/* Marker toggles */
.marker-toggles {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 8px;
}

.marker-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  min-height: 44px;
}

.marker-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.marker-toggle-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
