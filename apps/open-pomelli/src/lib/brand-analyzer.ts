import { muapi } from "./muapi";
import { scrapeSite } from "./scraper";
import { pickPalette } from "./colors";

export type BrandDNA = {
  brandName: string;
  industry: string;
  tagline: string;
  valueProposition: string;
  toneOfVoice: string[];
  brandPersonality: string[];
  targetAudience: string;
  keyMessages: string[];
  primaryColors: string[];
  secondaryColors: string[];
  fonts: string[];
  logoUrl: string | null;
  screenshotUrl: string | null;
  imageryStyle: string;
  layoutStyle: string;
};

const TEXT_PROMPT = `You are a brand analyst. Given the website content below, extract the brand DNA as STRICT JSON only (no commentary, no markdown). Use this exact shape:
{
  "brand_name": "string",
  "industry": "string",
  "tagline": "string",
  "value_proposition": "string",
  "tone_of_voice": ["3-5 trait words"],
  "brand_personality": ["3-5 trait words"],
  "target_audience": "one sentence",
  "key_messages": ["3-5 short messages"],
  "imagery_style": "professional | casual | illustrated | cinematic | minimalist | editorial",
  "layout_style": "modern | classic | minimalist | bold | editorial"
}

WEBSITE TITLE: {{title}}
META DESCRIPTION: {{description}}
BODY TEXT (truncated):
{{body}}`;

const VISION_PROMPT = `Analyze this website screenshot and return STRICT JSON only (no markdown, no commentary):
{
  "primary_colors": ["#hex","#hex","#hex"],
  "secondary_colors": ["#hex","#hex"],
  "typography": "serif | sans-serif | modern | classic | display",
  "logo_style": "wordmark | icon | combination",
  "imagery_style": "professional | casual | illustrated | cinematic | minimalist | editorial",
  "layout_style": "modern | classic | minimalist | bold | editorial",
  "brand_vibe": ["3-5 vibe words"]
}`;

function parseJSON(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const m = candidate.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`No JSON in LLM response: ${text.slice(0, 200)}`);
  return JSON.parse(m[0]);
}

const asString = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];

function dedupHex(...lists: string[][]): string[] {
  const out: string[] = [];
  for (const list of lists) for (const c of list) if (c && !out.includes(c.toLowerCase())) out.push(c.toLowerCase());
  return out;
}

export async function analyzeBrand(url: string): Promise<BrandDNA> {
  const site = await scrapeSite(url);

  const screenshotUrl = await muapi.uploadFile(
    site.screenshot,
    `screenshot-${Date.now()}.png`,
    "image/png",
  );

  const textPrompt = TEXT_PROMPT.replace("{{title}}", site.title)
    .replace("{{description}}", site.description)
    .replace("{{body}}", site.bodyText);

  const [textRaw, visionRaw] = await Promise.all([
    muapi.text(textPrompt),
    muapi.vision(VISION_PROMPT, screenshotUrl),
  ]);

  const text = parseJSON(textRaw);
  const vision = parseJSON(visionRaw);

  const cssPalette = pickPalette(site.rawColors);
  const primaryColors = dedupHex(asStringArray(vision.primary_colors), cssPalette.primary).slice(0, 5);
  const secondaryColors = dedupHex(asStringArray(vision.secondary_colors), cssPalette.secondary).slice(0, 5);

  const logoUrl = site.logoCandidates[0] ?? site.ogImage ?? site.favicon;

  return {
    brandName: asString(text.brand_name),
    industry: asString(text.industry),
    tagline: asString(text.tagline),
    valueProposition: asString(text.value_proposition),
    toneOfVoice: asStringArray(text.tone_of_voice),
    brandPersonality: dedupHex(asStringArray(text.brand_personality), asStringArray(vision.brand_vibe)),
    targetAudience: asString(text.target_audience),
    keyMessages: asStringArray(text.key_messages),
    primaryColors,
    secondaryColors,
    fonts: site.fonts,
    logoUrl,
    screenshotUrl,
    imageryStyle: asString(vision.imagery_style) || asString(text.imagery_style),
    layoutStyle: asString(vision.layout_style) || asString(text.layout_style),
  };
}
