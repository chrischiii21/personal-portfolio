import { useRef } from "react";
import type { ExperienceEntry } from "../types";
import Card from "./Card";
import SectionHeading from "./SectionHeading";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

export default function Experience({ experience }: { experience: ExperienceEntry[] }) {
  const root = useRef<HTMLElement>(null);
  const companies = new Set(experience.map((e) => e.company)).size;
  const earliest = experience[experience.length - 1]?.period.split("–")[0].trim();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // A thin line draws down the timeline as you read.
        gsap.fromTo(
          ".timeline-fill",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: ".timeline", start: "top 60%", end: "bottom 60%", scrub: 0.5 },
          }
        );

        gsap.utils.toArray<HTMLElement>(".timeline-entry").forEach((entry) => {
          const trigger = { trigger: entry, start: "top 60%", toggleActions: "play none none reverse" };
          gsap.to(entry.querySelector(".timeline-node"), {
            backgroundColor: "#10b981",
            borderColor: "#10b981",
            boxShadow: "0 0 0 5px rgba(16,185,129,0.15)",
            duration: 0.4,
            scrollTrigger: trigger,
          });
          gsap.from(entry.querySelectorAll(".point"), {
            autoAlpha: 0,
            y: 10,
            duration: 0.6,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: trigger,
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="experience" ref={root} className="scroll-mt-28 py-6 md:py-10">
      <div className="surface section-card">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              index="02"
              eyebrow="Experience"
              title={<>Where I've <em>worked</em>.</>}
              aside={`${experience.length} roles across ${companies} companies, ${earliest} to present.`}
              depth={false}
              className="mb-0"
              size="text-4xl md:text-5xl"
            />
          </div>
        </div>

        <ol className="timeline relative lg:col-span-8 pl-8 md:pl-10 space-y-5">
          <div aria-hidden className="absolute left-[5px] top-4 bottom-4 w-px bg-zinc-900/10 dark:bg-white/10" />
          <div aria-hidden className="timeline-fill absolute left-[5px] top-4 bottom-4 w-px origin-top bg-emerald-500" />
          {experience.map((job) => (
            <li className="timeline-entry relative" key={`${job.company}-${job.title}`}>
              <span
                aria-hidden
                className="timeline-node absolute -left-8 md:-left-10 top-8 w-[11px] h-[11px] rounded-full border border-zinc-400 dark:border-white/25 bg-paper dark:bg-ink"
              />
              <Card>
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 md:gap-6 mb-1">
                  <h3 className="text-xl md:text-2xl font-medium tracking-tight text-zinc-900 dark:text-white">{job.title}</h3>
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{job.period}</span>
                </div>
                <p className="mb-6">
                  <span className="accent text-xl">{job.company}</span> <span className="text-zinc-400 dark:text-zinc-600">·</span>{" "}
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{job.location}</span>
                </p>
                <ul className="space-y-3">
                  {job.points.map((point) => (
                    <li className="point flex gap-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400" key={point}>
                      <span aria-hidden className="mt-[0.7em] h-px w-3 flex-shrink-0 bg-emerald-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      </div>
      </div>
    </section>
  );
}
