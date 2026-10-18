import { useState } from "react";
import { OCCASIONS, occasionEmoji, occasionLabel } from "@/lib/bonmoment/occasions";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { OccasionId, Template } from "@/lib/bonmoment/types";
import { cn } from "@/lib/cn";
import { Button, Field, fieldClass } from "./ui";
import { SearchBar } from "./search";

const emptyForm = { id: undefined as string | undefined, title: "", occasion: "anniversaire" as OccasionId, body: "" };
const FIXED: Cat[] = ["stars", "fests", "history"];
const DEFAULT_PINS: OccasionId[] = ["anniversaire", "noel", "nouvel-an", "saint-valentin", "fete-meres", "fete-peres", "merci"];

type Cat = "stars" | "fests" | "history" | OccasionId;

export function Textes() {
  const t = useT();
  const templates = useBonMoment((state) => state.templates);
  const fests = useBonMoment((state) => state.fests ?? []);
  const logs = useBonMoment((state) => state.logs);
  const saveTemplate = useBonMoment((state) => state.saveTemplate);
  const removeTemplate = useBonMoment((state) => state.removeTemplate);
  const toggleStar = useBonMoment((state) => state.toggleStar);
  const setSettings = useBonMoment((state) => state.setSettings);
  const pinnedCats = useBonMoment((state) => state.settings.pinnedCats);
  const beginNew = useBonMoment((state) => state.beginNew);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [cat, setCat] = useState<Cat>("stars");
  const [opened, setOpened] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [find, setFind] = useState("");
  const stars = templates.filter((item) => item.star);
  const pins = (pinnedCats ?? DEFAULT_PINS).filter((id) => OCCASIONS.some((item) => item.id === id)).slice(0, 7);
  const visible = [...FIXED, ...pins];
  const rest = OCCASIONS.map((item) => item.id).filter((id) => !pins.includes(id));

  function tileOf(id: Cat) {
    if (id === "stars") return { id, emoji: "♥", label: t("nav.texts") };
    if (id === "fests") return { id, emoji: "🎉", label: t("fav.fests") };
    if (id === "history") return { id, emoji: "✉️", label: t("fav.history") };
    return { id, emoji: occasionEmoji(id), label: occasionLabel(id) };
  }

  function pick(id: Cat) {
    setCat(id);
    setOpened(null);
    setPendingDelete(null);
  }

  function togglePin(id: OccasionId) {
    const current = pins;
    const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current].slice(0, 7);
    setSettings({ pinnedCats: next });
  }

  function edit(template: Template) {
    setForm({ id: template.id, title: template.title, occasion: template.occasion, body: template.body });
    setOpen(true);
    setError(null);
  }

  function save() {
    if (form.title.trim().length < 2 || form.body.trim().length < 2) {
      setError(t("textes.needBoth"));
      return;
    }
    saveTemplate(form);
    setForm(emptyForm);
    setOpen(false);
    setError(null);
  }

  const listed = cat === "stars" ? stars : cat !== "fests" && cat !== "history" ? templates.filter((item) => item.occasion === cat) : [];
  const extraOn = rest.includes(cat as OccasionId);
  const query = find.trim().toLocaleLowerCase();
  const fold = (value: string) => value.toLocaleLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const needle = fold(query);
  const allCats: Cat[] = ["stars", "fests", "history", ...OCCASIONS.map((item) => item.id)];
  const shown = needle
    ? allCats.filter((id) => {
        const item = tileOf(id);
        return fold(item.label).includes(needle) || fold(id).includes(needle);
      })
    : visible;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">{t("nav.texts")}</h1>
        <Button
          variant="primary"
          className="h-9 shrink-0 px-3"
          onClick={() => {
            setForm(emptyForm);
            setOpen((value) => !value);
            setError(null);
          }}
        >
          {open ? t("textes.close") : t("textes.new")}
        </Button>
      </header>

      {open ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3">
          <Field label={t("textes.titleField")}>
            <input className={fieldClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label={t("composer.occasion")}>
            <select
              className={fieldClass}
              value={form.occasion}
              onChange={(event) => setForm({ ...form, occasion: event.target.value as OccasionId })}
            >
              {OCCASIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {occasionLabel(item.id)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("textes.text")} hint={t("textes.textHint")}>
            <textarea
              className={`${fieldClass} min-h-24 py-3`}
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-sm text-wax">
              {error}
            </p>
          ) : null}
          <Button variant="primary" className="self-start" onClick={save}>
            {form.id ? t("composer.save") : t("textes.add")}
          </Button>
        </div>
      ) : null}

      <SearchBar value={find} onChange={setFind} placeholder={t("fav.find")} />

      <div className="grid grid-cols-5 gap-2">
        {shown.map((id, index) => {
          const item = tileOf(id);
          const on = cat === id;
          const occasion = id !== "stars" && id !== "fests" && id !== "history";
          return (
            <div key={id} className="fav-pop relative" style={{ animationDelay: `${index * 28}ms` }}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => pick(id)}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border p-1 transition-colors duration-300",
                  on ? "border-wax bg-wax text-onwax" : "border-line bg-surface text-ink",
                )}
              >
                <span className={cn("rounded-full px-1.5 py-0.5 text-base leading-none transition-colors duration-300", on ? "bg-white/30" : "bg-paper")}>{item.emoji}</span>
                <span className="line-clamp-2 w-full text-center text-[10px] leading-tight font-medium">{item.label}</span>
              </button>
              {occasion ? (
                <button
                  type="button"
                  aria-pressed={pins.includes(id)}
                  aria-label={pins.includes(id) ? t("fav.pinned") : t("fav.pin")}
                  onClick={() => togglePin(id)}
                  className={cn("absolute top-0.5 right-0.5 z-10 flex size-5 items-center justify-center rounded-full text-[11px] leading-none", on ? "text-onwax" : "text-wax")}
                >
                  {pins.includes(id) ? "♥" : "♡"}
                </button>
              ) : null}
            </div>
          );
        })}
        {needle ? null : (
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore((value) => !value)}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-1 text-xs font-medium transition-colors duration-300",
            more || extraOn ? "border-wax bg-wax text-onwax" : "border-line bg-surface text-ink",
          )}
        >
          <span className={cn("rounded-full px-2 py-0.5 text-base leading-none", more || extraOn ? "bg-white/30" : "bg-paper")}>＋</span>
          {t("fav.more")}
        </button>
        )}
      </div>

      {needle && shown.length === 0 ? <p className="text-sm text-muted">{t("fav.findEmpty")}</p> : null}

      {more && !needle ? (
        <div className="fav-in relative h-44 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 h-11 -translate-y-1/2 rounded-full border border-wax bg-wax/15" />
          <div className="fav-wheel h-full snap-y snap-mandatory overflow-y-auto py-[4.1rem]">
            {rest.map((id) => {
              const item = tileOf(id);
              const on = cat === id;
              return (
                <div key={id} className="flex h-11 snap-center items-center">
                  <button
                    type="button"
                    onClick={() => pick(id)}
                    className={cn("flex h-11 min-w-0 flex-1 items-center justify-center gap-2 text-sm", on ? "font-medium text-ink" : "text-muted")}
                  >
                    <span aria-hidden>{item.emoji}</span>
                    {item.label}
                  </button>
                  <button
                    type="button"
                    aria-pressed={false}
                    aria-label={t("fav.pin")}
                    onClick={() => togglePin(id)}
                    className="mr-3 flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-base text-ink"
                  >
                    ♡
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div key={cat} className="fav-in flex flex-col gap-1.5">

      {cat === "stars" && stars.length === 0 ? <p className="text-sm text-muted">{t("fav.empty")}</p> : null}
      {cat !== "stars" && cat !== "fests" && cat !== "history" && listed.length === 0 ? (
        <p className="text-sm text-muted">{t("fav.none")}</p>
      ) : null}
      {cat === "fests" ? (
        fests.length === 0 ? (
          <p className="text-sm text-muted">{t("fav.festsEmpty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {fests.map((fest) => (
              <button
                key={fest.id}
                type="button"
                onClick={() => beginNew({ occasion: "autre", festId: fest.id, body: fest.line })}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-left text-sm font-medium text-ink"
              >
                <span aria-hidden>{fest.emoji}</span>
                <span className="leading-tight">{fest.title}</span>
              </button>
            ))}
          </div>
        )
      ) : null}
      {cat === "history" ? (
        logs.length === 0 ? (
          <p className="text-sm text-muted">{t("fav.historyEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {logs.slice(0, 8).map((item) => {
              const show = opened === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={show}
                    onClick={() => setOpened(show ? null : item.id)}
                    className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left"
                  >
                    <span aria-hidden>{occasionEmoji(item.occasion)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.contactName}</span>
                    <span className="shrink-0 text-xs text-muted">{occasionLabel(item.occasion)}</span>
                  </button>
                  {show ? <p className="fav-in px-3 pt-1.5 text-sm whitespace-pre-wrap text-muted">{item.body}</p> : null}
                </li>
              );
            })}
          </ul>
        )
      ) : null}
      {listed.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {listed.map((item) => {
            const show = opened === item.id;
            return (
              <li key={item.id} className="rounded-xl border border-line bg-surface px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <button type="button" aria-expanded={show} onClick={() => setOpened(show ? null : item.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span aria-hidden>{occasionEmoji(item.occasion)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={item.star === true}
                    aria-label={item.star ? t("fav.pinned") : t("fav.pin")}
                    onClick={() => toggleStar(item.id)}
                    className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border text-base", item.star ? "border-wax bg-wax text-onwax" : "border-line text-ink")}
                  >
                    {item.star ? "♥" : "♡"}
                  </button>
                </div>
                {show ? (
                  <div className="fav-in px-1 pt-2">
                    <p className="text-sm whitespace-pre-wrap text-muted">{item.body}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button variant="quiet" className="h-9 px-3" onClick={() => beginNew({ occasion: item.occasion, templateId: item.id, body: item.body })}>
                        {t("fav.use")}
                      </Button>
                      {cat !== "stars" ? (
                        <Button variant="ghost" className="h-9 px-2" onClick={() => edit(item)}>
                          {t("agenda.edit")}
                        </Button>
                      ) : null}
                      {cat !== "stars" ? (
                        pendingDelete === item.id ? (
                          <>
                            <Button variant="primary" className="h-9 px-3" onClick={() => removeTemplate(item.id)}>
                              {t("textes.delete")}
                            </Button>
                            <Button variant="ghost" className="h-9 px-2" onClick={() => setPendingDelete(null)}>
                              {t("agenda.cancel")}
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" className="h-9 px-2" onClick={() => setPendingDelete(item.id)}>
                            {t("textes.delete")}
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      </div>
    </div>
  );
}
