import { chromium } from "playwright";

export type ScrapedSite = {
  url: string;
  title: string;
  description: string;
  bodyText: string;
  ogImage: string | null;
  favicon: string | null;
  logoCandidates: string[];
  fonts: string[];
  rawColors: string[];
  screenshot: Buffer;
};

export async function scrapeSite(url: string): Promise<ScrapedSite> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    const data = await page.evaluate(() => {
      const meta = (sel: string) =>
        (document.querySelector(sel) as HTMLMetaElement | null)?.getAttribute("content") ?? "";

      const ogImage = meta('meta[property="og:image"]') || null;
      const favHref =
        (document.querySelector('link[rel~="icon"]') as HTMLLinkElement | null)?.getAttribute("href") ??
        null;

      const logos: string[] = [];
      document.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") ?? "";
        const alt = img.getAttribute("alt") ?? "";
        if (/logo/i.test(src) || /logo/i.test(alt)) {
          try {
            logos.push(new URL(src, location.href).href);
          } catch {}
        }
      });

      const fonts = new Set<string>();
      const colors = new Set<string>();
      const sample = Array.from(document.querySelectorAll("body *")).slice(0, 800);
      sample.forEach((el) => {
        const cs = getComputedStyle(el as Element);
        cs.fontFamily.split(",").forEach((f) => fonts.add(f.trim().replace(/^['"]|['"]$/g, "")));
        if (cs.color && cs.color !== "rgba(0, 0, 0, 0)") colors.add(cs.color);
        if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") colors.add(cs.backgroundColor);
      });

      const bodyText = (document.body?.innerText ?? "").slice(0, 8000);

      return {
        title: document.title ?? "",
        description:
          meta('meta[name="description"]') ||
          meta('meta[property="og:description"]') ||
          "",
        bodyText,
        ogImage,
        favicon: favHref ? new URL(favHref, location.href).href : null,
        logoCandidates: Array.from(new Set(logos)).slice(0, 5),
        fonts: Array.from(fonts).filter(Boolean).slice(0, 20),
        colors: Array.from(colors).slice(0, 40),
      };
    });

    const screenshot = await page.screenshot({ type: "png", fullPage: false });

    return {
      url,
      title: data.title,
      description: data.description,
      bodyText: data.bodyText,
      ogImage: data.ogImage,
      favicon: data.favicon,
      logoCandidates: data.logoCandidates,
      fonts: data.fonts,
      rawColors: data.colors,
      screenshot,
    };
  } finally {
    await ctx.close();
    await browser.close();
  }
}
