import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a precise dietitian assistant. Analyze the provided food image or food description and return a JSON object with exactly these fields:
- food_name: string (concise name of the dish/food)
- calories: number (total kcal estimate)
- protein_g: number (grams of protein)
- carbs_g: number (grams of carbohydrates)
- fat_g: number (grams of fat)

Be realistic with portion sizes visible in the image. Return ONLY valid JSON, no markdown or explanation.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const body = await req.json();
  const { image, text } = body as { image?: string; text?: string };

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: text ? `Food: ${text}` : "Analyze this food image." },
          { type: "image_url", image_url: { url: image, detail: "low" } },
        ],
      });
    } else if (text) {
      messages.push({
        role: "user",
        content: `Estimate nutritional info for one serving of: ${text}`,
      });
    } else {
      return NextResponse.json({ error: "Provide an image or food name" }, { status: 400 });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
