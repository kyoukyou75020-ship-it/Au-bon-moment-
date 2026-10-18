import { useState } from "react";
import { Copy } from "lucide-react";
import { useT } from "@/lib/bonmoment/use-i18n";
import { playTick } from "@/lib/bonmoment/sound";
import { Button } from "./ui";

export async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    // Some browsers block the async clipboard. The selection fallback still works.
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy");
}

export function CopyMessage({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    const value = text.trim();
    if (value.length < 2) return;
    try {
      await copyText(value);
      playTick();
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFailed(true);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button variant="quiet" onClick={() => void copy()} disabled={text.trim().length < 2}>
        <Copy className="size-4" aria-hidden />
        {copied ? t("agenda.copied") : t("agenda.copy")}
      </Button>
      {failed ? (
        <span role="alert" className="max-w-64 text-sm text-wax">
          {t("agenda.copyFail")}
        </span>
      ) : null}
    </span>
  );
}
