import { useRef } from "react";
import type { SkillGroup } from "../types";
import Card from "./Card";
import SectionHeading from "./SectionHeading";
import { gsap, landIn, MOTION_OK, ScrollTrigger, useGSAP } from "./gsap";

export default function Stack({ skills }: { skills: SkillGroup[] }) {
  const root = useRef<HTMLElement>(null);
  const all = skills.flatMap((g) => g.items);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // One continuous ribbon of tools. Scrolling speeds it up, matches your
        // direction, and leans it with your velocity.
        const row = root.current!.querySelector<HTMLElement>(".marquee-row")!;
        const loop = gsap.to(row, { xPercent: -50, duration: 45, ease: "none", repeat: -1 });
        const skew = gsap.quickTo(row, "skewX", { duration: 0.5, ease: "power3.out" });
        const settle = gsap.delayedCall(0.15, () => skew(0)).pause();

        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = self.getVelocity();
            const boost = 1 + Math.min(Math.abs(v) / 250, 6);
            gsap.to(loop, {
              timeScale: self.direction * boost,
              duration: 0.25,
              overwrite: true,
              onComplete: () => gsap.to(loop, { timeScale: self.direction, duration: 1.2, ease: "power2.out" }),
            });
            skew(gsap.utils.clamp(-8, 8, v / -250));
            settle.restart(true);
          },
        });

      });

      // Wide screens: the discipline cards start as one deck in the middle and are dealt
      // into place one per scroll step, like cards pulled from the project folder.
      // The whole section pins (its panel is transformed by the cursor tilt, which breaks pinning inside it).
      mm.add(`(min-width: 768px) and ${MOTION_OK}`, () => {
        const cards = gsap.utils.toArray<HTMLElement>(".skill-card");
        const grid = root.current!.querySelector<HTMLElement>(".skill-grid")!;
        const toCenter = (el: HTMLElement) => {
          const g = grid.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          return g.left + g.width / 2 - (r.left + r.width / 2);
        };
        const deal = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "bottom bottom", end: `+=${cards.length * 45}%`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
        cards.forEach((card, i) => {
          gsap.set(card, { zIndex: cards.length - i, transformPerspective: 1300 }); // first card dealt sits on top of the deck
          deal
            .from(card, { x: () => toCenter(card), y: 30, z: -120 - i * 40, rotateZ: (1 - i) * 6, rotateY: -18, duration: 1, ease: "power3.inOut" }, i)
            .from(card.querySelectorAll("li"), { autoAlpha: 0, x: -10, duration: 0.4, stagger: 0.06 }, i + 0.6);
        });
      });

      // Narrow screens: the cards stack in one column, so each just lands as it arrives.
      mm.add(`(max-width: 767px) and ${MOTION_OK}`, () => {
        gsap.utils.toArray<HTMLElement>(".skill-card").forEach(landIn);
      });
    },
    { scope: root }
  );

  return (
    <section id="stack" ref={root} className="scroll-mt-28 py-6 md:py-10">
      <div className="surface section-card">
      <SectionHeading
        index="03"
        eyebrow="Toolkit"
        title={<>The tools I <em>reach for</em>.</>}
        aside={`${all.length} tools across ${skills.length} disciplines.`}
      />

      <div aria-hidden className="-mx-6 md:-mx-12 lg:-mx-16 overflow-hidden py-8 md:py-12 mb-12 md:mb-16 select-none border-y border-zinc-900/10 dark:border-white/10">
        <div className="marquee-row flex w-max will-change-transform">
          {[...all, ...all].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex items-center text-4xl md:text-6xl font-medium tracking-[-0.04em] whitespace-nowrap text-zinc-900/80 dark:text-white/85"
            >
              {i % 4 === 1 ? <em className="font-serif italic font-normal text-emerald-600 dark:text-emerald-400">{item}</em> : item}
              <span className="mx-8 md:mx-12 h-2 w-2 bg-emerald-500/70" />
            </span>
          ))}
        </div>
      </div>

      <div className="skill-grid grid grid-cols-1 md:grid-cols-3 gap-5 [transform-style:preserve-3d]">
        {skills.map((group, gi) => (
          <Card key={group.category} glass depth={false} className="skill-card" label={`0${gi + 1}`} aside={`${group.items.length} tools`}>
            <h3 className="font-serif italic text-[1.7rem] leading-tight text-zinc-900 dark:text-white mb-5">{group.category}</h3>
            <ul className="skill-list divide-y divide-zinc-900/10 dark:divide-white/10">
              {group.items.map((item) => (
                <li key={item} className="flex items-center justify-between py-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {item}
                  <span className="h-1 w-1 bg-emerald-500/60" />
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      </div>
    </section>
  );
}
