import { useState } from "react";
import { allowsNet, appUrl } from "@/lib/bonmoment/remote";
import { moodLine, type MoodId, type WriteForm } from "@/lib/bonmoment/ideas";
import { keepLine, libraryLines } from "@/lib/bonmoment/cloud";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { OccasionId } from "@/lib/bonmoment/types";
import type { MessageKey, LocaleId } from "@/lib/bonmoment/i18n";
import { useLocale, useT } from "@/lib/bonmoment/use-i18n";
import { playIdea } from "@/lib/bonmoment/sound";
import { Button, Chip } from "./ui";

const MOODS = ["humour", "joyeux", "tendre", "amour", "famille", "courage", "colere", "content"] as const;

const FORMS = ["sms", "lettre", "proverbe", "poeme", "voeux"] as const;

const FORM_KEY: Record<WriteForm, MessageKey> = {
  sms: "idea.form.sms",
  lettre: "idea.form.lettre",
  proverbe: "idea.form.proverbe",
  poeme: "idea.form.poeme",
  voeux: "idea.form.voeux",
};

const FORM_HINT: Record<WriteForm, MessageKey> = {
  sms: "idea.formHint.sms",
  lettre: "idea.formHint.lettre",
  proverbe: "idea.formHint.proverbe",
  poeme: "idea.formHint.poeme",
  voeux: "idea.formHint.voeux",
};

const MOOD_KEY: Record<MoodId, MessageKey> = {
  humour: "idea.mood.humour",
  joyeux: "idea.mood.joyeux",
  colere: "idea.mood.colere",
  content: "idea.mood.content",
  tendre: "idea.mood.tendre",
  amour: "idea.mood.amour",
  famille: "idea.mood.famille",
  courage: "idea.mood.courage",
};

export const MOOD_KEYS = MOOD_KEY;
export const FORM_KEYS = FORM_KEY;
export const WRITE_MOODS = MOODS;
export const WRITE_FORMS = FORMS;

function polish(text: string): string {
  const clean = text.replace(/^(toi|hey)\s*,\s*/i, "").trim();
  if (!clean) return text.trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function words(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .split(/[^\p{L}0-9]+/u)
      .filter((word) => word.length > 3),
  );
}

function alike(a: string, b: string): boolean {
  if (a.trim() === b.trim()) return true;
  const left = words(a);
  const right = words(b);
  if (left.size < 3 || right.size < 3) return false;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / Math.min(left.size, right.size) > 0.45;
}
function stamp(text: string, name: string): string {
  let next = text.trim();
  const who = name.trim();
  if (who.length > 1) {
    const escaped = who.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "giu"), "{prenom}");
  }
  const at = next.indexOf("{prenom}");
  if (at < 0) next = `{prenom}, ${next}`;
  else {
    const head = next.slice(0, at + "{prenom}".length);
    const tail = next.slice(at + "{prenom}".length).replaceAll("{prenom}", "");
    next = `${head}${tail}`;
  }
  return next.replace(/[ ]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export async function requestIdea(input: {
  server: string;
  locale: LocaleId;
  mood: MoodId;
  occasion: OccasionId;
  name: string;
  form: WriteForm;
  body: string;
}): Promise<{ text: string; note: MessageKey }> {
  const twist = 1 + Math.floor(Math.random() * 60000);
  const local = () => {
    const first = moodLine(input.locale, input.mood, input.name, twist, input.occasion, input.form);
    if (first.trim() === input.body.trim()) return moodLine(input.locale, input.mood, input.name, twist + 997, input.occasion, input.form);
    return first;
  };
  const done = (text: string, note: MessageKey) => ({ text: polish(stamp(text, input.name)), note });
  if (useBonMoment.getState().settings.web === false) return done(local(), "net.paused");
  if (!allowsNet()) return done(local(), "idea.offline");
  if (typeof location !== "undefined" && location.hostname === "appassets.androidplatform.net" && !input.server.trim()) {
    return done(local(), "net.need");
  }
  const url = appUrl(input.server, "/api/idea");
  if (!url) return done(local(), "idea.local");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        mood: input.mood,
        occasion: input.occasion,
        name: input.name,
        locale: input.locale,
        form: input.form,
        text: input.body.trim().slice(0, 500),
        twist,
      }),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; text?: string; reason?: string } | null;
    const clean = data?.text?.trim() ?? "";
    const usable = clean.length >= 12 && clean.length <= 700 && !/^toi\s*,/i.test(clean) && !alike(clean, input.body);
    if (data?.ok && usable) {
      keepLine(input.form, input.mood, input.occasion, clean);
      return done(clean, "idea.online");
    }
    const reason = data?.ok ? "local" : (data?.reason ?? "fail");
    try {
      const lines = await libraryLines(input.form, input.mood, input.occasion);
      const picked = lines.find((line) => line.trim().length >= 12 && !alike(line, input.body));
      if (picked) return done(picked, "idea.library");
    } catch {
      /* la liste locale prend le relais */
    }
    return done(local(), reason === "limit" ? "idea.limit" : noteKey(reason));
  } catch {
    return done(local(), "idea.local");
  }
}

export function IdeaSearchLabel() {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-2">
      <span className="idea-stars" aria-hidden>
        <i>✦</i>
        <i>✦</i>
        <i>✦</i>
      </span>
      {t("idea.search")}
    </span>
  );
}

function noteKey(reason: string): MessageKey {
  if (reason === "off") return "idea.off";
  if (reason === "limit") return "idea.limit";
  if (reason === "credit") return "idea.credit";
  if (reason === "offline") return "idea.offline";
  return "idea.local";
}

export function Inspire({
  name,
  occasion,
  body,
  mood,
  form,
  onForm,
  onText,
}: {
  name: string;
  occasion: OccasionId;
  body: string;
  mood: MoodId;
  form: WriteForm;
  onForm: (form: WriteForm) => void;
  onText: (text: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const server = useBonMoment((state) => state.settings.gatewayUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<MessageKey | null>(null);

  function ready(text: string, reason: MessageKey | null) {
    onText(text);
    playIdea();
    setNote(reason);
  }

  async function write() {
    setBusy(true);
    setNote(null);
    try {
      const result = await requestIdea({ server, locale, mood, occasion, name, form, body });
      ready(result.text, result.note);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-2xl border border-line bg-paper px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-ink">{t("idea.form")}</summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {FORMS.map((item) => (
            <Chip key={item} active={form === item} onClick={() => onForm(item)}>
              {t(FORM_KEY[item])}
            </Chip>
          ))}
        </div>
        <p className="text-sm text-muted">{t(FORM_HINT[form])}</p>
        <Button variant="primary" className="self-start" disabled={busy} onClick={() => void write()}>
          {busy ? <IdeaSearchLabel /> : t("idea.web")}
        </Button>
        {note ? <p className="text-sm text-ink">{t(note)}</p> : null}
      </div>
    </details>
  );
}
