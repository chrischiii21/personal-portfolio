import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function ConsoleWindow({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen py-4 px-3 md:py-10 md:px-8">
      <div className="max-w-5xl mx-auto border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#0b0e14] shadow-2xl shadow-black/5 dark:shadow-black/40">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
