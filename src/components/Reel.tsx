import { useRef } from "react";
import type { ExperienceEntry, Profile, Project, SkillGroup } from "../types";
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from "./gsap";

const PROBLEMS = ["Slow load times", "Missing features", "Manual workflows", "Clunky tools"];
const FIXES = [
  { label: "Function", glyph: "◆" },
  { label: "Speed", glyph: "⚡︎" },
  { label: "Scale", glyph: "↗" },
];
const BARS = [28, 42, 36, 64, 92];
const RING = 2 * Math.PI * 90;

/**
 * A scroll-driven "showreel" between the hero and About. The stage pins and each
 * scroll snaps to the next shot, so the page plays like an edited video.
 */
export default function Reel({
  profile,
  projects,
  skills,
  experience,
}: {
  profile: Profile;
  projects: Project[];
  skills: SkillGroup[];
  experience: ExperienceEntry[];
}) {
  const root = useRef<HTMLElement>(null);
  const tools = skills.reduce((n, g) => n + g.items.length, 0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const [hook, stats, end] = q(".reel-shot");
        const splits = q(".reel-split").map((el) => SplitText.create(el, { type: "words", mask: "words" }));
        const words = (shot: Element) => splits.filter((s) => shot.contains(s.elements[0] as Node)).flatMap((s) => s.words);
        const num = q(".reel-num")[0];

        gsap.set(q(".reel-shot"), { visibility: "visible" });
        gsap.set(q(".reel-browser"), { transformPerspective: 1200 });
        gsap.set(q(".reel-bar"), { transformOrigin: "50% 100%" });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // 1 — One scene, problem to fix: the question types in over a chart stuck low, the
        // problems get struck off one by one as the bars climb, and the fix lights up underneath.
        tl.from(words(hook), { yPercent: 110, duration: 0.5, stagger: 0.05 })
          .from(q(".reel-browser"), { rotateX: 55, z: -400, autoAlpha: 0, duration: 0.6 }, "<0.15")
          .fromTo(q(".reel-bar"), { scaleY: 0 }, { scaleY: 0.18, duration: 0.3, stagger: 0.04 }, "<0.3")
          .from(q(".reel-problem"), { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.08 }, "<")
          .fromTo(q(".reel-strike"), { scaleX: 0 }, { scaleX: 1, duration: 0.3, stagger: 0.15, ease: "power2.inOut" }, "+=0.2")
          .to(q(".reel-problem"), { opacity: 0.4, duration: 0.3, stagger: 0.15 }, "<")
          .to(q(".reel-bar"), { scaleY: 1, duration: 0.8, stagger: 0.06, ease: "power2.out" }, "<0.1")
          .from(q(".reel-fix"), { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.1 }, "-=0.4")
          .addLabel("hook")
          .to(hook, { scale: 1.6, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, "+=0.3");

        // 2 — The receipts: a ring fills while the count rolls up.
        tl.from(stats, { scale: 0.85, autoAlpha: 0, duration: 0.3 })
          .fromTo(q(".reel-ring"), { strokeDashoffset: RING }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, "<")
          .from(num, { textContent: 0, snap: { textContent: 1 }, duration: 0.7, ease: "power2.inOut" }, "<")
          .from(q(".reel-stat"), { autoAlpha: 0, y: 20, duration: 0.3, stagger: 0.1 }, "-=0.2")
          .addLabel("stats")
          .to(stats, { autoAlpha: 0, y: -80, duration: 0.3, ease: "power2.in" }, "+=0.3");

        // 3 — End card, then the pin lets go into About.
        tl.from(words(end), { yPercent: 110, duration: 0.5, stagger: 0.06 })
          .from(q(".reel-sign"), { autoAlpha: 0, y: 16, duration: 0.3 }, "-=0.2")
          .addLabel("end")
          .to({}, { duration: 0.3 });

        // Attached after the timeline is built, so its length can size the scroll distance.
        ScrollTrigger.create({
          animation: tl,
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * tl.duration() * 0.75}`,
          pin: true,
          scrub: 0.8,
          // Every scroll gesture lands on the next fully built shot, like a cut.
          // Nearest, not directional: a directional snap reads its own motion as another scroll and chains shot to shot.
          snap: { snapTo: "labels", duration: { min: 0.25, max: 0.8 }, delay: 0.12, ease: "power2.inOut", inertia: false },
          invalidateOnRefresh: true,
        });

        return () => splits.forEach((s) => s.revert());
      });
    },
    { scope: root }
  );

  const shot = "reel-shot motion-safe:absolute motion-safe:inset-0 flex flex-col items-center justify-center gap-10 px-4 py-20 text-center";
  const line = "reel-split text-[clamp(2.25rem,6.5vw,5.5rem)] font-medium tracking-[-0.045em] leading-[1.02] text-zinc-900 dark:text-white";

  return (
    <section ref={root} aria-label="Showreel" className="reel relative motion-safe:h-[100svh] overflow-hidden [perspective:1400px]">
      {/* Soft vignette: the 3D scene stays alive at the edges but recedes behind the words. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_55%_50%_at_50%_50%,var(--color-paper)_35%,transparent_100%)] dark:bg-[radial-gradient(ellipse_55%_50%_at_50%_50%,var(--color-ink)_35%,transparent_100%)]"
      />
      {/* 1 — Problem to fix */}
      <div className={shot}>
        <h2 className={`${line} max-w-5xl`}>
          What if your website actually did what you <em>need?</em>
        </h2>
        <div className="reel-browser glass w-[min(560px,90vw)] p-5 text-left">
          <div aria-hidden className="flex items-center justify-between mb-4">
            <span className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2.5 h-2.5 bg-zinc-900/15 dark:bg-white/20" />
              ))}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Before → After</span>
          </div>
          <ul aria-label="Common problems" className="flex flex-wrap gap-2 mb-5">
            {PROBLEMS.map((p) => (
              <li
                key={p}
                className="reel-problem relative border border-zinc-900/10 dark:border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300"
              >
                {p}
                <span aria-hidden className="reel-strike absolute left-1.5 right-1.5 top-1/2 h-px origin-left bg-brand-500" />
              </li>
            ))}
          </ul>
          <div aria-hidden className="flex items-end gap-3 h-32">
            {BARS.map((h, i) => (
              <span key={i} className="reel-bar flex-1 bg-brand-500/80" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 mt-3 font-mono text-[11px] uppercase tracking-[0.16em]">
            <span className="text-zinc-500 dark:text-zinc-400">Features shipped</span>
            <span className="flex gap-4 text-brand-600 dark:text-brand-400">
              {FIXES.map((f) => (
                <span key={f.label} className="reel-fix">
                  <span aria-hidden>{f.glyph}</span> {f.label}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* 2 — Stats */}
      <div className={shot}>
        <div className="relative grid place-items-center">
          <svg aria-hidden viewBox="0 0 200 200" className="w-56 h-56 md:w-64 md:h-64 -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" strokeWidth="6" className="stroke-zinc-900/10 dark:stroke-white/10" />
            <circle className="reel-ring stroke-brand-500" cx="100" cy="100" r="90" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={RING} />
          </svg>
          <div className="absolute text-center">
            <span className="reel-num block text-7xl md:text-8xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">{projects.length}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">projects live</span>
          </div>
        </div>
        <dl className="flex gap-10 md:gap-16">
          {[
            [tools, "tools"],
            [experience.length, "roles"],
            [skills.length, "disciplines"],
          ].map(([n, label]) => (
            <div key={label} className="reel-stat">
              <dd className="accent text-4xl md:text-5xl">{n}</dd>
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* 3 — End card */}
      <div className={shot}>
        <h2 className={line}>
          Let's build <em>yours</em>.
        </h2>
        <p className="reel-sign font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          {profile.name} — {profile.title.replace("|", "&")}
        </p>
      </div>
    </section>
  );
}
