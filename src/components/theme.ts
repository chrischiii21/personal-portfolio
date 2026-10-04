import { useEffect, useState } from "react";
import { gsap } from "./gsap";

export function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {}
}

let running = false;

/**
 * Switches theme like a room light rather than a hard cut. The theme changes
 * immediately; a soft overlay then plays the light over the real page, never
 * fully covering it (max 85% opacity), so content is visible the whole time.
 * `--reach` is how far the light (or the glow) spreads from above the screen.
 * - On: darkness with a soft hole of light; the bulb flickers, then the light
 *   spreads down and reveals the light-mode page.
 * - Off: a glow of the old light pulls back toward the top with a last flicker,
 *   revealing the dark page from the edges in.
 */
export function setTheme(dark: boolean) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || running) return apply(dark);
  running = true;
  apply(dark);

  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.className = dark ? "room-light" : "room-dark";
  document.body.appendChild(overlay);

  const done = () => {
    overlay.remove();
    running = false;
  };

  if (!dark) {
    gsap.set(overlay, { "--reach": 18, opacity: 0.85 });
    gsap
      .timeline({ onComplete: done })
      // The bulb catches with one quick flicker.
      .to(overlay, { "--reach": 6, duration: 0.04 })
      .to(overlay, { "--reach": 28, duration: 0.04 })
      // Then light fills the room.
      .to(overlay, { "--reach": 260, duration: 0.5, ease: "power2.out" });
  } else {
    gsap.set(overlay, { "--reach": 260, opacity: 0.85 });
    gsap
      .timeline({ onComplete: done })
      .to(overlay, { "--reach": 20, duration: 0.45, ease: "power2.in" })
      // A last dying flicker.
      .to(overlay, { opacity: 0.35, duration: 0.04 })
      .to(overlay, { opacity: 0.7, duration: 0.04 })
      .to(overlay, { opacity: 0, duration: 0.15 });
  }
}

export function toggleTheme() {
  setTheme(!isDarkNow());
}

/** Current theme, kept in sync with the <html> class however it changes. */
export function useIsDark() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const update = () => setDark(isDarkNow());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}
