import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";

// GET /api/entries?date=YYYY-MM-DD  or  GET /api/entries?dates=1 (list all dates)
export async function GET(req: NextRequest) {
  const sql = getSQL();
  const date = req.nextUrl.searchParams.get("date");
  const listDates = req.nextUrl.searchParams.get("dates");

  if (listDates) {
    const rows = await sql`SELECT DISTINCT date FROM food_entries ORDER BY date DESC`;
    return NextResponse.json(rows.map((r: Record<string, unknown>) => r.date));
  }

  if (date) {
    const rows = await sql`SELECT * FROM food_entries WHERE date = ${date} ORDER BY created_at ASC`;
    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: "Provide ?date= or ?dates=1" }, { status: 400 });
}

// POST /api/entries — create entry
export async function POST(req: NextRequest) {
  const sql = getSQL();
  const body = await req.json();
  const { id, date, food_name, calories, protein_g, carbs_g, fat_g, notes, created_at } = body;

  await sql`INSERT INTO food_entries (id, date, food_name, calories, protein_g, carbs_g, fat_g, notes, created_at)
    VALUES (${id}, ${date}, ${food_name}, ${calories}, ${protein_g}, ${carbs_g}, ${fat_g}, ${notes || null}, ${created_at})`;

  return NextResponse.json({ ok: true });
}

// DELETE /api/entries?id=xxx
export async function DELETE(req: NextRequest) {
  const sql = getSQL();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Provide ?id=" }, { status: 400 });

  await sql`DELETE FROM food_entries WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
