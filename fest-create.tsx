import { useState } from "react";
import { createPortal } from "react-dom";
import { COUNTRY_FESTS, festFromCountry, imagineFest, matchCountry, sameFest, type FestLook } from "@/lib/bonmoment/fests";
import { requestIdea } from "./inspire";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { CustomFest } from "@/lib/bonmoment/types";
import { useLocale, useT } from "@/lib/bonmoment/use-i18n";
import type { LocaleId } from "@/lib/bonmoment/i18n";
import { cn } from "@/lib/cn";

export function FestLane({
  selected,
  onPick,
}: {
  selected?: string;
  onPick: (fest: CustomFest, target: HTMLElement) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const fests = useBonMoment((state) => state.fests ?? []);
  const addFest = useBonMoment((state) => state.addFest);
  const removeFest = useBonMoment((state) => state.removeFest);
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [made, setMade] = useState<CustomFest | null>(null);

  function close() {
    setOpen(false);
    setCountry(false);
    setBusy(false);
    setError("");
    setMade(null);
    setName("");
    setQuery("");
  }

  async function saveLook(look: FestLook | null) {
    if (!look) {
      setError(t("fest.need"));
      return;
    }
    const known = fests.find((item) => sameFest(item.name, look.name));
    if (known) {
      setMade(known);
      setError("");
      return;
    }
    setBusy(true);
    setError("");
    const line = await wish(look, locale);
    const fest: CustomFest = { ...look, line, id: `fest-${Date.now()}` };
    addFest(fest);
    setMade(fest);
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setCountry(false);
            setOpen(true);
          }}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-wax bg-wax px-3 py-2 text-sm font-medium text-onwax shadow-lift"
        >
          <span aria-hidden>✨</span>
          {t("fest.create")}
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setMade(null);
            setQuery("");
            setCountry(true);
            setOpen(true);
          }}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink"
        >
          <span aria-hidden>🌍</span>
          {t("fest.country")}
        </button>
      </div>
      {fests.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">{t("fest.mine")}</p>
          <div className="grid grid-cols-2 gap-2">
            {fests.map((fest) => {
              const on = selected === fest.id;
              return (
                <div key={fest.id} className="relative">
                  <button
                    type="button"
                    aria-pressed={on}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => onPick(fest, event.currentTarget)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-2 rounded-2xl border px-3 py-2 pr-8 text-left text-sm font-medium",
                      on ? "border-wax bg-wax text-onwax shadow-lift" : "border-line bg-surface text-ink",
                    )}
                  >
                    <span className="text-xl leading-none" aria-hidden>
                      {fest.emoji}
                    </span>
                    <span className="leading-tight">{fest.title}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("fest.remove")}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => removeFest(fest.id)}
                    className={cn("absolute top-1 right-1 grid size-7 place-items-center rounded-full text-sm", on ? "text-onwax" : "text-muted")}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="veil-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={close}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="fest-title"
                className="sheet-in w-full max-w-md rounded-3xl border border-line bg-surface p-5 shadow-lift"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="fest-title" className="font-serif text-2xl text-ink">
                  {country && !made ? t("fest.country") : t("fest.create")}
                </h2>
                <p className="mt-1 text-sm text-muted">{country && !made ? t("fest.countryHint") : t("fest.hint")}</p>
                {made ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="rounded-3xl border border-line bg-paper p-4">
                      <p className="text-3xl" aria-hidden>
                        {made.emoji}
                      </p>
                      <p className="mt-2 text-xl font-medium text-ink">{made.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {t("fest.mood")} · {made.mood}
                      </p>
                    </div>
                    <p className="text-sm text-ink">{t("fest.ready")}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex h-11 items-center rounded-full bg-wax px-4 text-sm font-medium text-onwax"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          onPick(made, event.currentTarget);
                          close();
                        }}
                      >
                        {t("fest.pin")}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-11 items-center rounded-full border border-line px-4 text-sm font-medium text-ink"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setMade(null);
                          setName("");
                          setQuery("");
                        }}
                      >
                        {t("fest.again")}
                      </button>
                    </div>
                  </div>
                ) : country ? (
                  <CountryPick
                    query={query}
                    busy={busy}
                    error={error}
                    onQuery={setQuery}
                    onPick={(value) => void saveLook(festFromCountry(value, locale))}
                  />
                ) : (
                  <form
                    className="mt-4 flex flex-col gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveLook(imagineFest(name, locale));
                    }}
                  >
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-ink">{t("fest.ask")}</span>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={t("fest.placeholder")}
                        maxLength={40}
                        autoFocus
                        className="h-11 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none focus:border-wax"
                      />
                    </label>
                    {error ? <p className="text-sm text-wax">{error}</p> : null}
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-wax px-4 text-sm font-medium text-onwax disabled:opacity-60"
                    >
                      {busy ? (
                        <>
                          <span className="idea-stars" aria-hidden>
                            <i>✦</i>
                            <i>✦</i>
                            <i>✦</i>
                          </span>
                          {t("fest.wait")}
                        </>
                      ) : (
                        t("fest.go")
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function CountryPick({
  query,
  busy,
  error,
  onQuery,
  onPick,
}: {
  query: string;
  busy: boolean;
  error: string;
  onQuery: (value: string) => void;
  onPick: (value: string) => void;
}) {
  const t = useT();
  const needle = query.trim().toLocaleLowerCase("fr");
  const shown = COUNTRY_FESTS.filter((item) => !needle || item.name.toLocaleLowerCase("fr").includes(needle) || item.words.some((word) => word.includes(needle)));
  const known = matchCountry(query);
  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (query.trim().length >= 2) onPick(query);
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">{t("fest.countryAsk")}</span>
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={t("fest.countryFind")}
          maxLength={40}
          autoFocus
          className="h-11 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none focus:border-wax"
        />
      </label>
      <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto">
        {shown.map((item) => (
          <button
            key={item.name}
            type="button"
            disabled={busy}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(item.name)}
            className="flex min-h-12 items-center gap-2 rounded-2xl border border-line bg-paper px-3 py-2 text-left text-sm font-medium text-ink"
          >
            <span className="text-xl leading-none" aria-hidden>
              {item.flag}
            </span>
            <span className="leading-tight">{item.name}</span>
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-wax">{error}</p> : null}
      {query.trim().length >= 2 && !known ? (
        <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center rounded-full bg-wax px-4 text-sm font-medium text-onwax disabled:opacity-60">
          {busy ? t("fest.wait") : t("fest.countryGo")}
        </button>
      ) : null}
      {busy && known ? <p className="text-sm text-muted">{t("fest.wait")}</p> : null}
    </form>
  );
}

async function wish(look: FestLook, locale: LocaleId): Promise<string> {
  const wait = new Promise((resolve) => window.setTimeout(resolve, 450));
  const online = requestIdea({
    server: "",
    locale,
    mood: "joyeux",
    occasion: "autre",
    name: look.name,
    form: "voeux",
    body: "",
  })
    .then((result) => {
      const text = result.text.trim();
      if (text.length >= 12 && text.length <= 280) return text;
      return look.line;
    })
    .catch(() => look.line);
  const [line] = await Promise.all([online, wait]);
  return line;
}
