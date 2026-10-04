import { useRef } from "react";
import type { Profile } from "../types";
import CvPreview from "./CvPreview";
import LinkIcon from "./LinkIcon";
import { profileLinks, useLocalTime } from "./effects";
import { GLYPHS, gsap, MOTION_OK, SplitText, useGSAP } from "./gsap";

export default function Contact({ profile }: { profile: Profile }) {
  const root = useRef<HTMLElement>(null);
  const time = useLocalTime();
  const links = profileLinks(profile).filter((l) => l.label !== "email");

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(".contact-headline", { type: "words", mask: "words" });
        gsap
          .timeline({ scrollTrigger: { trigger: ".contact-headline", start: "top 80%", toggleActions: "play none none reverse" } })
          .from(".contact-eyebrow", { autoAlpha: 0, y: 8, duration: 0.6 })
          .from(split.words, { yPercent: 105, duration: 1.1, stagger: 0.05, ease: "expo.out" }, 0.1)
          .from(".contact-action", { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.07, ease: "power3.out" }, 0.5);
        return () => split.revert();
      });
    },
    { scope: root }
  );

  // A small flourish: the address re-types itself on hover.
  const rescramble = contextSafe(() => {
    if (window.matchMedia(MOTION_OK).matches) {
      gsap.to(".contact-email", { duration: 0.7, scrambleText: { text: profile.email, chars: GLYPHS, speed: 0.6 }, overwrite: true });
    }
  });

  const details = [
    ["Location", profile.location],
    ["Local time", time ? `${time} (UTC+8)` : "UTC+8"],
  ];

  return (
    <section id="contact" ref={root} className="scroll-mt-28 pt-6 md:pt-10">
      <div className="surface section-card overflow-hidden">
        <p className="contact-eyebrow flex items-center gap-3 mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          <span className="text-emerald-600 dark:text-emerald-400">05</span>
          <span className="h-px w-10 bg-zinc-400/50 dark:bg-white/15" />
          Contact
        </p>
        <h2 className="contact-headline text-[clamp(2.5rem,7vw,5.5rem)] font-medium tracking-[-0.045em] leading-[0.98] text-zinc-900 dark:text-white mb-12 max-w-4xl">
          Let's build something that <em>converts</em>.
        </h2>

        <a
          href={`mailto:${profile.email}`}
          onMouseEnter={rescramble}
          className="contact-action group inline-flex items-center gap-4 mb-12 max-w-full"
        >
          <span className="contact-email font-serif italic text-2xl sm:text-3xl md:text-5xl tracking-tight text-zinc-900 dark:text-white break-all group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {profile.email}
          </span>
          <span className="grid place-items-center w-11 h-11 md:w-14 md:h-14 flex-shrink-0 bg-emerald-500 text-zinc-950 text-xl transition-transform group-hover:rotate-45">
            ↑
          </span>
        </a>

        <div className="flex flex-wrap gap-3">
          <span className="contact-action">
            <CvPreview />
          </span>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="contact-action inline-flex items-center gap-2 border border-zinc-900/15 dark:border-white/15 px-5 py-3 text-sm font-medium text-zinc-900 dark:text-white hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <LinkIcon name={link.label} className="w-4 h-4" />
              {link.name} <span className="text-zinc-400">↗</span>
            </a>
          ))}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-14 pt-6 border-t border-zinc-900/10 dark:border-white/10">
          {details.map(([k, v]) => (
            <div key={k} className="contact-action">
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 mb-1.5">{k}</dt>
              <dd className="text-sm text-zinc-800 dark:text-zinc-200">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <footer className="flex flex-col md:flex-row justify-between items-center gap-3 py-10 text-[13px] text-zinc-500 dark:text-zinc-400">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <a href="#top" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
          Back to top ↑
        </a>
      </footer>
    </section>
  );
}
