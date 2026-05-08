import { getHeadshotPresetBySlug } from './headshotPresets.js';

export function buildHeadshotPrompt({ description = '', presetSlug, wardrobeChoice = '', backgroundChoice = '', tone = 'professional', realismLevel = 'high', negativePrompt = '' }) {
  const preset = getHeadshotPresetBySlug(presetSlug);
  const systemRules = [
    'Create a realistic professional headshot based on the uploaded person.',
    'Preserve facial identity, natural features, age, and likeness.',
    'Improve lighting, background, wardrobe, sharpness, and professional polish.',
    'Do not change the person\'s identity or facial structure.',
    'Avoid over-smoothing or plastic skin.',
    'Avoid unrealistic eyes, teeth, or skin textures.',
    'Avoid extra fingers, distorted ears, warped glasses, or duplicate faces.',
    'Output must be suitable for professional use.'
  ].join(' ');

  const composition = `Style: ${preset.title}. ${preset.promptAddOn}. Background: ${backgroundChoice || preset.backgroundStyle}. Wardrobe: ${wardrobeChoice || preset.wardrobeStyle}. Lighting: ${preset.lightingStyle}. Tone: ${tone}. Realism: ${realismLevel}.`;
  const details = description ? `User details: ${description}.` : '';
  const negatives = `Negative prompt: low quality, blurry, cartoon, deformed face, asymmetrical eyes, extra limbs, text artifacts${negativePrompt ? `, ${negativePrompt}` : ''}.`;

  return `${systemRules} ${composition} ${details} ${negatives}`.trim();
}
