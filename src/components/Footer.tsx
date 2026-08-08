import type { Profile } from "../types";

export default function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="border-t border-neutral-200 dark:border-white/10 px-6 md:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-neutral-500 dark:text-slate-500">
      <p>
        <span className="text-emerald-600 dark:text-emerald-400">~/christy-montejo</span> %{" "}
        <span className="cursor-blink">▍</span>
      </p>
      <p>
        © {new Date().getFullYear()} {profile.name} — built with Astro, React &amp; TypeScript
      </p>
    </footer>
  );
}
