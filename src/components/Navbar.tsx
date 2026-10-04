import ThemeToggle from "./ThemeToggle";
import { useScrollSpy } from "./effects";

const LINKS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "stack", label: "Toolkit" },
  { id: "projects", label: "Work" },
  { id: "contact", label: "Contact" },
];

export default function Navbar({ name }: { name: string }) {
  const { active, progress } = useScrollSpy(LINKS.map((l) => l.id));
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-3 md:px-6 pt-3 nav-in">
      <div className="surface surface-nav relative max-w-6xl mx-auto flex items-center justify-between pl-3 pr-2 md:pl-4 py-2">
        <a href="#top" className="flex items-center gap-3 group">
          <span className="w-8 h-8 grid place-items-center border border-zinc-900/15 dark:border-white/15 font-mono text-[11px] font-medium text-zinc-900 dark:text-white group-hover:border-emerald-500 transition-colors">
            {initials}
          </span>
          <span className="hidden sm:block text-sm font-medium text-zinc-900 dark:text-white">{name}</span>
        </a>

        <div className="hidden md:flex items-center gap-1 text-[13px]">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`relative px-3 py-1.5 transition-colors ${
                active === link.id
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {link.label}
              <span
                className={`absolute left-1/2 -bottom-0.5 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500 transition-opacity ${
                  active === link.id ? "opacity-100" : "opacity-0"
                }`}
              />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <a
            href="#contact"
            className="ml-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-[13px] font-medium hover:bg-emerald-500 hover:text-zinc-950 dark:hover:bg-emerald-400 transition-colors"
          >
            Let's talk
          </a>
        </div>

        <div
          aria-hidden
          className="absolute left-0 -bottom-px h-px w-full bg-emerald-500 origin-left"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </nav>
  );
}
