import { useEffect, useState } from "react";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Seal } from "./ui";

export function BootScreen({ skip = false }: { skip?: boolean }) {
  const t = useT();
  const [held, setHeld] = useState(!skip);

  useEffect(() => {
    const timer = window.setTimeout(() => setHeld(false), 180);
    return () => window.clearTimeout(timer);
  }, []);

  if (!held) return null;

  return (
    <div className="veil-in pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-paper/80" role="status" aria-live="polite">
      <span className="loader-seal">
        <Seal className="size-16 text-2xl" />
      </span>
      <p className="font-serif text-2xl text-ink">{t("load.wait")}</p>
      <span className="loader-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function Spinner() {
  return <span className="loader-spin size-4 shrink-0 rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}
