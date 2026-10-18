import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { Button } from "./ui";

type Platform = "ios" | "android" | "desktop";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const installBus = {
  event: null as BeforeInstallPromptEvent | null,
  installed: false,
};

function readInstalled() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function notifyInstall() {
  window.dispatchEvent(new Event("bonmoment-install"));
}

if (typeof window !== "undefined") {
  installBus.installed = readInstalled();
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installBus.event = event as BeforeInstallPromptEvent;
    notifyInstall();
  });
  window.addEventListener("appinstalled", () => {
    installBus.installed = true;
    installBus.event = null;
    notifyInstall();
  });
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

function installPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

const STEPS: Record<Platform, MessageKey[]> = {
  ios: ["install.ios1", "install.ios2", "install.ios3"],
  android: ["install.android1", "install.android2", "install.android3"],
  desktop: ["install.desktop1", "install.desktop2", "install.desktop3"],
};

function useInstallState() {
  const [snap, setSnap] = useState({
    ready: false,
    installed: false,
  });

  useEffect(() => {
    const sync = () => {
      setSnap({ ready: Boolean(installBus.event), installed: installBus.installed });
    };
    sync();
    window.addEventListener("bonmoment-install", sync);
    return () => window.removeEventListener("bonmoment-install", sync);
  }, []);

  return snap;
}

export function InstallButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const t = useT();
  const { installed } = useInstallState();
  const [guide, setGuide] = useState<Platform | null>(null);

  useEffect(() => {
    if (!guide) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGuide(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guide]);

  if (installed) return null;

  async function download() {
    const event = installBus.event;
    if (event) {
      installBus.event = null;
      notifyInstall();
      try {
        await event.prompt();
        const choice = await event.userChoice;
        if (choice.outcome === "accepted") {
          installBus.installed = true;
          notifyInstall();
        }
        return;
      } catch {
        /* the browser refused the prompt; show the steps */
      }
    }
    setGuide(installPlatform());
  }

  const control = iconOnly ? (
    <button
      type="button"
      onClick={() => void download()}
      className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink"
      aria-label={t("install.aria")}
      aria-haspopup="dialog"
    >
      <Download className="size-4" aria-hidden />
    </button>
  ) : (
    <Button variant="quiet" onClick={() => void download()} aria-haspopup="dialog">
      <Download className="size-4" aria-hidden />
      {t("install.download")}
    </Button>
  );

  return (
    <>
      {control}
      {guide
        ? createPortal(
            <div className="veil-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setGuide(null)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="install-title"
                className="sheet-in w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-lift"
                onClick={(event) => event.stopPropagation()}
              >
            <h2 id="install-title" className="font-serif text-2xl text-ink">
              {t("install.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("install.lead")}</p>
            <ol className="mt-5 flex flex-col gap-3">
              {STEPS[guide].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-wax text-sm text-onwax">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{t(step)}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {guide === "ios" ? (
                <a href="/?install=1&platform=ios" className="text-sm text-wax underline underline-offset-4">
                  {t("install.guide")}
                </a>
              ) : (
                <span />
              )}
              <Button variant="primary" autoFocus onClick={() => setGuide(null)}>
                {t("install.close")}
              </Button>
            </div>
            </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
