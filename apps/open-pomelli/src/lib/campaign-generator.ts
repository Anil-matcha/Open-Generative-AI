import { muapi } from "./muapi";
import type { BrandDNA } from "@prisma/client";

export type CampaignGoal =
  | "product_launch"
  | "lead_generation"
  | "brand_awareness"
  | "engagement"
  | "thought_leadership"
  | "sales";

export const CAMPAIGN_GOALS: { value: CampaignGoal; label: string; description: string }[] = [
  { value: "product_launch", label: "Product launch", description: "Announce a new product or feature" },
  { value: "lead_generation", label: "Lead generation", description: "Capture qualified prospects" },
  { value: "brand_awareness", label: "Brand awareness", description: "Reach new audiences" },
  { value: "engagement", label: "Engagement", description: "Drive replies, shares, comments" },
  { value: "thought_leadership", label: "Thought leadership", description: "Establish authority and POV" },
  { value: "sales", label: "Direct sales", description: "Drive purchases or sign-ups" },
];

export type CampaignConcept = {
  title: string;
  theme: string;
  key_message: string;
  hook: string;
  cta: string;
  recommended_platforms: string[];
  tone_notes: string;
  visual_direction: string;
};

function parseList(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function buildPrompt(brand: BrandDNA, goal: CampaignGoal, userPrompt: string | null): string {
  const tone = parseList(brand.toneOfVoice).join(", ") || "—";
  const personality = parseList(brand.brandPersonality).join(", ") || "—";
  const messages = parseList(brand.keyMessages).join(" • ") || "—";
  const primary = parseList(brand.primaryColors).join(", ") || "—";

  const goalLabel = CAMPAIGN_GOALS.find((g) => g.value === goal)?.label ?? goal;

  return `You are a senior brand strategist. Generate exactly 4 distinct on-brand marketing campaign concepts for the brand below, tailored to the goal: "${goalLabel}".

Return STRICT JSON only — an array of 4 objects with this exact shape (no markdown, no commentary):
[
  {
    "title": "short evocative concept name (max 6 words)",
    "theme": "1 sentence — the strategic angle",
    "key_message": "1 sentence — what the audience should remember",
    "hook": "1 short line — the opening line of the lead asset",
    "cta": "2-4 word call to action",
    "recommended_platforms": ["instagram","linkedin","facebook","twitter","email","banner","youtube_thumb","google_ad"],
    "tone_notes": "how to write this concept — match the brand's voice",
    "visual_direction": "1-2 sentences — palette, imagery, layout cues"
  }
]

Keep concepts genuinely distinct in angle. Match the brand voice and palette. Be specific to the brand, not generic marketing fluff.

BRAND
- Name: ${brand.brandName || "—"}
- Industry: ${brand.industry || "—"}
- Tagline: ${brand.tagline || "—"}
- Value proposition: ${brand.valueProposition || "—"}
- Target audience: ${brand.targetAudience || "—"}
- Tone of voice: ${tone}
- Personality: ${personality}
- Key messages: ${messages}
- Primary colors: ${primary}
- Imagery style: ${brand.imageryStyle || "—"}
- Layout style: ${brand.layoutStyle || "—"}

GOAL: ${goalLabel}
${userPrompt ? `USER DIRECTION: ${userPrompt}` : ""}`;
}

function parseConcepts(text: string): CampaignConcept[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const m = candidate.match(/\[[\s\S]*\]/);
  if (!m) throw new Error(`No JSON array in LLM response: ${text.slice(0, 300)}`);
  const arr = JSON.parse(m[0]);
  if (!Array.isArray(arr)) throw new Error("Concepts response was not an array");
  return arr.map((c: Record<string, unknown>) => ({
    title: String(c.title ?? ""),
    theme: String(c.theme ?? ""),
    key_message: String(c.key_message ?? ""),
    hook: String(c.hook ?? ""),
    cta: String(c.cta ?? ""),
    recommended_platforms: Array.isArray(c.recommended_platforms)
      ? (c.recommended_platforms.filter((x: unknown) => typeof x === "string") as string[])
      : [],
    tone_notes: String(c.tone_notes ?? ""),
    visual_direction: String(c.visual_direction ?? ""),
  }));
}

export async function generateCampaign(
  brand: BrandDNA,
  goal: CampaignGoal,
  userPrompt: string | null,
): Promise<CampaignConcept[]> {
  const prompt = buildPrompt(brand, goal, userPrompt);
  const raw = await muapi.text(prompt);
  return parseConcepts(raw);
}
