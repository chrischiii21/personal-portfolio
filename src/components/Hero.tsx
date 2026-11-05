import { useRef, type PointerEvent } from "react";
import type { Education, ExperienceEntry, Profile } from "../types";
import CvPreview from "./CvPreview";
import { prefersReducedMotion, useLocalTime, useTilt } from "./effects";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "./gsap";

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
        // The quality word rolls through every phrase, like a slot machine.
        const words = gsap.utils.toArray<HTMLElement>(".rotator-word");
        gsap.set(words, { autoAlpha: 1, yPercent: 110 });
        gsap.set(words[0], { yPercent: 0 });
        const roll = gsap.timeline({ repeat: -1, delay: 2.2 });
        words.forEach((word, i) => {
          const next = words[(i + 1) % words.length];
          roll
            .to(word, { yPercent: -110, duration: 0.9, ease: "expo.inOut" }, "+=1.6")
            // immediateRender off: otherwise building the last step (back to the first word)
            // would push the first word out of view before the loop ever starts.
            .fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.inOut", immediateRender: false }, "<");
        });
      });

      /**
       * First scroll: the landing's words travel into their places in the hero ("Christy",
       * "Montejo", the role line) while the backdrop dissolves and the hero panel forms around
       * them, then the real hero text takes over in the same spot. `headerTop` is where the
       * header sits on screen while this plays (it may be pinned a little above the top).
       */
      const morph = (tl: gsap.core.Timeline, headerTop: () => number) => {
        const header = root.current!;
        const landing = document.querySelector<HTMLElement>(".landing");
        if (!landing) {
          tl.set("[data-intro='split'], [data-intro='eyebrow']", { autoAlpha: 1 }).addLabel("name");
          return;
        }
        // Layout position inside an ancestor, ignoring transforms (so it stays right mid-animation).
        const offsetIn = (el: HTMLElement, ancestor: HTMLElement) => {
          let x = 0;
          let y = 0;
          for (let n: HTMLElement | null = el; n && n !== ancestor; n = n.offsetParent as HTMLElement | null) {
            x += n.offsetLeft;
            y += n.offsetTop;
          }
          return { x, y };
        };
        const fontSize = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
        const pairs = [
          [".landing-first", ".hero-first"],
          [".landing-last", ".hero-last"],
          [".landing-role", ".hero-role"],
        ].map(([a, b]) => [landing.querySelector<HTMLElement>(a)!, header.querySelector<HTMLElement>(b)!] as const);

        tl.to(landing.querySelector(".landing-bg"), { autoAlpha: 0, duration: 1, ease: "power2.inOut" }, 0)
          .to(landing.querySelector(".landing-cue"), { autoAlpha: 0, duration: 0.3 }, 0)
          .from(".hero-card", { autoAlpha: 0, scale: 0.97, duration: 1, ease: "power2.out" }, 0);

        pairs.forEach(([from, to]) => {
          // The role line wraps onto two lines on narrow screens; there it just crossfades.
          if (to.getClientRects().length > 1) {
            tl.to(from, { autoAlpha: 0, duration: 0.4 }, 0);
            return;
          }
          const scale = () => fontSize(to) / fontSize(from);
          gsap.set(from, { transformOrigin: "0 0" });
          tl.to(
            from,
            {
              x: () => header.getBoundingClientRect().left + offsetIn(to, header).x - offsetIn(from, landing).x,
              // Line boxes differ in height, so match vertical centres rather than tops.
              y: () =>
                headerTop() + offsetIn(to, header).y + to.offsetHeight / 2 - (offsetIn(from, landing).y + (from.offsetHeight * scale()) / 2),
              scale,
              duration: 1,
              ease: "power3.inOut",
            },
            0
          );
        });

        // Hand-off: the real hero text appears exactly where the landing words landed.
        tl.set("[data-intro='split'], [data-intro='eyebrow']", { autoAlpha: 1 })
          .set(landing, { autoAlpha: 0 })
          .from(".hero-dot", { autoAlpha: 0, duration: 0.25 })
          .addLabel("name");
      };
      const recede = { yPercent: -8, z: -200, rotateX: 10, autoAlpha: 0, transformOrigin: "50% 100%", ease: "none" };

      // Desktop: the hero holds still and each scroll adds one detail (name, photo, pitch,
      // actions, facts), then it recedes into the scene and the reel takes over.
      mm.add(`(min-width: 768px) and (min-height: 600px) and ${MOTION_OK}`, () => {
        const reveal = gsap.timeline({ defaults: { ease: "power3.out" } });
        const pinOffset = () => Math.max(0, root.current!.offsetHeight - window.innerHeight);
        morph(reveal, () => -pinOffset());
        reveal
          // Photo wipes in (settling from a slight zoom) as the pitch arrives beside it.
          .from("[data-intro='photo']", { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)", duration: 1, ease: "expo.inOut" })
          .from(".hero-img", { scale: 1.25, duration: 1.2 }, "<")
          .from("[data-intro='frame']", { autoAlpha: 0, x: -16, y: -16, duration: 0.6 }, "-=0.6")
          .from("[data-intro='pitch']", { autoAlpha: 0, y: 28, duration: 0.7 }, "<-0.4")
          .addLabel("about")
          .from("[data-intro='actions']", { autoAlpha: 0, y: 28, duration: 0.7 })
          .from("[data-intro='stat']", { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.1 }, "<0.15")
          .addLabel("details")
          .to(".hero-card", { ...recede, duration: 1 }, "+=0.4")
          .addLabel("out");

        ScrollTrigger.create({
          animation: reveal,
          trigger: root.current,
          // The hero can be a little taller than the screen; pin once its bottom edge is in view.
          start: pinOffset,
          end: () => `+=${window.innerHeight * 3}`,
          pin: true,
          scrub: 0.8,
          // Nearest, not directional: a directional snap reads its own motion as another scroll and chains shot to shot.
          snap: { snapTo: "labels", duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: "power2.inOut", inertia: false },
          invalidateOnRefresh: true,
        });
      });

      // Small screens: the hero is taller than the screen, so after the name settles the
      // details reveal as they scroll into view.
      mm.add(`((max-width: 767px) or (max-height: 599px)) and ${MOTION_OK}`, () => {
        const curtain = gsap.timeline();
        morph(curtain, () => 0);
        ScrollTrigger.create({ animation: curtain, trigger: root.current, start: "top top", end: "+=80%", pin: true, scrub: 0.6 });

        const photo = { trigger: "[data-intro='photo']", start: "top 85%" };
        gsap.from("[data-intro='photo']", { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: photo });
        gsap.from("[data-intro='frame']", { autoAlpha: 0, x: -16, y: -16, duration: 1, delay: 0.6, ease: "expo.out", scrollTrigger: photo });
        ["[data-intro='pitch']", "[data-intro='actions']"].forEach((sel) =>
          gsap.from(sel, { autoAlpha: 0, y: 24, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: sel, start: "top 88%" } })
        );
        gsap.from("[data-intro='stat']", { autoAlpha: 0, y: 14, duration: 0.7, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: "[data-intro='stat']", start: "top 92%" } });
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "bottom 60%", end: "bottom top", scrub: 0.8 } })
          .to(".hero-card", recede);
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
                <span className="absolute inset-0 bg-emerald-500 animate-ping opacity-60" />
                <span className="relative h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hero-role">
                {roles.join(" & ")} — {city}
              </span>
            </p>

            <h1
              data-intro="split"
              aria-label={profile.name}
              className="hero-name text-[clamp(3.5rem,11vw,8.75rem)] font-semibold tracking-[-0.05em] leading-[0.88] text-zinc-900 dark:text-white mb-10"
            >
              <span className="block">
                <span className="hero-first inline-block">{firstName}</span>
              </span>
              <span className="block">
                <em className="pr-[0.06em]">
                  <span className="hero-last inline-block">{rest.join(" ")}</span>
                  <span className="hero-dot">.</span>
                </em>
              </span>
            </h1>

            <p
              data-intro="pitch"
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

            <div data-intro="actions" className="flex flex-wrap items-center gap-3">
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

