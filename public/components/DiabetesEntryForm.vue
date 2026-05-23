<template>
  <form
    @submit.prevent="submitForm"
    class="diabetes-form d-flex flex-column gap-3"
  >
    <div
      class="level-line"
      :class="levelClass"
      role="status"
      aria-live="polite"
    >
      Level: {{ levelText }}
    </div>

    <!-- Type Selection -->
    <div class="form-group">
      <label for="entry-type" class="form-label">Type</label>
      <select
        id="entry-type"
        v-model="entry.type"
        class="form-input"
        required
        @change="entry.value = null"
      >
        <option value="glucose">Glucose</option>
        <option value="insulin">Insulin</option>
        <option value="food">Food</option>
      </select>
    </div>

    <!-- Glucose Value (conditional) -->
    <div v-if="entry.type === 'glucose'" class="form-group">
      <label for="glucose-value" class="form-label"
        >Glucose Value (mg/dL)</label
      >
      <input
        id="glucose-value"
        v-model.number="entry.value"
        type="number"
        class="form-input"
        placeholder="Enter glucose value"
        min="0"
        max="600"
        step="1"
        required
        @input="calculateLevel"
        aria-describedby="glucose-help glucose-level"
      />
      <p id="glucose-help" class="form-help">Normal range: 80–199 mg/dL</p>
    </div>

    <!-- Unit (conditional) -->
    <div v-if="entry.type === 'insulin'" class="form-group">
      <label for="unit" class="form-label">Unit</label>
      <input
        id="unit"
        v-model.number="entry.unit"
        type="number"
        class="form-input"
        placeholder="Enter insulin units"
        min="0"
        max="200"
        step="0.5"
        required
      />
    </div>

    <!-- Measured At -->
    <div class="form-group">
      <label for="measured-at" class="form-label">Date & Time</label>
      <input
        id="measured-at"
        v-model="entry.measured_at"
        type="datetime-local"
        class="form-input"
        required
      />
    </div>

    <!-- Note -->
    <div class="form-group">
      <label for="note" class="form-label">Notes</label>
      <textarea
        id="note"
        v-model="entry.note"
        class="form-input form-textarea"
        placeholder="Add any notes about this entry..."
        rows="3"
      ></textarea>
    </div>

    <!-- Submit Button -->
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Save Entry</button>
      <button type="button" class="btn btn-secondary" @click="resetForm">
        Clear
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface DiabetesEntry {
  type: "glucose" | "insulin" | "food";
  value: number | null;
  unit: number | null;
  measured_at: string;
  level: -1 | 0 | 1 | 2;
  note: string;
}

const entry = ref<DiabetesEntry>({
  type: "glucose",
  value: null,
  unit: null,
  measured_at: new Date().toISOString().slice(0, 16),
  level: 1,
  note: "",
});

const levelText = computed(() => {
  const levels: Record<number, string> = {
    "-1": "Danger",
    "0": "Low",
    "1": "Normal",
    "2": "High",
  };
  return levels[entry.value.level] || "N/A";
});

const levelClass = computed(() => {
  const classes: Record<number, string> = {
    "-1": "level-danger",
    "0": "level-low",
    "1": "level-normal",
    "2": "level-high",
  };
  return classes[entry.value.level] || "level-normal";
});

const calculateLevel = () => {
  if (entry.value.value === null) {
    entry.value.level = 1;
    return;
  }

  const value = entry.value.value;

  if (value < 80) {
    entry.value.level = -1; // danger
  } else if (value >= 80 && value <= 199) {
    entry.value.level = 0; // low
  } else if (value >= 200 && value <= 400) {
    entry.value.level = 2; // high
  } else {
    entry.value.level = -1; // danger (above 400)
  }
};

const submitForm = () => {
  if (entry.value.type === "glucose" && entry.value.value === null) {
    alert("Please enter a glucose value");
    return;
  }

  if (entry.value.type === "insulin" && entry.value.unit === null) {
    alert("Please enter insulin units");
    return;
  }

  // Emit the entry data
  console.log("Submitting entry:", entry.value);
  // TODO: Emit to parent or call API
};

const resetForm = () => {
  entry.value = {
    type: "glucose",
    value: null,
    unit: null,
    measured_at: new Date().toISOString().slice(0, 16),
    level: 1,
    note: "",
  };
};
</script>

<style scoped>
input,
select,
textarea {
  width: 100%;
}

.level-line {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-weight: 700;
}

.level-danger {
  background-color: #dc3545;
  color: #ffffff;
}

.level-low {
  background-color: #dc3545;
  color: #ffffff;
}

.level-normal {
  background-color: #198754;
  color: #ffffff;
}

.level-high {
  background-color: #fd7e14;
  color: #111111;
}
</style>
