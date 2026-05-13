import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CanvasEditor } from "./canvas";
import { defaultLayout, type Layout } from "@/lib/layout";

function parseList(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default async function AssetEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { campaign: { include: { brand: true } } },
  });
  if (!asset) notFound();

  let aspect = "1:1";
  let savedLayout: Layout | null = null;
  try {
    const meta = JSON.parse(asset.variants ?? "{}");
    if (typeof meta.aspect === "string") aspect = meta.aspect;
    if (meta.layout) savedLayout = meta.layout as Layout;
  } catch {}

  const brandFonts = parseList(asset.campaign.brand.fonts);
  const paletteColors = [
    ...parseList(asset.campaign.brand.primaryColors),
    ...parseList(asset.campaign.brand.secondaryColors),
  ];

  const initial =
    savedLayout ??
    defaultLayout(
      asset.headline ?? "",
      asset.body ?? "",
      asset.cta ?? "",
      brandFonts[0]
        ? `${brandFonts[0]}, system-ui, sans-serif`
        : "ui-sans-serif, system-ui, sans-serif",
    );

  return (
    <CanvasEditor
      assetId={asset.id}
      campaignId={asset.campaignId}
      aspect={aspect}
      imageUrl={asset.imageUrl}
      initial={initial}
      brandFonts={brandFonts}
      paletteColors={paletteColors}
    />
  );
}
