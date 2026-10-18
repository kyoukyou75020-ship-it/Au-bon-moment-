import { useState } from "react";
import { Share2 } from "lucide-react";
import { useBonMoment } from "@/lib/bonmoment/store";
import { shareSheet } from "@/lib/bonmoment/message";
import { playTick } from "@/lib/bonmoment/sound";
import { useT } from "@/lib/bonmoment/use-i18n";
import { copyText } from "./copy";
import { Button } from "./ui";

export function shopLink(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return "";
    if (typeof window !== "undefined" && url.hostname === window.location.hostname) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function ShareButton() {
  const t = useT();
  const storeUrl = useBonMoment((state) => state.settings.storeUrl);
  const [done, setDone] = useState(false);
  const link = shopLink(storeUrl);
  const text = t("share.text");
  const payload = link ? `${text}\n${link}` : text;

  async function share() {
    playTick();
    if (shareSheet(payload)) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(link ? { title: "BonMoment", text, url: link } : { title: "BonMoment", text });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await copyText(payload);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      setDone(false);
    }
  }

  return (
    <Button variant="quiet" kind="amour" onClick={() => void share()}>
      <Share2 className="size-4" aria-hidden />
      {done ? t("share.done") : t("share.button")}
    </Button>
  );
}
