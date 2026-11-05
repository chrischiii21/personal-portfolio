import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, ScrambleTextPlugin, useGSAP);
}

/** Every animation is registered under this query, so reduced-motion visitors get the static site. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const DESKTOP = "(min-width: 1024px)";
export const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

/**
 * Scroll-scrubbed "rise out of the scene": the element starts tilted back and
 * pushed into the screen, and flattens as its top reaches 60% of the viewport.
 */
export function depthIn(el: Element) {
  gsap.fromTo(
    el,
    { rotateX: 22, z: -160, y: 40, autoAlpha: 0, transformPerspective: 1100, transformOrigin: "50% 100%" },
    {
      rotateX: 0,
      z: 0,
      y: 0,
      autoAlpha: 1,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "top 60%", scrub: 0.6 },
    }
  );
}

/** Where a glass item starts before it "lands": below, pushed back, and flipped away, like an incoming message. */
// No perspective here: inside a from() tween it would animate down to 0 and distort the
// element mid-flight. Set it once with `gsap.set(el, { transformPerspective })` instead.
export const LAND = { autoAlpha: 0, y: 70, z: -220, rotateX: -35, transformOrigin: "50% 100%" };

/** Scroll-scrubbed landing for one item, so a list arrives one by one as you scroll through it. */
export function landIn(el: Element) {
  gsap.set(el, { transformPerspective: 1200 });
  gsap.from(el, { ...LAND, ease: "back.out(1.4)", scrollTrigger: { trigger: el, start: "top 95%", end: "top 62%", scrub: 0.6 } });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
