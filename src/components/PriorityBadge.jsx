import { MODULE_PRIORITIES } from "@/config/appConfig";
import { cn } from "@/utils/formatters";

export default function PriorityBadge({ priority }) {
  const config = MODULE_PRIORITIES[priority] || MODULE_PRIORITIES.recommande;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        config.badgeClass,
      )}
    >
      {config.label}
    </span>
  );
}
