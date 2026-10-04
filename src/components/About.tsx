import { useRef } from "react";
import type { Education, ExperienceEntry, Profile } from "../types";
import Card from "./Card";
import LinkIcon from "./LinkIcon";
import SectionHeading from "./SectionHeading";
import { emphasize } from "./Emphasis";
import { profileLinks } from "./effects";
import { gsap, MOTION_OK, SplitText, useGSAP } from "./gsap";

export default function About({
  profile,
  summary,
  education,
  experience,
}: {
  profile: Profile;
  summary: string;
  education: Education;
  experience: ExperienceEntry[];
}) {
  const root = useRef<HTMLElement>(null);
  const links = profileLinks(profile);
  const [current, ...previous] = experience;

  const facts = [
    { label: "Role", value: profile.title.split("|").map((r) => r.trim()).join(" · ") },
    { label: "Currently", value: `${current.title}, ${current.company}` },
    { label: "Previously", value: previous.map((p) => `${p.title}, ${p.company}`).join(" — ") },
    { label: "Education", value: `${education.degree}, ${education.school} (${education.period})` },
    { label: "Location", value: profile.location },
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The statement reads itself: words brighten as you scroll through it.
        const split = SplitText.create(".about-summary", { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.18 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: ".about-summary", start: "top 80%", end: "bottom 45%", scrub: true },
          }
        );

        gsap.from(".fact-row", {
          autoAlpha: 0,
          y: 14,
          duration: 0.7,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: ".facts", start: "top 78%", toggleActions: "play none none reverse" },
        });
        return () => split.revert();
      });
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="scroll-mt-28 py-6 md:py-10">
      <div className="surface section-card">
      <SectionHeading index="01" eyebrow="About" title={<>A developer who designs <em>for results</em>.</>} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-7 md:p-10">
          <p className="about-summary text-2xl md:text-[2rem] leading-[1.3] tracking-tight text-zinc-900 dark:text-white">
            {emphasize(summary, ["sales-first", "high-performance", "lead generation", "conversion optimization"])}
          </p>
        </Card>

        <Card label="At a glance" className="lg:col-span-5">
          <dl className="facts divide-y divide-zinc-900/10 dark:divide-white/10">
            {facts.map((f) => (
              <div key={f.label} className="fact-row grid grid-cols-[6.5rem_1fr] gap-4 py-3.5 first:pt-0 last:pb-0">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">{f.label}</dt>
                <dd className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card label="Find me" className="lg:col-span-12" aside={`${links.length} channels`}>
          <ul className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-3">
            {links.map((link) => (
              <li key={link.label} className="min-w-0">
                <a
                  href={link.href}
                  target={link.label === "email" ? undefined : "_blank"}
                  rel="noreferrer"
                  title={link.value}
                  className="group flex items-center gap-4 h-full p-4 border border-zinc-900/10 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/[0.05] transition-colors"
                >
                  <span className="grid place-items-center w-11 h-11 flex-shrink-0 border border-zinc-900/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-zinc-950 transition-colors">
                    <LinkIcon name={link.label} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-zinc-900 dark:text-white">{link.name}</span>
                    <span className="block truncate text-[13px] text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {link.handle}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500"
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      </div>
    </section>
  );
}
