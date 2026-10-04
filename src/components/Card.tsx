import type { ReactNode } from "react";

/** A quiet surface floating over the 3D scene, with an optional mono label. */
export default function Card({
  label,
  aside,
  children,
  className = "",
  depth = true,
}: {
  label?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  depth?: boolean;
}) {
  return (
    <div data-depth={depth ? "" : undefined} className={`surface p-6 md:p-8 ${className}`}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-4 mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          <span>{label}</span>
          {aside && <span className="normal-case tracking-normal">{aside}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
