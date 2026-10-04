import { useRef, type ReactNode } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "./gsap";

/** Numbered eyebrow + large title. Wrap one word of the title in <em> for the serif accent. */
export default function SectionHeading({
  index,
  eyebrow,
  title,
  aside,
  depth = true,
  className = "mb-12 md:mb-16",
  size = "text-4xl md:text-6xl",
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  depth?: boolean;
  className?: string;
  size?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(".heading-title", { type: "words", mask: "words" });
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 85%", toggleActions: "play none none reverse" } })
          .from(".heading-rule", { scaleX: 0, duration: 1, ease: "expo.out" })
          .from(".heading-eyebrow", { autoAlpha: 0, y: 8, duration: 0.6, ease: "power3.out" }, 0)
          .from(split.words, { yPercent: 105, duration: 1, stagger: 0.06, ease: "expo.out" }, 0.1)
          .from(".heading-aside", { autoAlpha: 0, duration: 0.8 }, 0.4);
        return () => split.revert();
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} data-depth={depth ? "" : undefined} className={className}>
      <div className="heading-eyebrow flex items-center gap-3 mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        <span className="text-emerald-600 dark:text-emerald-400">{index}</span>
        <span className="heading-rule h-px w-10 bg-zinc-400/50 dark:bg-white/15 origin-left" />
        <span>{eyebrow}</span>
      </div>
      <h2 className={`heading-title ${size} font-medium tracking-[-0.035em] leading-[1.05] text-zinc-900 dark:text-white`}>
        {title}
      </h2>
      {aside && <p className="heading-aside mt-5 text-sm text-zinc-500 dark:text-zinc-400 max-w-md">{aside}</p>}
    </div>
  );
}
