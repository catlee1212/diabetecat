<template>
  <div class="page">
    <h1 class="page-title">Settings</h1>

    <!-- Units -->
    <div class="app-card">
      <div class="app-card-title">Preferences</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Glucose Unit</div>
          <div class="setting-desc">Unit for glucose measurements</div>
        </div>
        <div class="setting-control">
          <select v-model="settings.unit" @change="save" aria-label="Glucose unit">
            <option value="mgdl">mg/dL</option>
            <option value="mmol">mmol/L</option>
          </select>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Target Range Min</div>
          <div class="setting-desc">Lower bound of normal range</div>
        </div>
        <div class="setting-control">
          <input type="number" v-model.number="settings.targetMin" min="40" max="200" @change="save"
            aria-label="Minimum target glucose" style="width:80px" />
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Target Range Max</div>
          <div class="setting-desc">Upper bound of normal range</div>
        </div>
        <div class="setting-control">
          <input type="number" v-model.number="settings.targetMax" min="100" max="400" @change="save"
            aria-label="Maximum target glucose" style="width:80px" />
        </div>
      </div>
    </div>

    <!-- Display -->
    <div class="app-card">
      <div class="app-card-title">Display</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Theme</div>
          <div class="setting-desc">Appearance preference</div>
        </div>
        <div class="setting-control">
          <select v-model="settings.theme" @change="save" aria-label="Theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Notifications</div>
          <div class="setting-desc">Measurement reminders</div>
        </div>
        <div class="setting-control">
          <input type="checkbox" v-model="settings.notifications" @change="save" aria-label="Enable notifications"
            style="width:20px;height:20px;min-height:44px" />
        </div>
      </div>
    </div>

    <!-- Data -->
    <div class="app-card">
      <div class="app-card-title">Data</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Export Data</div>
          <div class="setting-desc">Download all entries as JSON</div>
        </div>
        <div class="setting-control">
          <button class="btn-app btn-app--secondary btn-app--sm" @click="handleExport">
            Export
          </button>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Import Data</div>
          <div class="setting-desc">Restore from a JSON file</div>
        </div>
        <div class="setting-control">
          <label class="btn-app btn-app--secondary btn-app--sm" style="cursor:pointer" tabindex="0">
            Import
            <input type="file" accept="application/json" @change="handleImport" style="display:none"
              aria-label="Import data file" />
          </label>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Clear All Data</div>
          <div class="setting-desc">Permanently delete all entries</div>
        </div>
        <div class="setting-control">
          <button class="btn-app btn-app--danger btn-app--sm" @click="handleClear">
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const SETTINGS_KEY = 'diabetecat-settings'
const { exportEntries, importEntries, clearAll } = useEntries()

interface AppSettings {
  unit: 'mgdl' | 'mmol'
  targetMin: number
  targetMax: number
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
}

const defaults: AppSettings = {
  unit: 'mgdl',
  targetMin: 80,
  targetMax: 199,
  theme: 'light',
  notifications: false,
}

const settings = ref<AppSettings>({ ...defaults })

onMounted(() => {
  const saved = localStorage.getItem(SETTINGS_KEY)
  if (saved) {
    try { settings.value = { ...defaults, ...JSON.parse(saved) } } catch { /* use defaults */ }
  }
})

function save() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
}

function handleExport() {
  const json = exportEntries()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diabetecat-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (importEntries(text)) {
      alert('Data imported successfully!')
    } else {
      alert('Invalid file format. Please select a valid JSON export.')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function handleClear() {
  if (confirm('Are you sure you want to delete all entries? This cannot be undone.')) {
    clearAll()
    alert('All data has been cleared.')
  }
}

useHead({ title: 'Settings – Diabetecat' })
</script>
