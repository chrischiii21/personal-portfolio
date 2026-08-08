import { useEffect, useState } from "react";
import type { Profile } from "../types";
import CvPreview from "./CvPreview";

function useTypewriter(text: string, speed = 55, startDelay = 200) {
  const [output, setOutput] = useState("");

  useEffect(() => {
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setOutput(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return output;
}

export default function Hero({ profile }: { profile: Profile }) {
  const typed = useTypewriter("whoami");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <header className="mb-20">
      <div className="text-xs md:text-sm mb-8 text-neutral-500 dark:text-slate-500">
        <span className="text-emerald-600 dark:text-emerald-400">~/christy-montejo</span> % {typed}
        <span className="cursor-blink">▍</span>
      </div>

      <div
        className={`flex flex-col md:flex-row items-start gap-8 md:gap-10 mb-10 transition-all duration-700 ease-out ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="w-28 h-28 md:w-36 md:h-36 flex-shrink-0 border border-neutral-300 dark:border-white/10 p-1">
          <img
            src="/IMG_0063.jpg"
            alt={profile.name}
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white mb-3">
            {profile.name}
          </h1>
          <p className="text-base md:text-lg text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-neutral-400 dark:text-slate-600"># </span>
            {profile.title}
          </p>
          <p className="text-sm text-neutral-500 dark:text-slate-500">
            <span className="text-neutral-400 dark:text-slate-600"># </span>
            {profile.location}
          </p>
        </div>
      </div>

      <div
        className={`flex flex-wrap gap-3 text-sm transition-all duration-700 ease-out delay-150 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <a
          href={`mailto:${profile.email}`}
          className="border border-neutral-300 dark:border-white/10 px-5 py-2.5 font-medium hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          [ Get in touch ]
        </a>
        <CvPreview />
        <a
          href={`https://${profile.github}`}
          target="_blank"
          className="border border-neutral-300 dark:border-white/10 px-5 py-2.5 font-medium hover:border-neutral-400 dark:hover:border-white/30 transition-colors"
        >
          [ GitHub ]
        </a>
      </div>
    </header>
  );
}
