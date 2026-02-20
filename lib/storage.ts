import { FoodEntry, DaySummary } from "./types";

const STORAGE_KEY = "calorie_tracker_entries";

function getAll(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAll(entries: FoodEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(entry: FoodEntry) {
  const all = getAll();
  all.push(entry);
  saveAll(all);
}

export function deleteEntry(id: string) {
  const all = getAll().filter((e) => e.id !== id);
  saveAll(all);
}

export function getEntriesForDate(date: string): FoodEntry[] {
  return getAll().filter((e) => e.date === date);
}

export function getDaySummary(date: string): DaySummary {
  const entries = getEntriesForDate(date);
  return {
    calories: entries.reduce((s, e) => s + e.calories, 0),
    protein_g: entries.reduce((s, e) => s + e.protein_g, 0),
    carbs_g: entries.reduce((s, e) => s + e.carbs_g, 0),
    fat_g: entries.reduce((s, e) => s + e.fat_g, 0),
    entries,
  };
}

export function getAllDates(): string[] {
  const dates = new Set(getAll().map((e) => e.date));
  return Array.from(dates).sort().reverse();
}
