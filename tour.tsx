import { useState } from "react";
import { playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import type { TabId } from "@/lib/bonmoment/types";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button } from "./ui";

const STEPS: { title: MessageKey; body: MessageKey; tab: TabId; go: MessageKey }[] = [
  { title: "tour.1.title", body: "tour.1.body", tab: "agenda", go: "tour.next" },
  { title: "tour.2.title", body: "tour.2.body", tab: "proches", go: "tour.2.go" },
  { title: "tour.3.title", body: "tour.3.body", tab: "composer", go: "tour.3.go" },
];

export function Tour() {
  const t = useT();
  const done = useBonMoment((state) => state.settings.welcome === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  const setTab = useBonMoment((state) => state.setTab);
  const [step, setStep] = useState(0);
  const current = STEPS[step] ?? STEPS[0];

  if (done) return null;

  function close() {
    playTick();
    setSettings({ welcome: true, tourDone: true });
  }

  function next() {
    playTick();
    if (step === 1) setTab("proches");
    if (step >= STEPS.length - 1) {
      setTab("composer");
      setSettings({ welcome: true, tourDone: true });
      return;
    }
    setStep(step + 1);
  }

  return (
    <div className="rounded-3xl border border-line bg-paper p-3 text-ink">
      <p className="text-xs text-muted">
        {step + 1} / {STEPS.length}
      </p>
      <h2 className="text-xl">{t(current.title)}</h2>
      <p className="mt-1 text-sm leading-snug">{t(current.body)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" onClick={next}>
          {t(current.go)}
        </Button>
        <Button variant="ghost" onClick={close}>
          {t("tour.skip")}
        </Button>
      </div>
    </div>
  );
}
