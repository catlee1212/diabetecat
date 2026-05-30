<template>
  <div class="page">
    <h1 class="page-title">Dashboard</h1>

    <!-- Last Measurement -->
    <div class="app-card">
      <div class="app-card-title">Last Measurement</div>
      <template v-if="lastGlucose">
        <div class="d-flex align-items-end gap-2 mb-1">
          <span class="measurement-value" :class="measurementColor">{{ lastGlucose.value }}</span>
          <span class="measurement-unit">mg/dL</span>
          <span class="trend ms-auto" :class="`trend-${glucoseTrend}`">
            {{ trendIcon }} {{ glucoseTrend }}
          </span>
        </div>
        <div class="measurement-time">{{ formatTimeAgo(lastGlucose.measured_at) }}</div>
      </template>
      <template v-else>
        <div class="empty-state" style="padding:16px 0">
          <p class="empty-state-text">No glucose measurements yet</p>
        </div>
      </template>
    </div>

    <!-- Weekly Statistics -->
    <div class="app-card">
      <div class="app-card-title">This Week</div>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">{{ weeklyStats.avgGlucose ?? '—' }}</div>
          <div class="stat-label">Avg Glucose</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ weeklyStats.totalMeasurements }}</div>
          <div class="stat-label">Entries</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ weeklyStats.timeInRange !== null ? weeklyStats.timeInRange + '%' : '—' }}</div>
          <div class="stat-label">In Range</div>
        </div>
        <div class="stat-item">
          <span class="trend" :class="`trend-${glucoseTrend}`" style="font-size:1.5rem">{{ trendIcon }}</span>
          <div class="stat-label">Trend</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="app-card">
      <div class="app-card-title">Quick Actions</div>
      <div class="quick-actions">
        <NuxtLink to="/history?type=glucose" class="quick-action-btn">
          <span class="quick-action-icon quick-action-icon--glucose">🩸</span>
          Glucose
        </NuxtLink>
        <NuxtLink to="/history?type=insulin" class="quick-action-btn">
          <span class="quick-action-icon quick-action-icon--insulin">💉</span>
          Insulin
        </NuxtLink>
        <NuxtLink to="/history?type=food" class="quick-action-btn">
          <span class="quick-action-icon quick-action-icon--food">🍎</span>
          Food
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { lastGlucose, glucoseTrend, weeklyStats } = useEntries()

const trendIcon = computed(() => {
  const icons: Record<string, string> = { rising: '↗', stable: '→', falling: '↘' }
  return icons[glucoseTrend.value] ?? '→'
})

const measurementColor = computed(() => {
  if (!lastGlucose.value) return ''
  const v = lastGlucose.value.value!
  if (v < 80 || v > 400) return 'text-danger'
  if (v > 199) return 'text-warning'
  return 'text-success'
})

function formatTimeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(diffMs / 3600000)
  if (hr < 24) return `${hr}h ago`
  if (hr < 48) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

useHead({ title: 'Dashboard – Diabetecat' })
</script>
