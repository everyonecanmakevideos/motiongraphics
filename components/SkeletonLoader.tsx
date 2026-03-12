"use client";

interface Props {
  variant: "video" | "text" | "lines";
}

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div className={"relative overflow-hidden rounded bg-white/5 " + (className ?? "")}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export default function SkeletonLoader({ variant }: Props) {
  if (variant === "video") {
    return (
      <div className="relative rounded-2xl overflow-hidden glass-strong aspect-video flex items-center justify-center">
        <ShimmerBar className="absolute inset-0 rounded-2xl" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          <p className="text-sm text-neutral-400 animate-pulse-glow">Your video is being created...</p>
        </div>
      </div>
    );
  }

  if (variant === "lines") {
    return (
      <div className="flex flex-col gap-2.5 p-4">
        <ShimmerBar className="h-3 w-3/4" />
        <ShimmerBar className="h-3 w-full" />
        <ShimmerBar className="h-3 w-5/6" />
        <ShimmerBar className="h-3 w-2/3" />
        <ShimmerBar className="h-3 w-4/5" />
      </div>
    );
  }

  // text
  return <ShimmerBar className="h-4 w-48" />;
}
