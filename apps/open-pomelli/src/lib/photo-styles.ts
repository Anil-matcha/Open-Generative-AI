import type { V2Aspect } from "./muapi";

export type PhotoStyle = {
  id: string;
  label: string;
  prompt: string;
  aspect: V2Aspect;
};

export type PhotoCategory = {
  id: string;
  label: string;
  description: string;
  styles: PhotoStyle[];
};

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    id: "general",
    label: "General",
    description: "Universal product photography looks",
    styles: [
      { id: "studio_white", label: "Studio white", aspect: "1:1",
        prompt: "Clean white seamless studio background, soft diffused key light, subtle floor shadow, hero centered." },
      { id: "lifestyle_natural", label: "Lifestyle natural", aspect: "4:5",
        prompt: "Lifestyle setting with natural daylight, shallow depth of field, lived-in textures around the product." },
      { id: "dark_dramatic", label: "Dark dramatic", aspect: "1:1",
        prompt: "Moody dark backdrop, single rim light, deep shadows, premium cinematic mood." },
      { id: "gradient_modern", label: "Gradient modern", aspect: "1:1",
        prompt: "Smooth two-tone color gradient backdrop in brand-adjacent hues, soft global lighting, clean shadow." },
      { id: "paper_set", label: "Paper set", aspect: "4:5",
        prompt: "Folded colored paper backdrop and props, playful editorial styling, even lighting." },
    ],
  },
  {
    id: "beauty",
    label: "Beauty",
    description: "Skincare, cosmetics, fragrance",
    styles: [
      { id: "marble_clean", label: "Marble clean", aspect: "1:1",
        prompt: "White marble surface, ingredient minimal styling, soft daylight, fresh and aspirational." },
      { id: "water_splash", label: "Water splash", aspect: "1:1",
        prompt: "Frozen water droplet splash around the product, glossy reflective surface, cool color temperature." },
      { id: "ingredient_flat_lay", label: "Ingredient flat lay", aspect: "1:1",
        prompt: "Top-down flat lay with key natural ingredients arranged around the product, soft shadows, magazine styling." },
      { id: "soft_pastel", label: "Soft pastel", aspect: "4:5",
        prompt: "Pastel pink/peach gradient set, soft fabric folds, dreamy soft lighting, beauty-counter polish." },
      { id: "magazine_editorial", label: "Magazine editorial", aspect: "4:5",
        prompt: "High-fashion editorial composition, sculptural shadows, bold negative space, glossy magazine look." },
    ],
  },
  {
    id: "fashion",
    label: "Fashion",
    description: "Apparel, accessories",
    styles: [
      { id: "editorial_studio", label: "Editorial studio", aspect: "4:5",
        prompt: "Editorial studio with directional rim lighting, neutral seamless backdrop, structured shadows, vogue-grade composition." },
      { id: "urban_street", label: "Urban street", aspect: "4:5",
        prompt: "Urban street setting, golden hour, candid feel, shallow depth of field, on-figure feeling without showing a model." },
      { id: "minimalist_void", label: "Minimalist void", aspect: "1:1",
        prompt: "Single-color seamless void backdrop, hero subject only, sharp single light source, gallery-grade composition." },
      { id: "golden_hour", label: "Golden hour", aspect: "16:9",
        prompt: "Outdoor golden-hour scene, warm sun flare, soft long shadows, summer fashion mood." },
      { id: "monochrome", label: "Monochrome", aspect: "1:1",
        prompt: "Monochrome tonal staging — backdrop, surface and props all in one hue family complementing the product." },
    ],
  },
  {
    id: "food",
    label: "Food & Beverage",
    description: "CPG, restaurants, drinks",
    styles: [
      { id: "top_down_marble", label: "Top-down marble", aspect: "1:1",
        prompt: "Top-down view on white marble, fresh ingredient props, daylight from one side, crisp restaurant editorial." },
      { id: "rustic_wood", label: "Rustic wood", aspect: "4:5",
        prompt: "Rustic wood table, warm tungsten lighting, hand-styled imperfections, farm-to-table feel." },
      { id: "ingredient_scatter", label: "Ingredient scatter", aspect: "1:1",
        prompt: "Hero product with ingredients scattered organically around it, soft shadow, appetite-driving styling." },
      { id: "restaurant_plated", label: "Restaurant plated", aspect: "16:9",
        prompt: "Plated on a fine dining surface, narrow depth of field, ambient candle warmth, cinematic mood." },
      { id: "bright_studio", label: "Bright studio", aspect: "1:1",
        prompt: "Bright airy studio, white surface, vibrant color pop, advertising-grade clarity." },
    ],
  },
  {
    id: "home",
    label: "Home & Living",
    description: "Furniture, decor, kitchenware",
    styles: [
      { id: "scandi_living", label: "Scandi living", aspect: "16:9",
        prompt: "Scandinavian living room, white walls, natural oak, linen textures, soft window light, in-context staging." },
      { id: "warm_kitchen", label: "Warm kitchen", aspect: "4:5",
        prompt: "Warm kitchen scene, terracotta and brass accents, evening tungsten light, cozy domestic mood." },
      { id: "plant_filled", label: "Plant-filled", aspect: "4:5",
        prompt: "Indoor space filled with greenery, dappled daylight through leaves, biophilic styling." },
      { id: "gallery_white", label: "Gallery white", aspect: "1:1",
        prompt: "Minimal white gallery space, single product as sculptural object, museum lighting, design-magazine clean." },
      { id: "cozy_evening", label: "Cozy evening", aspect: "16:9",
        prompt: "Evening interior, warm lamp glow, soft fabrics and books, intimate hygge atmosphere." },
    ],
  },
  {
    id: "tech",
    label: "Tech & Hardware",
    description: "Gadgets, electronics, peripherals",
    styles: [
      { id: "white_studio_iso", label: "White studio iso", aspect: "1:1",
        prompt: "White studio infinity, clean isometric-feeling lighting, crisp specular highlights, Apple-keynote grade clarity." },
      { id: "dark_techy", label: "Dark techy", aspect: "1:1",
        prompt: "Dark studio with cyan/magenta rim lights, glossy reflection floor, futuristic premium hardware mood." },
      { id: "in_use_lifestyle", label: "In-use lifestyle", aspect: "16:9",
        prompt: "Product on a working desk surrounded by complementary tech objects, daylight, productive workspace mood." },
      { id: "minimalist_desk", label: "Minimalist desk", aspect: "16:9",
        prompt: "Minimalist desk flatlay, monochrome accessories, top-down composition, design-blog tidy." },
      { id: "blueprint_3d", label: "Blueprint", aspect: "1:1",
        prompt: "Technical blueprint backdrop with subtle grid, single hero product, cool tonal palette, engineering aesthetic." },
    ],
  },
];

export function findStyle(categoryId: string, styleId: string): { category: PhotoCategory; style: PhotoStyle } | null {
  const category = PHOTO_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;
  const style = category.styles.find((s) => s.id === styleId);
  if (!style) return null;
  return { category, style };
}
