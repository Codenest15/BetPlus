import { AppIcon } from "@/components/AppIcon";
import type { IconId } from "@/lib/icons";

interface PageHeaderProps {
  icon: IconId;
  title: string;
  subtitle?: string;
  /** Show icon only — no rounded box around it. */
  plainIcon?: boolean;
}

export function PageHeader({ icon, title, subtitle, plainIcon = false }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {plainIcon ? (
        <AppIcon name={icon} size={32} className="shrink-0" />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-soft bg-brand-light">
          <AppIcon name={icon} size={28} />
        </div>
      )}
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
