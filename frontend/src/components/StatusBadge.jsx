import { getStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, live = false, className }) {
  const s = getStatus(status);
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-xs font-bold font-heading tracking-wide",
        s.bg,
        s.border,
        s.text,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {live && status === "UP" && (
          <span className={cn("live-ping absolute inline-flex h-full w-full rounded-full", s.dot)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", s.dot)} />
      </span>
      {s.label}
    </span>
  );
}
