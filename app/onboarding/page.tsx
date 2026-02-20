"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const GOALS = [
  { value: "lose_weight", label: "Lose Weight", emoji: "🏃" },
  { value: "maintain_weight", label: "Stay Healthy", emoji: "💪" },
  { value: "gain_muscle", label: "Gain Muscle", emoji: "🏋️" },
  { value: "healthy_pregnancy", label: "Healthy Pregnancy", emoji: "🤰" },
  { value: "manage_diabetes", label: "Manage Diabetes", emoji: "🩺" },
  { value: "other", label: "Other", emoji: "✨" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
];

export default function Onboarding() {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    goal_calories: number;
    goal_protein_g: number;
    goal_carbs_g: number;
    goal_fat_g: number;
    ai_explanation: string;
  } | null>(null);

  const [form, setForm] = useState({
    age: "",
    gender: "",
    weight_kg: "",
    height_cm: "",
    conditions: "",
    goal: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: parseInt(form.age),
          gender: form.gender,
          weight_kg: parseFloat(form.weight_kg),
          height_cm: parseFloat(form.height_cm),
          conditions: form.conditions,
          goal: form.goal,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep(3);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-sm text-stone-400">Loading...</div>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300";
  const labelCls = "block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex gap-2 mb-10 justify-center">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all ${
                s <= step ? "bg-stone-900 w-10" : "bg-stone-200 w-6"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Body stats */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-2">
                Tell us about yourself
              </h1>
              <p className="text-stone-400 text-sm">
                This helps us calculate your daily nutritional goals.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="28"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input
                  type="number"
                  value={form.weight_kg}
                  onChange={(e) => update("weight_kg", e.target.value)}
                  placeholder="75"
                  step="0.1"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input
                  type="number"
                  value={form.height_cm}
                  onChange={(e) => update("height_cm", e.target.value)}
                  placeholder="175"
                  step="0.1"
                  className={inputCls}
                />
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!form.age || !form.gender || !form.weight_kg || !form.height_cm}
              className="w-full py-3 bg-stone-900 text-stone-50 text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 1: Health conditions */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-2">
                Any health conditions?
              </h1>
              <p className="text-stone-400 text-sm">
                Optional — helps us personalize your nutritional targets.
              </p>
            </div>

            <div>
              <label className={labelCls}>Conditions (optional)</label>
              <textarea
                value={form.conditions}
                onChange={(e) => update("conditions", e.target.value)}
                placeholder="e.g. Type 2 diabetes, lactose intolerant, pregnant (2nd trimester)..."
                rows={4}
                className={inputCls + " resize-none"}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-stone-900 text-stone-50 text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-2">
                What&apos;s your goal?
              </h1>
              <p className="text-stone-400 text-sm">
                We&apos;ll calculate personalized daily targets based on this.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => update("goal", g.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.goal === g.value
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  <div className="text-lg mb-1">{g.emoji}</div>
                  <div className="text-sm font-medium">{g.label}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.goal || saving}
                className="flex-1 py-3 bg-stone-900 text-stone-50 text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Calculating your goals..." : "Calculate My Goals"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎯</div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-2">
                Your Daily Goals
              </h1>
            </div>

            <div className="bg-white border border-stone-100 rounded-2xl p-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-stone-800">
                    {Math.round(result.goal_calories)}
                  </div>
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide mt-1">
                    kcal
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-500">
                    {Math.round(result.goal_protein_g)}g
                  </div>
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide mt-1">
                    protein
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-500">
                    {Math.round(result.goal_carbs_g)}g
                  </div>
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide mt-1">
                    carbs
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-500">
                    {Math.round(result.goal_fat_g)}g
                  </div>
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide mt-1">
                    fat
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
              <p className="text-sm text-stone-500 leading-relaxed">
                {result.ai_explanation}
              </p>
            </div>

            <button
              onClick={() => router.push("/calorie-tracker")}
              className="w-full py-3 bg-stone-900 text-stone-50 text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
            >
              Start Tracking →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
