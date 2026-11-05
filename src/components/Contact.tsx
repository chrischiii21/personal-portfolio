import { useRef, useState, type FormEvent } from "react";
import type { Profile } from "../types";
import CvPreview from "./CvPreview";
import LinkIcon from "./LinkIcon";
import { profileLinks, useLocalTime } from "./effects";
import { GLYPHS, gsap, LAND, MOTION_OK, SplitText, useGSAP } from "./gsap";

// A prospective client's messages, landing one per scroll step before the contact card.
const CHAT = [
  "Our website looks fine… but the phone never rings 😩",
  "Traffic's there. Leads aren't.",
  "I need someone who builds for conversions, not just looks.",
  "Are you available? Let's talk!",
];

export default function Contact({ profile }: { profile: Profile }) {
  const root = useRef<HTMLElement>(null);
  const time = useLocalTime();
  const links = profileLinks(profile).filter((l) => l.label !== "email");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const roles = profile.title.split("|").map((r) => r.trim());
  const city = profile.location.split(",")[0];

  // No form backend: sending hands the drafted message to the visitor's own mail app.
  const send = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ subject: "Project inquiry", body: message });
    window.location.href = `mailto:${profile.email}?${params.toString().replace(/\+/g, "%20")}`;
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions, insecure origin); the address is still visible to select.
    }
  };

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The chat pins while each scroll step drops the next message in; the stack straightens as it fills.
        const msgs = gsap.utils.toArray<HTMLElement>(".chat-msg");
        const chat = gsap.timeline({
          scrollTrigger: { trigger: ".contact-chat", start: "center center", end: `+=${(msgs.length + 1) * 55}%`, pin: true, scrub: 0.6 },
        });
        chat.fromTo(".chat-stack", { rotateX: 34, rotateY: -16, rotateZ: 4 }, { rotateX: 14, rotateY: -5, rotateZ: 1, duration: msgs.length, ease: "none" }, 0);
        msgs.forEach((m, i) =>
          chat.from(m, { ...LAND, duration: 0.6, ease: "back.out(1.4)" }, i)
        );
        // Hand-off: the client's messages fall back and the reply steps forward, then the contact card takes over.
        chat
          .to(msgs.slice(0, -1), { z: -260, y: -30, autoAlpha: 0.25, duration: 0.8, stagger: 0.05, ease: "power2.in" }, msgs.length + 0.2)
          .to(msgs[msgs.length - 1], { z: 160, y: -40, duration: 0.8, ease: "power2.inOut" }, "<");

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

  return (
    <section id="contact" ref={root} className="scroll-mt-28 pt-6 md:pt-10">
      <div className="contact-chat flex items-center justify-center min-h-[80svh] py-16 [perspective:1400px] bg-[radial-gradient(ellipse_at_50%_50%,rgba(16,185,129,0.16),transparent_60%)]">
        <ol aria-label="Messages from a client" className="chat-stack w-full max-w-md space-y-3 [transform-style:preserve-3d]">
          {CHAT.map((text) => (
            <li
              key={text}
              className="chat-msg glass flex items-center gap-3 px-4 py-3"
            >
              <span aria-hidden className="relative grid place-items-center w-11 h-11 flex-shrink-0 bg-emerald-500/15 text-xl">
                👷
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              </span>
              <p className="flex-1 text-[15px] leading-snug text-zinc-800 dark:text-zinc-100">{text}</p>
              <span className="self-start font-mono text-[10px] text-zinc-500 dark:text-zinc-400">now</span>
            </li>
          ))}
          <li className="chat-msg flex items-center justify-end gap-3 pt-2">
            <p className="bg-emerald-500 px-4 py-3 text-[15px] font-medium text-zinc-950 shadow-[0_18px_50px_-15px_rgba(16,185,129,0.7)]">
              Always. Let's fix that. ✦
            </p>
            <img src="/IMG_0063.jpg" alt="" className="w-11 h-11 flex-shrink-0 object-cover grayscale" />
          </li>
        </ol>
      </div>
      <div className="surface section-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start">
          <div>
            <p className="contact-eyebrow flex items-center gap-3 mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              <span className="text-emerald-600 dark:text-emerald-400">05</span>
              <span className="h-px w-10 bg-zinc-400/50 dark:bg-white/15" />
              Contact
            </p>
            <h2 className="contact-headline text-[clamp(2.5rem,5.5vw,4.75rem)] font-medium tracking-[-0.045em] leading-[0.98] text-zinc-900 dark:text-white mb-8">
              Let's build something that <em>converts</em>.
            </h2>
            <p className="contact-action flex items-center gap-2.5 mb-10 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 bg-emerald-500 animate-ping opacity-60" />
                <span className="relative h-2 w-2 bg-emerald-500" />
              </span>
              {time ? `${time} in ${city}` : city} · UTC+8
            </p>
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
          </div>

          {/* The visitor's turn in the conversation above: draft a message, send it from their mail app. */}
          <form onSubmit={send} className="contact-action glass flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-900/10 dark:border-white/10">
              <img src="/IMG_0063.jpg" alt="" className="w-10 h-10 object-cover grayscale" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{profile.name}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{roles.join(" & ")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-900/10 dark:border-white/10 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">To</span>
              <a
                href={`mailto:${profile.email}`}
                onMouseEnter={rescramble}
                className="contact-email min-w-0 flex-1 truncate text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {profile.email}
              </a>
              <button
                type="button"
                onClick={copy}
                className="font-mono text-[10px] uppercase tracking-[0.14em] border border-zinc-900/15 dark:border-white/15 px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <label htmlFor="contact-message" className="sr-only">
              Your message
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Hi Christy, I'm looking for help with…"
              className="w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-relaxed text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus-visible:bg-emerald-500/[0.04]"
            />

            <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-zinc-900/10 dark:border-white/10">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Opens your mail app</span>
              <button
                type="submit"
                className="group inline-flex items-center gap-2 bg-emerald-500 px-5 py-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400 transition-colors shadow-[0_10px_40px_-12px_rgba(16,185,129,0.7)]"
              >
                Send message
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </div>
          </form>
        </div>
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
