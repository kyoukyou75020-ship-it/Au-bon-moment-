import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, Lightbulb } from "lucide-react";
import { playTick } from "@/lib/bonmoment/sound";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { Button } from "./ui";

const STEPS: MessageKey[] = ["help.1", "help.2", "help.3", "help.4", "help.5", "help.video", "help.voice"];
const HOW: MessageKey[] = ["tip.1", "tip.2", "tip.3", "tip.4"];
const FAST: MessageKey[] = ["tip.f1", "tip.f2", "tip.f3", "tip.f4"];

export function HelpButton() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          playTick();
          setOpen(true);
        }}
        aria-label={t("help.title")}
        className="inline-flex size-11 items-center justify-center rounded-2xl border border-line bg-surface text-ink"
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>
      {open
        ? createPortal(
            <div className="veil-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
              <div
                role="dialog"
                aria-labelledby="help-title"
                className="sheet-in w-full max-w-md rounded-[2rem] border border-line bg-surface p-5 shadow-lift"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="help-title" className="font-serif text-2xl text-ink">
                  {t("help.title")}
                </h2>
                <ol className="mt-4 flex flex-col gap-3">
                  {STEPS.map((key, index) => (
                    <li key={key} className="flex gap-3 text-sm text-ink">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-paper font-medium text-wax">{index + 1}</span>
                      <span className="pt-0.5">{t(key)}</span>
                    </li>
                  ))}
                </ol>
                <Button variant="primary" className="mt-5" onClick={() => setOpen(false)}>
                  {t("help.close")}
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function TipSquare() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          playTick();
          setOpen(true);
        }}
        aria-label={t("tip.title")}
        className="inline-flex size-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-brass bg-surface text-ink shadow-lift"
      >
        <Lightbulb className="size-5 text-wax" aria-hidden />
        <span className="text-xs font-medium">{t("tip.button")}</span>
      </button>
      {open
        ? createPortal(
            <div className="veil-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
              <div
                role="dialog"
                aria-labelledby="tip-title"
                className="sheet-in max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-surface p-5 shadow-lift"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="tip-title" className="font-serif text-2xl text-ink">
                  {t("tip.title")}
                </h2>
                <p className="mt-4 text-sm font-medium text-wax">{t("tip.how")}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {HOW.map((key) => (
                    <li key={key} className="text-sm text-ink">
                      {t(key)}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-medium text-wax">{t("tip.fast")}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {FAST.map((key) => (
                    <li key={key} className="text-sm text-ink">
                      {t(key)}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted">{t("book.closed")}</p>
                <Button variant="primary" className="mt-5" onClick={() => setOpen(false)}>
                  {t("help.close")}
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
