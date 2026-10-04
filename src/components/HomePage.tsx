import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import About from "./About";
import Experience from "./Experience";
import Stack from "./Stack";
import Projects from "./Projects";
import Contact from "./Contact";
import type { Profile, SkillGroup, Education, ExperienceEntry, Project } from "../types";
import { prefersReducedMotion } from "./effects";
import { depthIn, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "./gsap";

const Scene3D = lazy(() => import("./Scene3D"));

const CONTAINER = "max-w-6xl mx-auto px-4 md:px-8";

export const profile: Profile = {
  name: "Christy Montejo",
  title: "Front-end Web Developer | UI/UX Designer",
  location: "Cebu City, Philippines",
  email: "christymontejo2003@gmail.com",
  github: "github.com/chrischiii21",
  linkedin: "www.linkedin.com/in/christy-montejo-a54807221",
  website: "christy-montejo.vercel.app",
};

export const summary = `Front-end developer and UI/UX designer specializing in high-performance web applications built with Astro, React, and Tailwind CSS. I focus on "sales-first" design philosophies—creating digital experiences for trade-specific industries that prioritize lead generation and conversion optimization.`;

export const skills: SkillGroup[] = [
  {
    category: "Development",
    items: [
      "JavaScript",
      "TypeScript",
      "React",
      "Astro",
      "Tailwind CSS",
      "Vite",
      "Node.js",
    ],
  },
  {
    category: "Design & Optimization",
    items: [
      "UI/UX Design",
      "Figma",
      "CRO",
      "Performance Optimization",
      "Responsive Design",
    ],
  },
  {
    category: "AI & Prompt Engineering",
    items: ["Prompt Engineering", "Claude Code", "Gemini"],
  },
];

export const experience: ExperienceEntry[] = [
  {
    title: "Web Developer",
    company: "N-Compass TV / NTV360",
    period: "Jul 2026 – Present",
    location: "Cebu City",
    points: [
      "Built web applications and high-conversion websites for company dealers, applying CRO-focused design to drive lead generation",
      "Contributed franchise dashboard features to systematize and streamline the developer workflow",
      "Maintained and extended web features across internal tools and client-facing platforms",
    ],
  },
  {
    title: "IT Intern (OJT)",
    company: "N-Compass TV / NTV360",
    period: "Jan 2026 – May 2026",
    location: "Cebu City",
    points: [
      "Designed UI/UX for internal tools and platform features",
      "Developed comprehensive template galleries for various trades",
      "Performed QA testing on showcase modules",
    ],
  },
  {
    title: "ESL Teacher",
    company: "Happy Planet",
    period: "2024 – 2025",
    location: "Remote",
    points: [
      "Conducted English language lessons for international students",
      "Developed personalized communication strategies",
    ],
  },
];

export const projects: Project[] = [
  {
    name: "Montejo's Lechon",
    description:
      "Our family business website for Montejo's Lechon & Food Trays in Argao, Cebu — menu, party packages, and ordering for charcoal-roasted lechon since 1994.",
    tech: ["Astro", "TypeScript", "CSS", "JavaScript"],
    url: "montejoslnft-online.vercel.app",
    status: "in progress",
  },
  {
    name: "Internship Tracker",
    description:
      "Professional management dashboard for tracking internship hours and administrative progress in real-time.",
    tech: ["Astro", "Python", "TypeScript", "JavaScript"],
    url: "internship-tracker-self.vercel.app",
  },
  {
    name: "TicketFlow",
    description:
      "Visual automation tool for generating high-quality, numbered tickets and certificates from custom templates.",
    tech: ["Astro", "CSS", "JS"],
    url: "ticket-automation-two.vercel.app",
  },
  {
    name: "Prompt Bucket",
    description:
      "Community-driven library for AI prompts, optimized for high-fidelity image and video generation.",
    tech: ["TypeScript", "Astro", "CSS", "JavaScript"],
    url: "prompt-bucket.vercel.app",
  },
  {
    name: "Hyperlinks",
    description:
      "Utility for cleaning, formatting, and sanitizing raw text and links for professional documentation platforms.",
    tech: ["TypeScript", "Astro", "Other"],
    url: "hyper-links.vercel.app",
  },
  {
    name: "Certify",
    description:
      "Event management platform featuring automated certificate distribution and real-time claim tracking.",
    tech: ["TypeScript", "CSS", "JavaScript"],
    url: "automated-certs.vercel.app",
  },
];

export const education: Education = {
  degree: "B.S. Information Technology",
  school: "Cebu Technological University - Argao Campus",
  period: "2022 – 2026",
};

export default function HomePage() {
  const root = useRef<HTMLElement>(null);

  // The WebGL scene is client-only and loaded lazily so it never blocks first paint.
  const [showScene, setShowScene] = useState(false);
  useEffect(() => {
    if (!prefersReducedMotion()) setShowScene(true);
  }, []);

  // Runs after every section has set up its own ScrollTriggers (parents mount
  // last), so pin spacing from Projects is already in place.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-depth]").forEach(depthIn);
      });
      // Every section panel tracks the cursor: a spotlight follows it, and the
      // panel leans toward it in 3D. (The hero only gets the spotlight — its
      // transform belongs to the scroll exit.)
      const panels = gsap.utils.toArray<HTMLElement>(".section-card");
      const cleanups = panels.map((panel) => {
        const tilt = !panel.classList.contains("hero-card") && window.matchMedia(`${MOTION_OK} and (pointer: fine)`).matches;
        const rx = tilt ? gsap.quickTo(panel, "rotationX", { duration: 0.9, ease: "power3.out" }) : null;
        const ry = tilt ? gsap.quickTo(panel, "rotationY", { duration: 0.9, ease: "power3.out" }) : null;
        if (tilt) gsap.set(panel, { transformPerspective: 2000 });

        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const r = panel.getBoundingClientRect();
          panel.style.setProperty("--sx", `${e.clientX - r.left}px`);
          panel.style.setProperty("--sy", `${e.clientY - r.top}px`);
          rx?.(-((e.clientY - r.top) / r.height - 0.5) * 3);
          ry?.(((e.clientX - r.left) / r.width - 0.5) * 4);
        };
        const onLeave = () => {
          panel.style.removeProperty("--sx");
          panel.style.removeProperty("--sy");
          rx?.(0);
          ry?.(0);
        };
        panel.addEventListener("pointermove", onMove);
        panel.addEventListener("pointerleave", onLeave);
        return () => {
          panel.removeEventListener("pointermove", onMove);
          panel.removeEventListener("pointerleave", onLeave);
        };
      });

      // Web fonts change line lengths, so re-measure once they've loaded.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      // In-page links glide instead of jumping (CSS smooth scroll fights ScrollTrigger pins).
      const onClick = (e: MouseEvent) => {
        const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
        const target = link && document.querySelector(link.getAttribute("href")!);
        if (!target) return;
        e.preventDefault();
        const reduce = prefersReducedMotion();
        gsap.to(window, {
          duration: reduce ? 0 : 1.2,
          ease: "power3.inOut",
          scrollTo: { y: target, offsetY: target.id === "top" ? 0 : 80 },
        });
      };
      document.addEventListener("click", onClick);
      return () => {
        document.removeEventListener("click", onClick);
        cleanups.forEach((fn) => fn());
      };
    },
    { scope: root }
  );

  return (
    <>
      {showScene && (
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      )}
      <Navbar name={profile.name} />
      <main ref={root} className="overflow-x-clip">
        <div className={CONTAINER}>
          <Hero profile={profile} current={experience[0]} education={education} />
          <About profile={profile} summary={summary} education={education} experience={experience} />
          <Experience experience={experience} />
          <Stack skills={skills} />
        </div>
        <Projects projects={projects} />
        <div className={CONTAINER}>
          <Contact profile={profile} />
        </div>
      </main>
    </>
  );
}
