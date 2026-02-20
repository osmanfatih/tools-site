import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSQL } from "@/lib/db";

async function getUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const date = req.nextUrl.searchParams.get("date");
  const listDates = req.nextUrl.searchParams.get("dates");

  if (listDates) {
    const rows = await sql`SELECT DISTINCT date FROM food_entries WHERE user_id = ${userId} ORDER BY date DESC`;
    return NextResponse.json(rows.map((r: Record<string, unknown>) => r.date));
  }

  if (date) {
    const rows = await sql`SELECT * FROM food_entries WHERE user_id = ${userId} AND date = ${date} ORDER BY created_at ASC`;
    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: "Provide ?date= or ?dates=1" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const body = await req.json();
  const { id, date, food_name, calories, protein_g, carbs_g, fat_g, notes, created_at } = body;

  await sql`INSERT INTO food_entries (id, date, food_name, calories, protein_g, carbs_g, fat_g, notes, created_at, user_id)
    VALUES (${id}, ${date}, ${food_name}, ${calories}, ${protein_g}, ${carbs_g}, ${fat_g}, ${notes || null}, ${created_at}, ${userId})`;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Provide ?id=" }, { status: 400 });

  await sql`DELETE FROM food_entries WHERE id = ${id} AND user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
