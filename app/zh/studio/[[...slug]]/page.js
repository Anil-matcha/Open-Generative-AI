import StandaloneShell from '@/components/StandaloneShell';

export const metadata = {
  title: 'Studio — Open Generative AI',
};

// Additive locale route wrapper: reuses the exact same shell component as
// app/studio/[[...slug]]/page.js, only passing `locale="zh"`. A future
// locale repeats this file under app/<locale>/studio/[[...slug]]/page.js.
export default function ZhStudioPage() {
  return <StandaloneShell locale="zh" />;
}
