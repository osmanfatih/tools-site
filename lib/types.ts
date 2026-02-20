export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string;
  created_at: string; // ISO timestamp
}

export interface AnalysisResult {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DaySummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  entries: FoodEntry[];
}
