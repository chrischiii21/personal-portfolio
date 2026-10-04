import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Profile } from "../types";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Every outbound link in the profile, skipping any that isn't a usable URL. */
export function profileLinks(profile: Profile) {
  const lastSegment = (url: string) => url.replace(/\/+$/, "").split("/").pop() ?? url;
  const links = [
    { label: "email", name: "Email", value: profile.email, handle: profile.email, href: `mailto:${profile.email}` },
    {
      label: "github",
      name: "GitHub",
      value: profile.github,
      handle: `@${lastSegment(profile.github)}`,
      href: `https://${profile.github}`,
    },
    {
      label: "linkedin",
      name: "LinkedIn",
      value: profile.linkedin,
      // Drop LinkedIn's random id suffix ("-a54807221") for a readable handle.
      handle: `in/${lastSegment(profile.linkedin).replace(/-[a-z]*\d[a-z\d]{4,}$/, "")}`,
      href: `https://${profile.linkedin}`,
    },
  ];
  // An email address in a URL field would produce a dead link.
  return links.filter((l) => l.label === "email" || !l.value.includes("@"));
}

/** Cursor-follow 3D tilt with an emerald glare (see `.tilt-glare` in index.astro). */
export function useTilt<T extends HTMLElement>(maxDeg = 8) {
  const ref = useRef<T>(null);

  function onPointerMove(e: ReactPointerEvent<T>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(800px) rotateX(${(0.5 - y) * maxDeg}deg) rotateY(${(x - 0.5) * maxDeg * 1.4}deg) translateZ(12px)`;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }

  function onPointerLeave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return { ref, onPointerMove, onPointerLeave };
}

/** Live wall-clock time in a given zone, e.g. "14:32". Null until mounted to avoid hydration mismatch. */
export function useLocalTime(timeZone = "Asia/Manila") {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return time;
}

/** Which section is under the navbar, plus overall scroll progress (0–1). */
export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids.join()]);

  return { active, progress };
}
