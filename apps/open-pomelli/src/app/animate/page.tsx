import { prisma } from "@/lib/prisma";
import { Animator, type AnimationItem } from "./animator";
import { DEFAULT_PROMPTS, type SourceType } from "@/lib/animate";

function asSourceType(s: string | undefined): SourceType {
  return s === "asset" || s === "photoshoot" ? s : "upload";
}

export default async function AnimatePage({
  searchParams,
}: {
  searchParams: Promise<{ image?: string; sourceType?: string; sourceId?: string; brandId?: string }>;
}) {
  const sp = await searchParams;
  const sourceType = asSourceType(sp.sourceType);
  const initialImage = sp.image ?? null;
  const initialSourceId = sp.sourceId ?? null;
  const initialBrandId = sp.brandId ?? null;

  const recent = await prisma.animation.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const initialAnimations: AnimationItem[] = recent.map((r) => ({
    id: r.id,
    sourceImageUrl: r.sourceImageUrl,
    videoUrl: r.videoUrl,
    prompt: r.prompt,
    duration: r.duration,
    resolution: r.resolution,
    sourceType: r.sourceType,
    status: r.videoUrl ? "done" : "error",
  }));

  return (
    <Animator
      initialImage={initialImage}
      initialPrompt={DEFAULT_PROMPTS[sourceType]}
      initialSourceType={sourceType}
      initialSourceId={initialSourceId}
      initialBrandId={initialBrandId}
      initialAnimations={initialAnimations}
    />
  );
}
