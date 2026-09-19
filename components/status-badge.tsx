import { cn } from "@/lib/utils";

export function StatusBadge({
  isActive,
  activeText = "Active",
  inactiveText = "Inactive",
  className,
}: {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-600 border-slate-200",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          isActive ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {isActive ? activeText : inactiveText}
    </span>
  );
}
