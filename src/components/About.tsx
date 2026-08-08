export default function About({ summary }: { summary: string }) {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="text-xs md:text-sm mb-4 text-neutral-500 dark:text-slate-500">
        <span className="text-neutral-400 dark:text-slate-600">$</span> cat about.md
      </div>
      <div className="glass-card p-6 md:p-8">
        <p className="text-lg text-neutral-700 dark:text-slate-300 leading-relaxed">
          {summary}
        </p>
      </div>
    </section>
  );
}
