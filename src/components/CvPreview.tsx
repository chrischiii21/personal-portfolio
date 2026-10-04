import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const RESUME_PATH = "/Christy-Montejo-Resume.pdf";
const RESUME_FILENAME = "Christy-Montejo-Resume.pdf";
const TRANSITION_MS = 220;

const DEFAULT_BUTTON =
  "inline-flex items-center gap-2 border border-zinc-900/15 dark:border-white/15 px-5 py-3 text-sm font-medium text-zinc-900 dark:text-white hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors";

export default function CvPreview({ className = DEFAULT_BUTTON, label = "Download CV" }: { className?: string; label?: string }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  function openModal() {
    setMounted(true);
  }

  function closeModal() {
    setVisible(false);
    window.setTimeout(() => setMounted(false), TRANSITION_MS);
  }

  useEffect(() => {
    if (!mounted) return;
    // Mount hidden first, then flip to visible on the next frame so the
    // transition actually animates instead of jumping straight to its end state.
    const raf = requestAnimationFrame(() => setVisible(true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mounted]);

  return (
    <>
      <button
        onClick={openModal}
        className={className}
      >
        {label}
      </button>

      {mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 transition-opacity duration-200 ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeModal}
          >
            <div
              className={`w-full max-w-3xl h-full max-h-[85vh] border border-neutral-300 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col transition-all duration-200 ease-out ${
                visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 dark:border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                                    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {RESUME_FILENAME}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={RESUME_PATH}
                    download={RESUME_FILENAME}
                    className="bg-emerald-500 text-zinc-950 px-4 py-1.5 text-xs font-medium hover:bg-emerald-400 transition-colors"
                  >
                    Download
                  </a>
                  <button
                    onClick={closeModal}
                    aria-label="Close preview"
                    className="w-7 h-7 flex items-center justify-center text-neutral-500 dark:text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <iframe src={RESUME_PATH} title="Résumé preview" className="flex-1 w-full bg-white" />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
