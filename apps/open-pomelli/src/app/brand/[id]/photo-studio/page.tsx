import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PhotoStudio } from "@/app/photo-studio/studio";

export default async function BrandPhotoStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await prisma.brandDNA.findUnique({ where: { id } });
  if (!brand) notFound();

  const recent = await prisma.photoshoot.findMany({
    where: { brandId: id },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return (
    <PhotoStudio
      brandId={brand.id}
      brandName={brand.brandName ?? brand.url}
      initialShots={recent.map((s) => ({
        id: s.id,
        imageUrl: s.imageUrl,
        styleLabel: s.styleLabel,
        category: s.category,
        styleId: s.styleId,
        status: "done" as const,
      }))}
    />
  );
}
