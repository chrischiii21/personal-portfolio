import type { Project } from "../types";

export default function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className="scroll-mt-20">
      <div className="text-xs md:text-sm mb-8 text-neutral-500 dark:text-slate-500">
        <span className="text-neutral-400 dark:text-slate-600">$</span> ls -la ~/projects
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <a
            href={`https://${project.url}`}
            target="_blank"
            key={project.name}
            className="glass-card p-6 hover:border-emerald-500/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] text-neutral-400 dark:text-slate-600 mb-2">
                drwxr-xr-x
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}/
              </h3>
              <p className="text-neutral-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                {project.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {project.tech.map((t) => (
                <span
                  className="text-[11px] text-emerald-600 dark:text-emerald-500"
                  key={t}
                >
                  #{t.toLowerCase().replace(/\s+/g, "")}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
