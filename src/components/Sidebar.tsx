import type { Profile, SkillGroup, Education } from "../types";

function toKey(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export default function Sidebar({
  skills,
  education,
  profile,
}: {
  skills: SkillGroup[];
  education: Education;
  profile: Profile;
}) {
  return (
    <aside className="lg:col-span-4 space-y-6">
      <div className="glass-card p-6">
        <div className="text-xs md:text-sm mb-4 text-neutral-500 dark:text-slate-500">
          <span className="text-neutral-400 dark:text-slate-600">$</span> cat skills.json
        </div>
        <pre className="text-xs leading-loose overflow-x-auto whitespace-pre-wrap font-mono">
          <span className="text-neutral-400 dark:text-slate-600">{"{"}</span>
          {skills.map((group, i) => (
            <div className="pl-4" key={group.category}>
              <span className="text-blue-600 dark:text-blue-400">"{toKey(group.category)}"</span>
              <span className="text-neutral-400 dark:text-slate-600">: [</span>
              <div className="pl-4">
                {group.items.map((skill, idx) => (
                  <span key={skill}>
                    <span className="text-emerald-600 dark:text-emerald-400">"{skill}"</span>
                    <span className="text-neutral-400 dark:text-slate-600">
                      {idx < group.items.length - 1 ? ", " : ""}
                    </span>
                  </span>
                ))}
              </div>
              <span className="text-neutral-400 dark:text-slate-600">
                ]{i < skills.length - 1 ? "," : ""}
              </span>
            </div>
          ))}
          <span className="text-neutral-400 dark:text-slate-600">{"}"}</span>
        </pre>
      </div>

      <div className="glass-card p-6">
        <div className="text-xs md:text-sm mb-3 text-neutral-500 dark:text-slate-500">
          <span className="text-neutral-400 dark:text-slate-600">$</span> cat education.txt
        </div>
        <h5 className="text-neutral-900 dark:text-white font-bold text-sm">{education.degree}</h5>
        <p className="text-neutral-600 dark:text-slate-400 text-sm">{education.school}</p>
        <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2">{education.period}</p>
      </div>

      <div className="glass-card p-6 space-y-3">
        <div className="text-xs md:text-sm mb-1 text-neutral-500 dark:text-slate-500">
          <span className="text-neutral-400 dark:text-slate-600">$</span> cat links.txt
        </div>
        <a
          href={`https://${profile.linkedin}`}
          className="flex items-center justify-between group text-sm"
        >
          <span className="text-neutral-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            → linkedin
          </span>
        </a>
        <a
          href={`https://${profile.website}`}
          className="flex items-center justify-between group text-sm"
        >
          <span className="text-neutral-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            → portfolio
          </span>
        </a>
      </div>
    </aside>
  );
}
