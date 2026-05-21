<template>
  <div>
    <form @submit.prevent="addValue">
      <input v-model="form.date" type="date" required placeholder="Date" />
      <input v-model="form.time" type="time" required placeholder="Time" />
      <input
        v-model.number="form.ie"
        type="number"
        required
        placeholder="IE"
        min="0"
        step="any"
      />
      <input v-model="form.value" type="text" required placeholder="Value" />
      <button type="submit">+ Add to list</button>
    </form>
    <div style="margin: 1em 0">
      <button @click="exportValues">Export JSON</button>
      <input type="file" accept="application/json" @change="importValues" />
    </div>
    <ul>
      <li v-for="(item, index) in values" :key="index">
        {{ item.date }} {{ item.time }} - IE: {{ item.ie }}, Value:
        {{ item.value }}
      </li>
    </ul>
  </div>
</template>

<script>
function getNowDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}
function getNowTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export default {
  name: "ValueList",
  data() {
    return {
      form: {
        date: getNowDate(),
        time: getNowTime(),
        ie: "",
        value: "",
      },
      values: [],
    };
  },
  mounted() {
    const saved = localStorage.getItem("values");
    if (saved) {
      this.values = JSON.parse(saved);
    }
  },
  methods: {
    addValue() {
      this.values.push({ ...this.form });
      localStorage.setItem("values", JSON.stringify(this.values));
      // Reset date and time to now after adding
      this.form = {
        date: getNowDate(),
        time: getNowTime(),
        ie: "",
        value: "",
      };
    },
    exportValues() {
      const dataStr = JSON.stringify(this.values, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "values.json";
      link.click();
      URL.revokeObjectURL(url);
    },
    importValues(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            this.values = imported;
            localStorage.setItem("values", JSON.stringify(this.values));
          } else {
            alert("Invalid JSON format.");
          }
        } catch {
          alert("Failed to parse JSON.");
        }
      };
      reader.readAsText(file);
      // Reset the input so the same file can be imported again if needed
      event.target.value = "";
    },
  },
};
</script>