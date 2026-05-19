export default function Timeline({ clips }) {
  return <div className="h-32 bg-black/60">Timeline: {clips?.length || 0} clips</div>;
}