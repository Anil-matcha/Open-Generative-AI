import { prisma } from "@/lib/prisma";
import { PhotoStudio } from "./studio";

export default async function PhotoStudioPage() {
  const recent = await prisma.photoshoot.findMany({
    where: { brandId: null },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return (
    <PhotoStudio
      brandId={null}
      brandName={null}
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
