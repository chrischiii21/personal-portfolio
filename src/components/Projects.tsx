import { useRef } from "react";
import type { Project } from "../types";
import SectionHeading from "./SectionHeading";
import { useTilt } from "./effects";
import { depthIn, DESKTOP, gsap, MOTION_OK, useGSAP } from "./gsap";

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const tilt = useTilt<HTMLAnchorElement>(6);

  return (
    <div className="project-card flex lg:w-[440px] lg:h-[460px] lg:flex-shrink-0">
      <a
        href={`https://${project.url}`}
        target="_blank"
        rel="noreferrer"
        {...tilt}
        className="tilt-card surface surface-solid group flex flex-col w-full p-7 md:p-8 hover:border-emerald-500/60"
      >
        <span aria-hidden className="tilt-glare" />
        <div className="flex items-start justify-between mb-auto">
          <span className="flex items-baseline gap-3">
            <span className="accent text-6xl leading-none">{String(index + 1).padStart(2, "0")}</span>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{project.tech[0]}</span>
          </span>
          {project.status ? (
            <span className="flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {project.status}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              live
            </span>
          )}
        </div>

        <div className="pt-16 lg:pt-0">
          <h3 className="text-3xl md:text-[2.15rem] font-medium tracking-[-0.035em] leading-tight text-zinc-900 dark:text-white mb-3">
            {project.name}
          </h3>
          <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 mb-6">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-7">
            {project.tech.map((t) => (
              <span
                className="border border-zinc-900/10 dark:border-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400"
                key={t}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-5 border-t border-zinc-900/10 dark:border-white/10">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              {project.url}
            </span>
            <span className="grid place-items-center w-9 h-9 flex-shrink-0 border border-zinc-900/15 dark:border-white/15 text-zinc-900 dark:text-white transition-all group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-zinc-950 group-hover:rotate-45">
              ↑
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const total = String(projects.length).padStart(2, "0");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop: pin the section and turn vertical scroll into a 3D carousel ride.
      mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
        const track = root.current!.querySelector<HTMLElement>(".project-track")!;
        const cards = gsap.utils.toArray<HTMLElement>(".project-card");
        const counter = root.current!.querySelector(".project-counter")!;
        const distance = () => track.scrollWidth - window.innerWidth;

        const ride = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".project-pin",
            pin: true,
            scrub: 1,
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const i = Math.round(self.progress * (cards.length - 1));
              counter.textContent = String(i + 1).padStart(2, "0");
            },
          },
        });

        gsap.fromTo(".project-progress", { scaleX: 0 }, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: ".project-pin", start: "top top", end: () => `+=${distance()}`, scrub: 1, invalidateOnRefresh: true },
        });

        gsap.set(cards, { transformPerspective: 1300 });
        cards.forEach((card) => {
          // Swing in from the right, face the viewer at center, swing away to the left.
          gsap.fromTo(
            card,
            { rotateY: -38, z: -320, autoAlpha: 0.25 },
            {
              rotateY: 0,
              z: 0,
              autoAlpha: 1,
              ease: "none",
              scrollTrigger: { trigger: card, containerAnimation: ride, start: "left right", end: "center center", scrub: true },
            }
          );
          gsap.to(card, {
            rotateY: 38,
            z: -320,
            autoAlpha: 0.25,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: card, containerAnimation: ride, start: "center center", end: "right left", scrub: true },
          });
        });
      });

      // Smaller screens: a regular grid where each card rises out of the scene.
      mm.add(`(max-width: 1023px) and ${MOTION_OK}`, () => {
        gsap.utils.toArray<HTMLElement>(".project-card").forEach(depthIn);
      });
    },
    { scope: root }
  );

  return (
    <section id="projects" ref={root} className="scroll-mt-28">
      <div className="project-pin py-6 md:py-10 lg:py-0 lg:h-screen lg:flex lg:flex-col lg:justify-center lg:overflow-hidden">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-8 mb-8 lg:mb-10">
          <div className="surface surface-soft flex items-end justify-between gap-6 px-6 py-6 md:px-10 md:py-8">
          <SectionHeading
            index="04"
            eyebrow="Selected work"
            title={<>Things I've <em>built</em>.</>}
            depth={false}
            className=""
            size="text-4xl md:text-5xl"
          />
          <div className="hidden lg:flex items-baseline gap-1 font-mono text-zinc-500 dark:text-zinc-400 pb-1">
            <span className="project-counter text-3xl text-zinc-900 dark:text-white">01</span>
            <span className="text-sm">/ {total}</span>
          </div>
          </div>
        </div>

        <div className="project-track grid grid-cols-1 md:grid-cols-2 gap-5 max-w-6xl mx-auto px-4 md:px-8 lg:flex lg:max-w-none lg:w-max lg:mx-0 lg:gap-10 lg:px-[calc(50vw-220px)]">
          {projects.map((project, i) => (
            <ProjectCard project={project} index={i} key={project.name} />
          ))}
        </div>

        <div className="hidden lg:block max-w-6xl w-full mx-auto px-8 mt-10">
          <div className="surface surface-soft flex items-center gap-6 px-10 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <span>Scroll</span>
          <div className="flex-1 h-px bg-zinc-900/10 dark:bg-white/10">
            <div className="project-progress h-px origin-left bg-emerald-500" />
          </div>
          <span>{projects.length} projects</span>
        </div>
        </div>
      </div>
    </section>
  );
}
