import { cn } from "@/utils/formatters";

export default function LoadingState({ label = "Chargement...", fullScreen = false }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen" : "min-h-[240px]",
      )}
    >
      <div className="flex items-center gap-4 rounded-full bg-white/90 px-5 py-4 shadow-soft">
        <span className="h-3 w-3 animate-pulse rounded-full bg-pine-500" />
        <span className="text-sm font-medium text-pine-900">{label}</span>
      </div>
    </div>
  );
}
