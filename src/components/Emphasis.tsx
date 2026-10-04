import type { ReactNode } from "react";

/** Wraps each phrase found in `text` in a serif-italic accent. */
export function emphasize(text: string, phrases: string[]): ReactNode[] {
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(pattern).map((part, i) =>
    phrases.some((p) => p.toLowerCase() === part.toLowerCase()) ? (
      <em key={i} className="accent">
        {part}
      </em>
    ) : (
      part
    )
  );
}
