import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Project } from "../types";
import SectionHeading from "./SectionHeading";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "./gsap";

const ProjectFolder = lazy(() => import("./ProjectFolder"));

const shot = (project: Project) => `/projects/${project.url}.jpg`;

function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!project) return;
    dialog.current!.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [project]);

  return (
    <dialog
      ref={dialog}
      // "close" fires async; skip it if another card already reopened the dialog.
      onClose={() => !dialog.current!.open && onClose()}
      // Clicks on the backdrop land on the <dialog> itself.
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
      aria-labelledby="project-modal-title"
      className="m-auto w-[min(1280px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] p-0 bg-transparent text-inherit backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      {project && (
        <div className="surface surface-solid flex flex-col max-h-[calc(100dvh-2rem)]">
          <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-7 border-b border-zinc-900/10 dark:border-white/10">
            <h3 id="project-modal-title" className="text-2xl md:text-3xl font-medium tracking-[-0.035em] text-zinc-900 dark:text-white">
              {project.name}
            </h3>
            <button
              type="button"
              onClick={() => dialog.current!.close()}
              aria-label="Close"
              className="grid place-items-center w-9 h-9 flex-shrink-0 border border-zinc-900/15 dark:border-white/15 text-zinc-900 dark:text-white hover:bg-emerald-500 hover:border-emerald-500 hover:text-zinc-950 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto lg:grid lg:grid-cols-[1fr_300px]">
            <img
              src={shot(project)}
              alt={`Screenshot of ${project.name}`}
              width={1280}
              height={800}
              className="block w-full h-auto border-b lg:border-b-0 lg:border-r border-zinc-900/10 dark:border-white/10"
            />
            <div className="flex flex-col justify-between gap-6 px-5 py-6 md:px-7">
              <div>
                {project.status && (
                  <span className="inline-flex items-center gap-1.5 mb-3 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
                    {project.status}
                  </span>
                )}
                <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400 mb-4 max-w-2xl">{project.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((t) => (
                    <span
                      className="border border-zinc-900/10 dark:border-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400"
                      key={t}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={`https://${project.url}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center justify-center gap-3 px-5 py-3 bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400 transition-colors"
              >
                Visit site
                <span className="transition-transform group-hover:rotate-45">↑</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<Project | null>(null);

  // The WebGL folder loads once the section is near, and only renders frames while on screen.
  const slot = useRef<HTMLDivElement>(null);
  const [folderActive, setFolderActive] = useState<boolean | null>(null);
  const [featured, setFeatured] = useState(-1);
  const [hovered, setHovered] = useState<number | null>(null);
  // Touch never fires pointerout, so a tapped card would stay lifted; the next scroll step clears it.
  useEffect(() => setHovered(null), [featured]);
  const folderExit = useRef(0); // 0–1 over the last scroll step, read every frame by the folder
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setFolderActive((was) => (was === null && !e.isIntersecting ? null : e.isIntersecting)), {
      rootMargin: "200px",
    });
    io.observe(slot.current!);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // The folder holds still while each scroll step pulls the next card out of it.
      mm.add(MOTION_OK, () => {
        ScrollTrigger.create({
          trigger: slot.current,
          start: "center center",
          end: () => `+=${(projects.length + 1) * 55}%`,
          pin: true,
          // One extra step up front so the folder starts with every card tucked in, and one at
          // the end where the cards fly out toward you and the page moves on.
          onUpdate: (self) => {
            const step = self.progress * (projects.length + 2);
            setFeatured(Math.min(projects.length, Math.floor(step)) - 1);
            folderExit.current = gsap.utils.clamp(0, 1, step - (projects.length + 1));
            slot.current!.style.opacity = String(1 - gsap.utils.clamp(0, 1, (folderExit.current - 0.4) / 0.6));
          },
        });
        return () => {
          setFeatured(-1);
          folderExit.current = 0;
          slot.current!.style.opacity = "";
        };
      });
    },
    { scope: root }
  );

  return (
    <section id="projects" ref={root} className="scroll-mt-28 pt-6 md:pt-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="surface surface-soft px-6 py-6 md:px-10 md:py-8">
          <SectionHeading index="04" eyebrow="Selected work" title={<>Things I've <em>built</em>.</>} depth={false} className="" size="text-4xl md:text-5xl" />
        </div>
      </div>

      <div
        ref={slot}
        className="max-w-6xl mx-auto px-4 md:px-8 h-[520px] md:h-[640px] flex flex-col bg-[radial-gradient(ellipse_at_50%_42%,rgba(16,185,129,0.22),transparent_62%)]"
      >
        <div className="flex-1 min-h-0">
          {folderActive !== null && (
            <Suspense fallback={null}>
              <ProjectFolder
                projects={projects}
                active={folderActive}
                featured={featured}
                exit={folderExit}
                hovered={hovered}
                setHovered={setHovered}
                onOpen={setOpen}
              />
            </Suspense>
          )}
        </div>

        {/* The folder's index: shows which card is out, lifts a card on hover, opens it on click.
            Also the keyboard and screen-reader route to every project (the canvas is mouse/touch only). */}
        <ul aria-label="Projects" className="flex flex-wrap justify-center gap-2 pb-4">
          {projects.map((p, i) => {
            const on = (hovered ?? featured) === i;
            return (
              <li key={p.url}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setOpen(p)}
                  onPointerEnter={() => setHovered(i)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  className={`glass flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    on ? "border-emerald-500! text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span className={`font-mono text-[10px] ${on ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`}>{String(i + 1).padStart(2, "0")}</span>
                  {p.name}
                  {p.status && <span className="w-1.5 h-1.5 bg-amber-500" title={p.status} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}
