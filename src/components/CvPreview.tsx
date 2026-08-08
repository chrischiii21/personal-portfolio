import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const RESUME_PATH = "/Christy-Montejo-Resume.pdf";
const RESUME_FILENAME = "Christy-Montejo-Resume.pdf";
const TRANSITION_MS = 220;

export default function CvPreview() {
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
        className="bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 transition-colors"
      >
        [ Download CV ]
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
              className={`w-full max-w-3xl h-full max-h-[85vh] border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#0b0e14] shadow-2xl flex flex-col transition-all duration-200 ease-out ${
                visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 dark:border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70"></span>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-slate-500 truncate">
                    {RESUME_FILENAME}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={RESUME_PATH}
                    download={RESUME_FILENAME}
                    className="bg-blue-600 text-white px-4 py-1.5 text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    [ Download ]
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
