import type { AspectRatio } from "./muapi";

export type PlatformSpec = {
  id: string;
  platform: string;
  format: string;
  label: string;
  aspect: AspectRatio;
  copy: {
    headlineMaxWords: number;
    bodyMaxWords: number;
    ctaMaxWords: number;
    tone: string;
  };
  imageHint: string;
};

export const PLATFORMS: PlatformSpec[] = [
  {
    id: "instagram_square",
    platform: "instagram",
    format: "square",
    label: "Instagram — Feed (1:1)",
    aspect: "1:1",
    copy: { headlineMaxWords: 8, bodyMaxWords: 25, ctaMaxWords: 3, tone: "casual, scroll-stopping, lower-case" },
    imageHint: "Bold focal subject, mobile-thumb readable, generous safe area for text, social-feed scroll-stopping.",
  },
  {
    id: "instagram_story",
    platform: "instagram",
    format: "story",
    label: "Instagram — Story (9:16)",
    aspect: "9:16",
    copy: { headlineMaxWords: 6, bodyMaxWords: 0, ctaMaxWords: 3, tone: "punchy, single-line hook" },
    imageHint: "Vertical composition, primary subject upper-third, bottom 20% reserved for app UI, vivid lighting.",
  },
  {
    id: "linkedin_post",
    platform: "linkedin",
    format: "post",
    label: "LinkedIn — Feed (1:1)",
    aspect: "1:1",
    copy: { headlineMaxWords: 10, bodyMaxWords: 35, ctaMaxWords: 3, tone: "professional, declarative, no hashtags in copy" },
    imageHint: "Editorial, polished, subtle gradient or clean photography, professional palette emphasis.",
  },
  {
    id: "facebook_ad",
    platform: "facebook",
    format: "ad",
    label: "Facebook — Feed Ad (1:1)",
    aspect: "1:1",
    copy: { headlineMaxWords: 7, bodyMaxWords: 25, ctaMaxWords: 3, tone: "benefit-led, conversational, direct" },
    imageHint: "Single clear value prop visual, high-contrast subject, minimal text-in-image (Meta ad guideline).",
  },
  {
    id: "twitter_post",
    platform: "twitter",
    format: "post",
    label: "X / Twitter — Post (16:9)",
    aspect: "16:9",
    copy: { headlineMaxWords: 6, bodyMaxWords: 30, ctaMaxWords: 3, tone: "sharp, opinionated, one-liner energy" },
    imageHint: "Wide cinematic crop, single focal element, readable on mobile timeline at small size.",
  },
  {
    id: "web_banner",
    platform: "web",
    format: "banner",
    label: "Web — Hero Banner (16:9)",
    aspect: "16:9",
    copy: { headlineMaxWords: 6, bodyMaxWords: 20, ctaMaxWords: 3, tone: "confident, brand-led, marketing-site voice" },
    imageHint: "Cinematic hero composition, breathing room for overlaid headline, palette-led background.",
  },
  {
    id: "email_banner",
    platform: "email",
    format: "header",
    label: "Email — Header (16:9)",
    aspect: "16:9",
    copy: { headlineMaxWords: 7, bodyMaxWords: 20, ctaMaxWords: 3, tone: "warm, direct, like a subject line" },
    imageHint: "Clean horizontal banner, subject framed left or right with negative space for headline overlay.",
  },
  {
    id: "youtube_thumb",
    platform: "youtube",
    format: "thumbnail",
    label: "YouTube — Thumbnail (16:9)",
    aspect: "16:9",
    copy: { headlineMaxWords: 5, bodyMaxWords: 0, ctaMaxWords: 0, tone: "ultra-bold curiosity hook, all-caps energy" },
    imageHint: "High-contrast face or single object, oversized bold text overlay (3-5 words), saturated palette, click-worthy.",
  },
];

export function getPlatform(id: string): PlatformSpec | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
