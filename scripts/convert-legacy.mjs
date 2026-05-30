// Converts legacy JSON data to DiabetesEntry[] format
// Run: node scripts/convert-legacy.mjs < input.json > output.json

import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const raw = JSON.parse(readFileSync('untitled.json', 'utf-8'));

function calculateLevel(value) {
  if (value === null) return 1;
  if (value < 80) return -1;
  if (value <= 199) return 1;
  if (value <= 400) return 2;
  return -1;
}

function parseDate(dateStr, timeStr) {
  // "DD.MM.YY" → "20YY-MM-DDTHH:MM"
  const [day, month, year] = dateStr.split('.');
  return `20${year}-${month}-${day}T${timeStr}`;
}

const converted = raw.map(entry => {
  const measured_at = parseDate(entry.date, entry.time);

  if (entry.type === 'measurement') {
    const numValue = parseInt(entry.value, 10);
    const glucoseValue = isNaN(numValue) ? null : numValue;
    const insulinUnit = entry.unit !== 'UNDEFINED' ? parseFloat(entry.unit) : null;

    return {
      id: randomUUID(),
      type: 'glucose',
      value: glucoseValue,
      unit: null,
      measured_at,
      level: calculateLevel(glucoseValue),
      note: insulinUnit !== null ? `Insulin: ${insulinUnit} units at time of measurement` : '',
    };
  }

  if (entry.type === 'insulin') {
    const units = entry.unit !== 'UNDEFINED' ? parseFloat(entry.unit) : null;
    return {
      id: randomUUID(),
      type: 'insulin',
      value: null,
      unit: units,
      measured_at,
      level: 1,
      note: '',
    };
  }

  if (entry.type === 'food') {
    // Use the value field as the note (e.g. "FUTTER", "1/2 SACKERL", etc.)
    const note = entry.value !== 'UNDEFINED' ? entry.value : '';
    return {
      id: randomUUID(),
      type: 'food',
      value: null,
      unit: null,
      measured_at,
      level: 1,
      note,
    };
  }

  return null;
}).filter(Boolean);

console.log(JSON.stringify(converted, null, 2));
