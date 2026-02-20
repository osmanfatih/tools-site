"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FoodEntry {
  id: string;
  date: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

interface Goals {
  goal_calories: number;
  goal_protein_g: number;
  goal_carbs_g: number;
  goal_fat_g: number;
  ai_explanation?: string;
  goal?: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function MacroRing({
  label,
  value,
  goal,
  unit,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const isOver = goal > 0 && value > goal;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[72px] h-[72px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#f5f5f4" strokeWidth="4" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={isOver ? "#ef4444" : color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={goal > 0 ? offset : c}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-semibold ${isOver ? "text-red-500" : "text-stone-800"}`}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <span className="text-[11px] text-stone-400 uppercase tracking-wide">{label}</span>
      {goal > 0 && (
        <span className="text-[10px] text-stone-300">/ {Math.round(goal)} {unit}</span>
      )}
    </div>
  );
}

export default function CalorieTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{
    food_name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totals = {
    calories: entries.reduce((s, e) => s + e.calories, 0),
    protein_g: entries.reduce((s, e) => s + e.protein_g, 0),
    carbs_g: entries.reduce((s, e) => s + e.carbs_g, 0),
    fat_g: entries.reduce((s, e) => s + e.fat_g, 0),
  };

  // Check if user has a profile (onboarding)
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data || !data.goal_calories) {
          router.push("/onboarding");
        } else {
          setGoals(data);
          setProfileLoaded(true);
        }
      })
      .catch(() => setProfileLoaded(true));
  }, [status, router]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/entries?date=${date}`);
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
  }, [date, router]);

  const fetchDates = useCallback(async () => {
    try {
      const res = await fetch("/api/entries?dates=1");
      const data = await res.json();
      setAllDates(Array.isArray(data) ? data : []);
    } catch { setAllDates([]); }
  }, []);

  useEffect(() => { if (profileLoaded) fetchEntries(); }, [fetchEntries, profileLoaded]);
  useEffect(() => { if (profileLoaded) fetchDates(); }, [fetchDates, profileLoaded]);

  async function handleAnalyze() {
    if (!imageData && !manualText.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData || undefined, text: manualText.trim() || undefined }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Analysis failed");
    } finally { setAnalyzing(false); }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    try {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          date,
          food_name: preview.food_name,
          calories: preview.calories,
          protein_g: preview.protein_g,
          carbs_g: preview.carbs_g,
          fat_g: preview.fat_g,
          created_at: new Date().toISOString(),
        }),
      });
      setPreview(null); setImageData(null); setManualText(""); setShowAdd(false);
      fetchEntries(); fetchDates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/entries?id=${id}`, { method: "DELETE" });
    fetchEntries(); fetchDates();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImageData(reader.result as string); setPreview(null); };
    reader.readAsDataURL(file);
  }

  if (status === "loading" || (status === "authenticated" && !profileLoaded)) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-sm text-stone-400">Loading...</div>
      </div>
    );
  }
  if (status !== "authenticated") return null;

  const remaining = goals
    ? {
        calories: Math.max(0, goals.goal_calories - totals.calories),
        protein_g: Math.max(0, goals.goal_protein_g - totals.protein_g),
        carbs_g: Math.max(0, goals.goal_carbs_g - totals.carbs_g),
        fat_g: Math.max(0, goals.goal_fat_g - totals.fat_g),
      }
    : null;

  return (
    <div className="max-w-2xl mx-auto px-6 pb-24">
      <nav className="flex items-center justify-between py-8 border-b border-stone-200">
        <Link href="/" className="text-sm font-medium text-stone-900 hover:text-stone-500 transition-colors">Tools</Link>
        <div className="flex items-center gap-4">
          <Link href="/onboarding" className="text-xs text-stone-400 hover:text-stone-700 transition-colors">Edit goals</Link>
          <span className="text-xs text-stone-300">·</span>
          <span className="text-xs text-stone-400">{session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-stone-400 hover:text-stone-700 transition-colors">Sign out</button>
        </div>
      </nav>

      <header className="pt-16 pb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Calorie Tracker</h1>
        <p className="text-stone-400 text-sm">Snap a photo, get AI calorie estimates, track daily intake.</p>
      </header>

      <div className="flex items-center gap-3 mb-8">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="text-sm bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300" />
        <button onClick={() => setDate(today())} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">Today</button>
      </div>

      {/* Macro rings with goals */}
      <div className="bg-white border border-stone-100 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-around">
          <MacroRing label="Calories" value={totals.calories} goal={goals?.goal_calories || 0} unit="kcal" color="#78716c" />
          <MacroRing label="Protein" value={totals.protein_g} goal={goals?.goal_protein_g || 0} unit="g" color="#ef4444" />
          <MacroRing label="Carbs" value={totals.carbs_g} goal={goals?.goal_carbs_g || 0} unit="g" color="#f59e0b" />
          <MacroRing label="Fat" value={totals.fat_g} goal={goals?.goal_fat_g || 0} unit="g" color="#3b82f6" />
        </div>
      </div>

      {/* Remaining summary */}
      {remaining && date === today() && (
        <div className="text-center text-xs text-stone-400 mb-8">
          {remaining.calories > 0 ? (
            <span>{Math.round(remaining.calories)} kcal remaining today</span>
          ) : (
            <span className="text-red-400 font-medium">Daily calorie goal reached!</span>
          )}
        </div>
      )}

      {!showAdd && (
        <button onClick={() => setShowAdd(true)}
          className="w-full py-3 bg-stone-900 text-stone-50 text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors mb-8">
          + Add Food
        </button>
      )}

      {showAdd && (
        <div className="bg-white border border-stone-100 rounded-2xl p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-stone-800">Add Food</h3>
            <button onClick={() => { setShowAdd(false); setImageData(null); setManualText(""); setPreview(null); }}
              className="text-xs text-stone-400 hover:text-stone-700">Cancel</button>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl py-8 text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-colors">
              {imageData ? "📸 Photo attached — tap to change" : "📸 Take photo or upload image"}
            </button>
            {imageData && <img src={imageData} alt="Food preview" className="mt-3 rounded-xl max-h-48 mx-auto" />}
          </div>
          <div className="text-center text-xs text-stone-300 uppercase tracking-wide">or type manually</div>
          <input type="text" value={manualText} onChange={(e) => setManualText(e.target.value)}
            placeholder="e.g. Grilled chicken with rice"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          <button onClick={handleAnalyze} disabled={analyzing || (!imageData && !manualText.trim())}
            className="w-full py-3 bg-stone-800 text-stone-50 text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {analyzing ? "Analyzing..." : "🔍 Analyze"}
          </button>
          {preview && (
            <div className="border border-stone-100 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium text-stone-800">{preview.food_name}</div>
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div><div className="font-semibold text-stone-800">{preview.calories}</div><div className="text-stone-400">kcal</div></div>
                <div><div className="font-semibold text-red-500">{preview.protein_g}g</div><div className="text-stone-400">protein</div></div>
                <div><div className="font-semibold text-amber-500">{preview.carbs_g}g</div><div className="text-stone-400">carbs</div></div>
                <div><div className="font-semibold text-blue-500">{preview.fat_g}g</div><div className="text-stone-400">fat</div></div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "✓ Save Entry"}
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
          {date === today() ? "Today's Log" : `Log for ${date}`}
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm text-stone-300 py-6 text-center">No entries yet. Add your first meal!</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="bg-white border border-stone-100 rounded-xl px-4 py-3 flex items-center justify-between group">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-stone-800 truncate">{e.food_name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{e.calories} kcal · {e.protein_g}g P · {e.carbs_g}g C · {e.fat_g}g F</div>
                </div>
                <button onClick={() => handleDelete(e.id)}
                  className="text-stone-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all ml-3 shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {allDates.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">History</h2>
          <div className="flex flex-wrap gap-2">
            {allDates.map((d) => (
              <button key={d} onClick={() => setDate(d)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${d === date ? "bg-stone-900 text-stone-50" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