/**
 * The landing screen: just the name and role over a plain backdrop. On the first scroll
 * (driven from Hero's timeline) each word travels into its place in the hero while the
 * backdrop dissolves. While fonts load the name stays hidden, and a thin line runs along
 * the bottom until the page has loaded. Reduced-motion and no-JS visitors skip it.
 */
export function Landing({ profile }: { profile: Profile }) {
  const [firstName, ...rest] = profile.name.split(" ");
  const roles = profile.title.split("|").map((r) => r.trim());
  const city = profile.location.split(",")[0];

  return (
    <div aria-hidden className="landing fixed inset-0 z-[70] hidden [.js_&]:grid motion-reduce:hidden! place-items-center pointer-events-none">
      <div className="landing-bg absolute inset-0 bg-paper dark:bg-ink" />
      <div className="landing-inner relative text-center px-4 opacity-0 translate-y-3 transition-[opacity,translate] duration-1000 ease-out [.fonts-ready_&]:opacity-100 [.fonts-ready_&]:translate-y-0">
        {/* Same type settings as the hero name, so the words can travel into it seamlessly. */}
        <p className="text-[clamp(2.25rem,7vw,5rem)] font-semibold tracking-[-0.05em] leading-none text-zinc-900 dark:text-white">
          <span className="landing-first inline-block">{firstName}</span>{" "}
          <em className="landing-last accent inline-block pr-[0.06em]">{rest.join(" ")}</em>
        </p>
        <p className="mt-5">
          <span className="landing-role inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {roles.join(" & ")} — {city}
          </span>
        </p>
      </div>

      <p className="landing-cue absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 opacity-0 transition-opacity duration-700 [.loaded_&]:opacity-100">
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-zinc-900/10 dark:bg-white/10">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-emerald-500 animate-[cue_1.6s_ease-in-out_infinite]" />
        </span>
      </p>

      {/* Loading line: sweeps until the page has loaded, then fades. */}
      <span className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-700 [.loaded_&]:opacity-0">
        <span className="block h-full w-1/3 bg-emerald-500 animate-[loadbar_1.4s_ease-in-out_infinite]" />
      </span>
    </div>
  );
}
