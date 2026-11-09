import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import Hero, { Landing } from "./Hero";
import Reel from "./Reel";
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
  title: "Web Developer | Web App Builder",
  location: "Cebu City, Philippines",
  email: "christymontejo2003@gmail.com",
  github: "github.com/chrischiii21",
  linkedin: "www.linkedin.com/in/christy-montejo-a54807221",
  website: "christy-montejo.vercel.app",
};

export const summary = `Web developer building purpose-built websites and fully functional web applications with Astro, React, TypeScript, and Node.js. I start from what each project actually needs—dashboards, internal tools, client-facing platforms—and ship high-performance features tailored to how people really use them.`;

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
    category: "Build & Optimization",
    items: [
      "Web App Development",
      "Performance Optimization",
      "Responsive Design",
      "Figma",
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
      "Built web applications and websites for company dealers, shaping features and functionality around each dealer's needs",
      "Contributed franchise dashboard features to systematize and streamline the developer workflow",
      "Maintained and extended web features across internal tools and client-facing platforms",
    ],
  },
  {
    title: "AI Profile Support",
    company: "Dedale Intelligence",
    period: "Nov 2025 – Oct 2026",
    location: "Remote",
    points: [
      "Outsourced to build AI profiles for the company's clients using Gemini and Claude",
      "Formatted every profile to the company's standards for consistent, client-ready output",
    ],
  },
  {
    title: "IT Intern (OJT)",
    company: "N-Compass TV / NTV360",
    period: "Jan 2026 – May 2026",
    location: "Cebu City",
    points: [
      "Built interfaces for internal tools and platform features",
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
    name: "Kwaderno",
    description:
      "An offline-first notebook for DepEd teachers — class records, attendance, automatic DepEd grade computation, SF2 and grade sheets, item analysis, AI-drafted lesson plans, and an RPMS portfolio, all from the phone's browser.",
    tech: ["JavaScript", "PWA", "Claude"],
    url: "meet-kwaderno.vercel.app",
    logo: "/projects/logos/meet-kwaderno.vercel.app.svg",
    color: "#0d5c4a",
  },
  {
    name: "Montejo's Lechon",
    description:
      "Our family business website for Montejo's Lechon & Food Trays in Argao, Cebu — menu, party packages, and ordering for charcoal-roasted lechon since 1994.",
    tech: ["Astro", "TypeScript", "CSS", "JavaScript"],
    url: "montejoslnft-online.vercel.app",
    status: "in progress",
    logo: "/projects/logos/montejoslnft-online.vercel.app.png",
    color: "#140b07",
  },
  {
    name: "Nook",
    description:
      "A cozy notebook that lives in your browser — notes, to-dos, sticky notes, and scrapbook pages with a photo booth, all encrypted locally with AES-256. No account needed.",
    tech: ["JavaScript", "HTML", "CSS"],
    url: "cozy-nook-olive.vercel.app",
    logo: "/projects/logos/cozy-nook-olive.vercel.app.svg",
    color: "#f6efe3",
  },
  {
    name: "Internship Tracker",
    description:
      "Professional management dashboard for tracking internship hours and administrative progress in real-time.",
    tech: ["Astro", "Python", "TypeScript", "JavaScript"],
    url: "internship-tracker-self.vercel.app",
    logo: "/projects/logos/internship-tracker-self.vercel.app.png",
    color: "#0b1120",
  },
  {
    name: "TicketFlow",
    description:
      "Visual automation tool for generating high-quality, numbered tickets and certificates from custom templates.",
    tech: ["Astro", "CSS", "JS"],
    url: "ticket-automation-two.vercel.app",
    logo: "/projects/logos/ticket-automation-two.vercel.app.svg",
    color: "#2457e6",
  },
  {
    name: "Certify",
    description:
      "Event management platform featuring automated certificate distribution and real-time claim tracking.",
    tech: ["TypeScript", "CSS", "JavaScript"],
    url: "automate-n-certify.vercel.app",
    logo: "/projects/logos/automate-n-certify.vercel.app.svg",
    color: "#f6f5f1",
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
      <Landing profile={profile} />
      <Navbar name={profile.name} />
      <main ref={root} className="overflow-x-clip">
        <div className={CONTAINER}>
          <Hero profile={profile} current={experience[0]} education={education} />
        </div>
        <Reel profile={profile} projects={projects} skills={skills} experience={experience} />
        <div className={CONTAINER}>
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
