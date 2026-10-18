import { useState } from "react";
import { deviceCode, pullCode, useCloudStatus } from "@/lib/bonmoment/cloud";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { useT } from "@/lib/bonmoment/use-i18n";
import { playTick } from "@/lib/bonmoment/sound";
import { Button } from "./ui";

const NOTE: Record<string, MessageKey> = {
  wait: "cloud.wait",
  on: "cloud.on",
  off: "cloud.off",
  found: "cloud.found",
  miss: "cloud.miss",
};

export function CloudPanel() {
  const t = useT();
  const status = useCloudStatus();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const mine = deviceCode();
  const note = NOTE[status];

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{t("cloud.hint")}</p>
      {note ? <p className="text-sm text-ink">{t(note)}</p> : null}
      <div>
        <p className="text-sm font-medium text-ink">{t("cloud.code")}</p>
        <p className="mt-1 break-all text-sm text-muted">{mine}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            playTick();
            void navigator.clipboard?.writeText(mine).then(() => setCopied(true));
          }}
        >
          {copied ? t("share.done") : t("cloud.copy")}
        </Button>
      </div>
      <label className="flex flex-col gap-2 text-sm text-ink">
        {t("cloud.paste")}
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="h-11 rounded-2xl border border-line bg-paper px-3 text-ink"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <Button
        className="self-start"
        onClick={() => {
          playTick();
          void pullCode(code);
        }}
      >
        {t("cloud.find")}
      </Button>
    </div>
  );
}
