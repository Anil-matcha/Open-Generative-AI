import { serve } from 'https://deno.land/x/supabase@0.36.0/mod.ts';
import { chromium } from 'https://deno.land/x/playwright@1.40.0/mod.ts';

serve(async (req) => {
  const { url } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'url required' }), { status: 400 });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const data = await page.evaluate(() => {
      const meta = (sel) => (document.querySelector(sel)?.getAttribute('content') ?? '');
      const ogImage = meta('meta[property="og:image"]') || null;
      const favHref = document.querySelector('link[rel~="icon"]')?.getAttribute('href') || null;

      const logos = [];
      document.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') ?? '';
        const alt = img.getAttribute('alt') ?? '';
        if (/logo/i.test(src) || /logo/i.test(alt)) {
          try { logos.push(new URL(src, location.href).href); } catch {}
        }
      });

      const fonts = new Set();
      const colors = new Set();
      const sample = Array.from(document.querySelectorAll('body *')).slice(0, 800);
      sample.forEach((el) => {
        const cs = getComputedStyle(el);
        cs.fontFamily.split(',').forEach(f => fonts.add(f.trim().replace(/^['"]|['"]$/g, '')));
        if (cs.color && cs.color !== 'rgba(0, 0, 0, 0)') colors.add(cs.color);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(cs.backgroundColor);
      });

      return {
        url,
        title: document.title ?? '',
        description: meta('meta[name="description"]') || meta('meta[property="og:description"]') || '',
        bodyText: (document.body?.innerText ?? '').slice(0, 8000),
        ogImage,
        favicon: favHref ? new URL(favHref, location.href).href : null,
        logoCandidates: Array.from(new Set(logos)).slice(0, 5),
        fonts: Array.from(fonts).filter(Boolean).slice(0, 20),
        colors: Array.from(colors).slice(0, 40)
      };
    });

    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    await ctx.close();
    await browser.close();

    return new Response(JSON.stringify({ ...data, screenshot: Array.from(new Uint8Array(screenshot)) }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    await ctx.close();
    await browser.close();
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
