import { useState } from "react";
import { Save } from "lucide-react";
import { saveEverything } from "@/lib/bonmoment/store";
import { playChime } from "@/lib/bonmoment/sound";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button } from "./ui";

export function SaveButton({ wide = false, label, onSaved }: { wide?: boolean; label?: string; onSaved?: () => void }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "busy" | "done" | "bad">("idle");

  async function save() {
    setState("busy");
    const ok = await saveEverything();
    if (!ok) {
      setState("bad");
      return;
    }
    playChime();
    onSaved?.();
    setState("done");
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <div className={wide ? "flex flex-col items-start gap-2" : "w-full"}>
      <Button variant="primary" className={wide ? undefined : "w-full"} disabled={state === "busy"} onClick={() => void save()}>
        <Save className="size-4" aria-hidden />
        {state === "done" ? t("save.done") : state === "bad" ? t("save.bad") : (label ?? t("save.button"))}
      </Button>
      {wide ? <p className="text-sm text-muted">{state === "done" ? t("save.doneHint") : t("save.hint")}</p> : null}
    </div>
  );
}
