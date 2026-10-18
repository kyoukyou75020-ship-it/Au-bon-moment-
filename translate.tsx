import { useState } from "react";
import { LOCALES, type LocaleId } from "@/lib/bonmoment/i18n";
import { allowsNet, appUrl } from "@/lib/bonmoment/remote";
import { translateText } from "@/lib/bonmoment/translate";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useLocale, useT } from "@/lib/bonmoment/use-i18n";
import { Button, Field, fieldClass } from "./ui";
import { Spinner } from "./loader";

export function TranslateBar({ text, onTranslated }: { text: string; onTranslated: (next: string) => void }) {
  const t = useT();
  const locale = useLocale();
  const server = useBonMoment((state) => state.settings.gatewayUrl ?? "");
  const [picked, setPicked] = useState<LocaleId | null>(null);
  const target = picked ?? (locale === "fr" ? "en" : "fr");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function askAi(): Promise<string | "credit" | "limit" | null> {
    const url = appUrl(server, "/api/translate");
    if (!url || !allowsNet()) return null;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ text, target }),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; text?: string; reason?: string } | null;
    if (data?.ok && data.text) return data.text;
    if (data?.reason === "credit" || data?.reason === "limit") return data.reason;
    return null;
  }

  async function run() {
    if (text.trim().length < 2) {
      setError(t("composer.translateEmpty"));
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const ai = await askAi();
      if (ai === "limit") {
        setError(t("composer.translateLimit"));
        return;
      }
      if (ai && ai !== "credit") {
        onTranslated(ai);
        return;
      }
      onTranslated(await translateText(text, target));
      if (ai === "credit") setNote(t("composer.translateCredit"));
    } catch {
      setError(t("composer.translateFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label={t("composer.translateTo")}>
            <select
              className={fieldClass}
              value={target}
              onChange={(event) => setPicked(event.target.value as LocaleId)}
            >
              {LOCALES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.native}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Button variant="quiet" className="shrink-0" onClick={() => void run()} disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? t("composer.translating") : t("composer.translate")}
        </Button>
      </div>
      <p className="text-sm text-muted">{t("composer.translateHint")}</p>
      {note ? <p className="text-sm text-ink">{note}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-wax">
          {error}
        </p>
      ) : null}
    </div>
  );
}
