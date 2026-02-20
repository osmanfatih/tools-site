import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSQL } from "@/lib/db";
import OpenAI from "openai";

async function getUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

// GET /api/profile
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const rows = await sql`SELECT * FROM user_profiles WHERE user_id = ${userId}`;
  if (rows.length === 0) return NextResponse.json(null);
  return NextResponse.json(rows[0]);
}

// POST /api/profile — create/update profile + calculate goals via OpenAI
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { age, gender, weight_kg, height_cm, conditions, goal } = body;

  // Calculate goals via OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });

  const client = new OpenAI({ apiKey });

  const prompt = `You are an expert nutritionist. Based on the following user profile, calculate their recommended daily nutritional intake.

User Profile:
- Age: ${age} years
- Gender: ${gender}
- Weight: ${weight_kg} kg
- Height: ${height_cm} cm
- Health conditions: ${conditions || "None"}
- Goal: ${goal}

Provide a JSON response with exactly these fields:
- calories: number (daily kcal target)
- protein_g: number (daily protein in grams)
- carbs_g: number (daily carbohydrates in grams)
- fat_g: number (daily fat in grams)
- explanation: string (2-3 sentence explanation of why these targets are appropriate for this person)

Be precise and consider BMR (Mifflin-St Jeor), activity level assumptions (moderate), and the stated goal. Adjust macros based on health conditions. Return ONLY valid JSON.`;

  const response = await client.chat.completions.create({
    model: "gpt-5.2",
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return NextResponse.json({ error: "Empty AI response" }, { status: 500 });

  const goals = JSON.parse(content);
  const now = new Date().toISOString();
  const sql = getSQL();

  // Upsert profile
  const existing = await sql`SELECT user_id FROM user_profiles WHERE user_id = ${userId}`;
  if (existing.length > 0) {
    await sql`UPDATE user_profiles SET
      age = ${age}, gender = ${gender}, weight_kg = ${weight_kg}, height_cm = ${height_cm},
      conditions = ${conditions || null}, goal = ${goal},
      goal_calories = ${goals.calories}, goal_protein_g = ${goals.protein_g},
      goal_carbs_g = ${goals.carbs_g}, goal_fat_g = ${goals.fat_g},
      ai_explanation = ${goals.explanation}, updated_at = ${now}
      WHERE user_id = ${userId}`;
  } else {
    await sql`INSERT INTO user_profiles (user_id, age, gender, weight_kg, height_cm, conditions, goal,
      goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g, ai_explanation, created_at, updated_at)
      VALUES (${userId}, ${age}, ${gender}, ${weight_kg}, ${height_cm}, ${conditions || null}, ${goal},
      ${goals.calories}, ${goals.protein_g}, ${goals.carbs_g}, ${goals.fat_g}, ${goals.explanation}, ${now}, ${now})`;
  }

  return NextResponse.json({
    goal_calories: goals.calories,
    goal_protein_g: goals.protein_g,
    goal_carbs_g: goals.carbs_g,
    goal_fat_g: goals.fat_g,
    ai_explanation: goals.explanation,
  });
}
