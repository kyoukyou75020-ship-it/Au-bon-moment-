import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Languages } from "lucide-react";
import { LOCALES, isLocale } from "@/lib/bonmoment/i18n";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useT } from "@/lib/bonmoment/use-i18n";
import { cn } from "@/lib/cn";
import { Button } from "./ui";

export function LanguageButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const t = useT();
  const stored = useBonMoment((state) => state.locale);
  const setLocale = useBonMoment((state) => state.setLocale);
  const locale = isLocale(stored) ? stored : "fr";
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((item) => item.id === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const control = iconOnly ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-xs font-medium text-ink"
      aria-label={t("lang.aria")}
      aria-haspopup="dialog"
    >
      {locale.toUpperCase()}
    </button>
  ) : (
    <Button variant="quiet" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={t("lang.aria")}>
      <Languages className="size-4" aria-hidden />
      {current.native}
    </Button>
  );

  return (
    <>
      {control}
      {open
        ? createPortal(
            <div className="veil-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="lang-title"
                className="sheet-in max-h-[calc(100dvh-7rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-lift"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="lang-title" className="font-serif text-2xl text-ink">
                  {t("lang.title")}
                </h2>
                <ul className="mt-4 flex flex-col gap-1">
                  {LOCALES.map((item) => {
                    const selected = item.id === locale;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-current={selected ? "true" : undefined}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setLocale(item.id);
                            window.setTimeout(() => setOpen(false), 160);
                          }}
                          className={cn(
                            "flex h-11 w-full items-center justify-between rounded-2xl px-3 text-left text-sm",
                            selected ? "bg-wax font-medium text-onwax" : "text-ink hover:bg-paper",
                          )}
                        >
                          <span>{item.native}</span>
                          <span className={selected ? "text-onwax" : "text-muted"}>{item.id.toUpperCase()}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
