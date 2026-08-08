import { useEffect } from "react";
import ConsoleWindow from "./ConsoleWindow";
import Hero from "./Hero";
import About from "./About";
import Experience from "./Experience";
import Projects from "./Projects";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import type { Profile, SkillGroup, Education, ExperienceEntry, Project } from "../types";

export const profile: Profile = {
  name: "Christy Montejo",
  title: "Front-end Web Developer | UI/UX Designer",
  location: "Cebu City, Philippines",
  email: "christymontejo2003@gmail.com",
  github: "github.com/chrischiii21",
  linkedin: "christymontejo2003@gmail.com",
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
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-4");
          }
        });
      },
      { threshold: 0.1 }
    );

    const targets = document.querySelectorAll("#about, .glass-card, .reveal-item");
    targets.forEach((el) => {
      el.classList.add(
        "transition-all",
        "duration-700",
        "opacity-0",
        "translate-y-4"
      );
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter((c) =>
            c.matches(".glass-card, .reveal-item")
          )
        : [];
      const staggerIndex = siblings.indexOf(el);
      if (staggerIndex > 0) {
        (el as HTMLElement).style.transitionDelay = `${Math.min(staggerIndex, 6) * 70}ms`;
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ConsoleWindow>
      <div className="px-6 md:px-12 py-14 md:py-20">
        <Hero profile={profile} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-20">
            <About summary={summary} />
            <Experience experience={experience} />
            <Projects projects={projects} />
          </div>

          <Sidebar profile={profile} skills={skills} education={education} />
        </div>
      </div>

      <Footer profile={profile} />
    </ConsoleWindow>
  );
}
