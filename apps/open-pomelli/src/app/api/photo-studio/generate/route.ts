import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findStyle } from "@/lib/photo-styles";
import { generatePhotoshoot } from "@/lib/photo-studio";
import { saveGeneratedAsset } from "@/lib/assets/assetActions";

const Body = z.object({
  productImageUrl: z.string().url(),
  category: z.string().min(1),
  styleId: z.string().min(1),
  prompt: z.string().max(2000).nullable().optional(),
  brandId: z.string().nullable().optional(),
  resolution: z.enum(["1k", "2k", "4k"]).optional(),
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const found = findStyle(parsed.data.category, parsed.data.styleId);
  if (!found) return NextResponse.json({ error: "unknown style" }, { status: 400 });

  const brand = parsed.data.brandId
    ? await prisma.brandDNA.findUnique({ where: { id: parsed.data.brandId } })
    : null;
  if (parsed.data.brandId && !brand) {
    return NextResponse.json({ error: "brand not found" }, { status: 404 });
  }

   try {
     const url = await generatePhotoshoot(
       parsed.data.productImageUrl,
       found.style,
       brand,
       parsed.data.prompt ?? null,
       { aspect: found.style.aspect, resolution: parsed.data.resolution },
     );

     // Save to universal asset pipeline (non-blocking)
     try {
       await saveGeneratedAsset('image', {
         title: `Product photo - ${found.category.id} / ${found.style.id}`,
         media: { url: url },
         metadata: {
           category: found.category.id,
           styleId: found.style.id,
           styleLabel: found.style.label,
           prompt: parsed.data.prompt ?? null,
           productImageUrl: parsed.data.productImageUrl,
           aspect: found.style.aspect,
           resolution: parsed.data.resolution ?? "2k",
           brandId: parsed.data.brandId ?? null
         }
       }, 'open-pomelli');
     } catch (err) {
       console.warn('[Asset Pipeline] Failed to save photoshoot asset:', err.message);
     }

     const saved = await prisma.photoshoot.create({
      data: {
        brandId: brand?.id ?? null,
        productImageUrl: parsed.data.productImageUrl,
        category: found.category.id,
        styleId: found.style.id,
        styleLabel: found.style.label,
        prompt: parsed.data.prompt ?? null,
        imageUrl: url,
        aspect: found.style.aspect,
        resolution: parsed.data.resolution ?? "2k",
      },
    });

    return NextResponse.json({
      id: saved.id,
      imageUrl: saved.imageUrl,
      styleLabel: saved.styleLabel,
      category: saved.category,
      styleId: saved.styleId,
      aspect: saved.aspect,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
