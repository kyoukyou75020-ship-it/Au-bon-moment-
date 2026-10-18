import { useState } from "react";
import { Camera, CheckCircle2, FlaskConical } from "lucide-react";
import { toPng } from "html-to-image";
import { saveEverything } from "@/lib/bonmoment/store";
import { downloadHref } from "@/lib/bonmoment/media";
import { playChime, playTick } from "@/lib/bonmoment/sound";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { Button } from "./ui";

type Bridge = { capture?: () => void };

type Check = { name: string; ok: boolean; need?: boolean };

export function ShotButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const t = useT();
  const [label, setLabel] = useState<"idle" | "done" | "bad">("idle");

  async function shot() {
    playTick();
    const bridge = (window as Window & { BonMomentFile?: Bridge }).BonMomentFile;
    if (bridge?.capture) {
      bridge.capture();
      setLabel("done");
      window.setTimeout(() => setLabel("idle"), 2500);
      return;
    }
    const node = document.getElementById("bonmoment-root");
    if (!node) {
      setLabel("bad");
      return;
    }
    try {
      const url = await toPng(node, { pixelRatio: 2, cacheBust: true });
      downloadHref(url, "bonmoment.png");
      playChime();
      setLabel("done");
    } catch {
      setLabel("bad");
    }
    window.setTimeout(() => setLabel("idle"), 2500);
  }

  const text = label === "done" ? t("shot.done") : label === "bad" ? t("shot.bad") : t("shot.button");
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={() => void shot()}
        aria-label={text}
        className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink"
      >
        {label === "done" ? <CheckCircle2 className="size-4" aria-hidden /> : <Camera className="size-4" aria-hidden />}
      </button>
    );
  }
  return (
    <Button variant="quiet" onClick={() => void shot()}>
      <Camera className="size-4" aria-hidden />
      {text}
    </Button>
  );
}

export function TestButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Check[] | null>(null);

  async function run() {
    setBusy(true);
    setOpen(true);
    playTick();
    const rows = await runChecks(t);
    setRows(rows);
    setBusy(false);
    if (rows.every((row) => row.ok)) playChime();
  }

  async function allowAlerts() {
    if (typeof Notification === "undefined") return;
    await Notification.requestPermission();
    setRows(await runChecks(t));
  }

  return (
    <>
      <Button variant="quiet" disabled={busy} onClick={() => void run()}>
        <FlaskConical className="size-4" aria-hidden />
        {busy ? t("load.wait") : t("test.button")}
      </Button>
      {open && rows ? (
        <div className="w-full basis-full rounded-3xl border border-line bg-paper p-4">
          <p className="font-medium text-ink">{t("test.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("test.lead")}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{row.name}</span>
                <span className={row.ok ? "text-ink" : "text-wax"}>
                  {row.ok ? t("test.ok") : row.need ? t("test.need") : t("test.no")}
                </span>
              </li>
            ))}
          </ul>
          {rows.some((row) => row.need && row.name === t("test.notify")) ? (
            <Button variant="primary" className="mt-3" onClick={() => void allowAlerts()}>
              <CheckCircle2 className="size-4" aria-hidden />
              {t("test.ask")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

async function runChecks(t: (key: MessageKey) => string): Promise<Check[]> {
  const saved = await saveEverything();
  let storage = false;
  try {
    localStorage.setItem("bonmoment.test", "1");
    storage = localStorage.getItem("bonmoment.test") === "1";
    localStorage.removeItem("bonmoment.test");
  } catch {
    storage = false;
  }
  const notify = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  let mic: PermissionState | "unsupported" = "unsupported";
  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
      mic = status.state;
    }
  } catch {
    mic = "unsupported";
  }
  const files = await probeFiles();
  return [
    { name: t("test.save"), ok: saved && storage },
    { name: t("test.files"), ok: files },
    { name: t("test.notify"), ok: notify === "granted" || notify === "unsupported", need: notify === "default" || notify === "denied" },
    { name: t("test.mic"), ok: mic === "granted" || mic === "unsupported", need: mic === "prompt" || mic === "denied" },
  ];
}

function probeFiles(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const open = indexedDB.open("bonmoment-test", 1);
    open.onerror = () => resolve(false);
    open.onsuccess = () => {
      open.result.close();
      resolve(true);
    };
  });
}
