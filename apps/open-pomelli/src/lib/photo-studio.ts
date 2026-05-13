import { muapi, type ImageResolution, type V2Aspect } from "./muapi";
import type { BrandDNA } from "@prisma/client";
import type { PhotoStyle } from "./photo-styles";

function parseList(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function buildPhotoshootPrompt(
  style: PhotoStyle,
  brand: BrandDNA | null,
  userDirection: string | null,
): string {
  const lines: string[] = [];
  lines.push("Professional product photography. Use the product from the reference image as the exact focal subject — preserve its geometry, color, materials and proportions perfectly.");
  lines.push("");
  lines.push(`Style: ${style.label}`);
  lines.push(style.prompt);

  if (brand) {
    const palette = parseList(brand.primaryColors);
    if (palette.length > 0) {
      lines.push("");
      lines.push(`Brand palette to influence backdrop and props (do not paint the product itself): ${palette.join(", ")}.`);
    }
    if (brand.imageryStyle) {
      lines.push(`Brand imagery style: ${brand.imageryStyle}.`);
    }
  }

  if (userDirection) {
    lines.push("");
    lines.push(`Additional direction: ${userDirection}`);
  }

  lines.push("");
  lines.push("Composition rules: realistic lighting and shadows that match the staged scene, sharp focus on the product, no text, no watermarks, no overlaid logos, no warping or distortion of the product, no model faces.");

  return lines.join("\n");
}

export async function generatePhotoshoot(
  productImageUrl: string,
  style: PhotoStyle,
  brand: BrandDNA | null,
  userDirection: string | null,
  opts: { aspect?: V2Aspect; resolution?: ImageResolution } = {},
): Promise<string | null> {
  const prompt = buildPhotoshootPrompt(style, brand, userDirection);
  const refs = [productImageUrl];
  if (brand?.logoUrl) refs.push(brand.logoUrl);
  return muapi.imageEdit2(prompt, refs, {
    aspectRatio: opts.aspect ?? style.aspect,
    resolution: opts.resolution ?? "2k",
    outputFormat: "png",
  });
}
