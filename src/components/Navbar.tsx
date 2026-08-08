import ThemeToggle from "./ThemeToggle";

const tabBase = "px-3 py-1.5 border-b-2 transition-colors";
const activeTabClass = "border-blue-500 text-neutral-900 dark:text-white font-medium";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-[#0b0e14]/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/70"></span>
          </div>
          <div className="flex items-center text-xs">
            <span className={`${tabBase} ${activeTabClass}`}>portfolio.tsx</span>
          </div>
        </div>
        <div className="flex items-center gap-5 md:gap-6">
          <div className="hidden md:flex items-center gap-5 text-[11px] uppercase tracking-widest text-neutral-500 dark:text-slate-500">
            <a href="#about" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              about
            </a>
            <a href="#experience" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              experience
            </a>
            <a href="#projects" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              projects
            </a>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
