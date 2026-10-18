import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { deviceCode } from "@/lib/bonmoment/cloud";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useT } from "@/lib/bonmoment/use-i18n";
import { playTick } from "@/lib/bonmoment/sound";
import { Button } from "./ui";

type Counts = { visit: number; interest: number; pro: number };

async function mark(kind: "visit" | "interest" | "pro"): Promise<Counts | null> {
  const device = deviceCode();
  if (!device) return null;
  const response = await fetch("/api/crowd", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device, kind }),
  });
  const data = (await response.json().catch(() => null)) as (Counts & { ok?: boolean }) | null;
  if (!data?.ok) return null;
  return { visit: data.visit, interest: data.interest, pro: data.pro };
}

export function CrowdBadge() {
  const t = useT();
  const pro = useBonMoment((state) => state.settings.plan === "pro");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [open, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    setJoined(localStorage.getItem("bonmoment.interest") === "1");
    void mark(pro ? "pro" : "visit").then((next) => {
      if (next) setCounts(next);
    });
  }, [pro]);

  const shown = counts ? Math.max(counts.visit, counts.interest, counts.pro) : null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("crowd.open")}
        onClick={() => {
          playTick();
          setOpen((value) => !value);
        }}
        className="inline-flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl border border-line bg-surface text-ink shadow-lift"
      >
        <Users className="size-3.5" aria-hidden />
        <span className="text-[10px] leading-none font-medium">{shown ?? "·"}</span>
      </button>
      {open && counts ? (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-line bg-surface p-3 shadow-lift">
          <p className="text-sm text-ink">{t("crowd.visit", { n: counts.visit })}</p>
          <p className="mt-1 text-sm text-ink">{t("crowd.interest", { n: counts.interest })}</p>
          <p className="mt-1 text-sm text-ink">{t("crowd.pro", { n: counts.pro })}</p>
          {joined ? (
            <p className="mt-2 text-sm font-medium text-ink">{t("crowd.done")}</p>
          ) : (
            <Button
              variant="primary"
              className="mt-3"
              onClick={() => {
                playTick();
                localStorage.setItem("bonmoment.interest", "1");
                setJoined(true);
                void mark("interest").then((next) => {
                  if (next) setCounts(next);
                });
              }}
            >
              {t("crowd.join")}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
