function rgbToHex(c: string): string | null {
  if (c.startsWith("#")) {
    const v = c.toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(v)) return v;
    if (/^#[0-9a-f]{3}$/.test(v)) return "#" + v.slice(1).split("").map((x) => x + x).join("");
    return null;
  }
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

export function pickPalette(rawColors: string[]): { primary: string[]; secondary: string[] } {
  const counts = new Map<string, number>();
  for (const raw of rawColors) {
    const hex = rgbToHex(raw);
    if (!hex) continue;
    if (hex === "#ffffff" || hex === "#000000") continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([h]) => h);
  return { primary: sorted.slice(0, 3), secondary: sorted.slice(3, 8) };
}
