import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBonMoment } from "@/lib/bonmoment/store";
import { nativeSend } from "@/lib/bonmoment/message";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button, Chip } from "./ui";

declare global {
  interface Window {
    BonMomentBilling?: {
      buy?: () => string;
      donate?: (productId: string) => string;
      status?: () => string;
      version?: () => string;
    };
  }
}

export function requestPlan() {
  window.dispatchEvent(new Event("bonmoment-plan"));
}

export function playTip(euros: 2 | 5 | 10): "ok" | "wait" {
  const id = euros === 2 ? "don_2" : euros === 5 ? "don_5" : "don_10";
  const result = window.BonMomentBilling?.donate?.(id) ?? "";
  return result === "ok" ? "ok" : "wait";
}

export function billingStatus(): { version: string; ready: boolean } {
  const billing = window.BonMomentBilling;
  return {
    version: billing?.version?.() || "8",
    ready: billing?.status?.() === "ready",
  };
}

export function usePlanOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("bonmoment-plan", onOpen);
    return () => window.removeEventListener("bonmoment-plan", onOpen);
  }, []);
  return [open, setOpen] as const;
}

export function PriceMarquee({ label }: { label: string }) {
  return (
    <span className="price-marquee" aria-hidden>
      <span>{label}</span>
      <span>{label}</span>
    </span>
  );
}

export function AdBanner() {
  const t = useT();
  const pro = useBonMoment((state) => state.settings.plan === "pro");
  const hidden = useBonMoment((state) => state.settings.hideAd === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  if (pro || hidden) return null;
  const line = t("plan.ribbon");
  return (
    <div className="price-ribbon flex items-stretch border-y border-brass text-onwax">
      <button type="button" onClick={requestPlan} aria-label={line} className="min-w-0 flex-1 overflow-hidden py-2 text-left text-sm font-medium">
        <PriceMarquee label={line} />
      </button>
      <button
        type="button"
        aria-label={t("plan.adClose")}
        onClick={() => setSettings({ hideAd: true })}
        className="inline-flex shrink-0 items-center border-l border-brass/50 px-3 text-sm font-medium text-onwax"
      >
        {t("plan.adClose")}
      </button>
    </div>
  );
}

export function PlanCard() {
  const t = useT();
  const plan = useBonMoment((state) => state.settings.plan);
  const source = useBonMoment((state) => state.settings.planSource);
  const pro = plan === "pro";
  const hidden = useBonMoment((state) => state.settings.hideAd === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  return (
    <section className="rounded-3xl border border-line bg-surface p-4">
      <p className="text-xs font-medium tracking-wide text-brass uppercase">{t("plan.kicker")}</p>
      <h2 className="mt-1 text-3xl text-ink">{pro ? t("plan.pro") : t("plan.free")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        {pro ? (source === "play" ? t("plan.owned") : t("plan.previewOwned")) : t("plan.freeLead")}
      </p>
      {!pro ? <p className="mt-2 text-sm leading-relaxed text-ink">{t("plan.proLead")}</p> : null}
      {!pro ? <p className="mt-2 text-sm font-medium text-ink">{t("plan.price")}</p> : null}
      <Compare />
      <div className="mt-4">
        <p className="text-sm font-medium text-ink">{t("plan.pick")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip
            active={!pro}
            onClick={() => setSettings({ plan: "free", planSource: undefined })}
          >
            {t("plan.free")}
          </Chip>
          <Chip
            active={pro}
            onClick={() => {
              if (pro && source === "play") return;
              if (!pro) requestPlan();
            }}
          >
            {t("plan.pro")}
          </Chip>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant={pro ? "quiet" : "primary"} onClick={requestPlan}>
          {pro ? t("plan.back") : t("plan.buy")}
        </Button>
        {!pro && hidden ? (
          <Button variant="quiet" onClick={() => setSettings({ hideAd: false })}>
            {t("plan.adBack")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function Compare() {
  const t = useT();
  const rows = [
    [t("plan.row.send"), t("plan.freeSend"), t("plan.proSend")],
    [t("plan.row.alert"), t("plan.freeAlert"), t("plan.proAlert")],
    [t("plan.row.ad"), t("plan.freeAd"), t("plan.proAd")],
    [t("plan.row.price"), t("plan.freePrice"), t("plan.proPrice")],
  ];
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line text-sm">
      <div className="grid grid-cols-[1.05fr_1fr_1fr] bg-paper font-medium text-ink">
        <span className="px-2 py-2">{t("plan.compare")}</span>
        <span className="px-2 py-2">{t("plan.free")}</span>
        <span className="px-2 py-2 text-wax">{t("plan.pro")}</span>
      </div>
      {rows.map((row) => (
        <div key={row[0]} className="grid grid-cols-[1.05fr_1fr_1fr] border-t border-line">
          <span className="px-2 py-2 font-medium text-ink">{row[0]}</span>
          <span className="px-2 py-2 text-muted">{row[1]}</span>
          <span className="px-2 py-2 font-medium text-ink">{row[2]}</span>
        </div>
      ))}
    </div>
  );
}

export function PlanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const [note, setNote] = useState(false);
  useEffect(() => {
    const onPro = () => setSettings({ plan: "pro", planSource: "play" });
    window.addEventListener("bonmoment-pro", onPro);
    return () => window.removeEventListener("bonmoment-pro", onPro);
  }, [setSettings]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  const pro = settings.plan === "pro";
  const onDevice = Boolean(nativeSend());

  function pay() {
    const result = window.BonMomentBilling?.buy?.() ?? "unavailable";
    setNote(true);
    if (result === "ok") return;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-title"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-paper p-5 text-ink shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-medium tracking-wide text-brass uppercase">{t("plan.kicker")}</p>
        <h2 id="plan-title" className="mt-1 text-3xl">
          {t("plan.screen")}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {pro ? (settings.planSource === "play" ? t("plan.owned") : t("plan.previewOwned")) : t("plan.proLead")}
        </p>
        <p className="mt-3 text-base font-medium text-ink">{t("plan.price")}</p>
        <p className="text-sm text-muted">{t("plan.priceNote")}</p>
        <Compare />
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-ink">
          <li>{t("plan.perk1")}</li>
          <li>{t("plan.perk2")}</li>
          <li>{t("plan.perk3")}</li>
          <li>{t("plan.perk4")}</li>
        </ul>
        <div className="mt-4 flex flex-col items-stretch gap-2">
          {pro ? (
            <Button
              variant="quiet"
              onClick={() => {
                setSettings({ plan: "free", planSource: undefined });
                onClose();
              }}
            >
              {t("plan.back")}
            </Button>
          ) : (
            <Button variant="primary" onClick={pay}>
              {t("plan.pay")}
            </Button>
          )}
          {!pro && note ? (
            onDevice ? (
              <p className="text-sm text-muted">{t("plan.opening")}</p>
            ) : (
            <>
              <p className="text-sm text-muted">{t("plan.wait")}</p>
              <p className="text-sm text-muted">{t("plan.previewNote")}</p>
              <Button
                variant="quiet"
                onClick={() => {
                  setSettings({ plan: "pro", planSource: "preview" });
                  onClose();
                }}
              >
                {t("plan.preview")}
              </Button>
            </>
            )
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            {t("plan.close")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
