import { muapi, type VideoResolution } from "./muapi";

export type SourceType = "asset" | "photoshoot" | "upload";

export const DEFAULT_PROMPTS: Record<SourceType, string> = {
  asset:
    "Subtle hero motion: slow camera push-in toward the focal subject, gentle parallax on background elements, ambient light shifts. Brand-consistent mood. Preserve typography and composition.",
  photoshoot:
    "Slow rotational camera move around the product, soft light play across the surface, premium reveal feel. Preserve product geometry, color and shadows.",
  upload:
    "Cinematic motion that suits the image. Subtle camera move, gentle ambient motion in environmental elements. Preserve subject geometry.",
};

export async function generateAnimation(
  sourceImageUrl: string,
  prompt: string,
  opts: { duration?: number; resolution?: VideoResolution } = {},
): Promise<string | null> {
  return muapi.videoI2V(prompt, sourceImageUrl, {
    duration: opts.duration ?? 5,
    resolution: opts.resolution ?? "720p",
  });
}
