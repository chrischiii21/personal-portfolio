import type { ExperienceEntry } from "../types";

export default function Experience({
  experience,
}: {
  experience: ExperienceEntry[];
}) {
  return (
    <section id="experience" className="scroll-mt-20">
      <div className="text-xs md:text-sm mb-8 text-neutral-500 dark:text-slate-500">
        <span className="text-neutral-400 dark:text-slate-600">$</span> cat experience.log
      </div>
      <div className="space-y-10">
        {experience.map((job) => (
          <div
            className="reveal-item border-l-2 border-neutral-200 dark:border-white/10 pl-6 hover:border-emerald-500/50 transition-colors"
            key={`${job.company}-${job.title}`}
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-1 mb-2">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {job.title}
              </h3>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                [{job.period}]
              </span>
            </div>
            <p className="text-neutral-500 dark:text-slate-500 text-sm mb-4">
              {job.company} · {job.location}
            </p>
            <ul className="space-y-2">
              {job.points.map((point) => (
                <li className="flex items-start gap-2 text-neutral-600 dark:text-slate-400 text-sm" key={point}>
                  <span className="text-emerald-600 dark:text-emerald-500 flex-shrink-0">&gt;_</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
