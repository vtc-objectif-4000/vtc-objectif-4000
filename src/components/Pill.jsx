import { cn } from "@/utils/formatters";

export default function Pill({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pine-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
