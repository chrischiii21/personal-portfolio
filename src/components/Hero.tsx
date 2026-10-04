import { useRef, type PointerEvent } from "react";
import type { Education, ExperienceEntry, Profile } from "../types";
import CvPreview from "./CvPreview";
import { prefersReducedMotion, useLocalTime, useTilt } from "./effects";
import { gsap, MOTION_OK, SplitText, useGSAP } from "./gsap";

// Each phrase comes straight from the summary.
const QUALITIES = ["sales-first", "high-performance", "conversion-focused", "lead-generating"];

export default function Hero({
  profile,
  current,
  education,
}: {
  profile: Profile;
  current: ExperienceEntry;
  education: Education;
}) {
  const root = useRef<HTMLElement>(null);
  const photoTilt = useTilt<HTMLDivElement>(10);
  const time = useLocalTime();
  const roles = profile.title.split("|").map((r) => r.trim());
  const city = profile.location.split(",")[0];
  const [firstName, ...rest] = profile.name.split(" ");

  const stats = [
    { label: "Currently", value: current.title, sub: current.company },
    { label: "Based in", value: profile.location, sub: time ? `${time} local time` : " " },
    { label: "Education", value: education.degree, sub: `Class of ${education.period.split("–").pop()?.trim()}` },
  ];

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const name = SplitText.create(".hero-name", { type: "words,chars", mask: "chars" });

        gsap
          // Masks are removed once the intro ends so they never clip descenders.
          .timeline({ defaults: { ease: "expo.out" }, onComplete: () => name.revert() })
          .set("[data-intro='split']", { autoAlpha: 1 })
          .from("[data-intro='eyebrow']", { autoAlpha: 0, y: 10, duration: 0.8 })
          .from(name.chars, { autoAlpha: 0, yPercent: 110, duration: 1.3, stagger: 0.03 }, 0.15)
          .from("[data-intro='fade']", { autoAlpha: 0, y: 18, duration: 1, stagger: 0.08 }, 0.7)
          // Photo is revealed by a wipe while the image settles from a slight zoom.
          .from("[data-intro='photo']", { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0.3)
          .from(".hero-img", { scale: 1.25, duration: 2 }, 0.6)
          .from("[data-intro='frame']", { autoAlpha: 0, x: -16, y: -16, duration: 1.2 }, 1.1)
          .from("[data-intro='stat']", { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.08 }, 1.1);

        // The quality word rolls through every phrase, like a slot machine.
        const words = gsap.utils.toArray<HTMLElement>(".rotator-word");
        gsap.set(words, { autoAlpha: 1, yPercent: 110 });
        gsap.set(words[0], { yPercent: 0 });
        const roll = gsap.timeline({ repeat: -1, delay: 2.2 });
        words.forEach((word, i) => {
          const next = words[(i + 1) % words.length];
          roll
            .to(word, { yPercent: -110, duration: 0.9, ease: "expo.inOut" }, "+=1.6")
            .fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.inOut" }, "<");
        });

        // On scroll the hero recedes into the scene.
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 } })
          .to(".hero-card", { yPercent: -8, z: -200, rotateX: 10, autoAlpha: 0, transformOrigin: "50% 100%", ease: "none" }, 0);

        return () => name.revert();
      });
    },
    { scope: root }
  );

  // The primary button leans toward the cursor.
  const onMagnet = contextSafe((e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    gsap.to(e.currentTarget, {
      x: (e.clientX - r.left - r.width / 2) * 0.3,
      y: (e.clientY - r.top - r.height / 2) * 0.4,
      duration: 0.4,
      ease: "power3.out",
    });
  });
  const offMagnet = contextSafe((e: PointerEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  });

  return (
    <header
      id="top"
      ref={root}
      className="relative min-h-[100svh] flex flex-col justify-center pt-28 pb-6 md:pb-10 [perspective:1200px]"
    >
      <div className="hero-card surface section-card">
        <div className="grid md:grid-cols-[1fr_auto] items-center gap-14 md:gap-20">
          <div>
            <p
              data-intro="eyebrow"
              className="flex items-center gap-2.5 mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {roles.join(" & ")} — {city}
            </p>

            <h1
              data-intro="split"
              aria-label={profile.name}
              className="hero-name text-[clamp(3.5rem,11vw,8.75rem)] font-semibold tracking-[-0.05em] leading-[0.88] text-zinc-900 dark:text-white mb-10"
            >
              <span className="block">{firstName}</span>
              <span className="block">
                <em className="pr-[0.06em]">{rest.join(" ")}.</em>
              </span>
            </h1>

            <p
              data-intro="fade"
              className="text-2xl md:text-[2.1rem] leading-[1.25] tracking-tight text-zinc-600 dark:text-zinc-300 max-w-2xl mb-10"
            >
              I design &amp; build websites that are{" "}
              <span className="rotator relative inline-grid overflow-hidden align-bottom pr-[0.15em] pb-[0.12em] -mb-[0.12em]">
                {QUALITIES.map((q, i) => (
                  <em
                    key={q}
                    aria-hidden={i > 0}
                    className="rotator-word accent text-[1.15em] [grid-area:1/1] whitespace-nowrap"
                  >
                    {q}.
                  </em>
                ))}
              </span>
            </p>

            <div data-intro="fade" className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${profile.email}`}
                onPointerMove={onMagnet}
                onPointerLeave={offMagnet}
                className="group inline-flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-3.5 text-sm font-medium hover:bg-emerald-400 transition-colors shadow-[0_10px_40px_-10px_rgba(16,185,129,0.7)]"
              >
                Get in touch
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <CvPreview />
              <a
                href={`https://${profile.github}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                GitHub ↗
              </a>
              <a
                href={`https://${profile.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                LinkedIn ↗
              </a>
            </div>
          </div>

          <div className="relative justify-self-center md:justify-self-end mr-4 mb-4 md:mr-0 [perspective:1000px]">
            <span
              data-intro="frame"
              aria-hidden
              className="absolute inset-0 translate-x-4 translate-y-4 border border-emerald-500/50"
            />
            <div data-intro="photo" className="relative [clip-path:inset(0%_0%_0%_0%)]">
              <div {...photoTilt} className="tilt-card relative w-60 h-72 md:w-72 md:h-[23rem] overflow-hidden surface surface-solid p-0">
                <span aria-hidden className="tilt-glare z-10" />
                <img
                  src="/IMG_0063.jpg"
                  alt={profile.name}
                  className="hero-img w-full h-full object-cover grayscale contrast-[1.05] hover:grayscale-0 transition-[filter] duration-700"
                />
              </div>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 mt-16 pt-6 border-t border-zinc-900/10 dark:border-white/10">
          {stats.map((s) => (
            <div data-intro="stat" key={s.label}>
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 mb-2">{s.label}</dt>
              <dd className="font-serif italic text-2xl leading-tight text-zinc-900 dark:text-white">{s.value}</dd>
              <dd className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{s.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
