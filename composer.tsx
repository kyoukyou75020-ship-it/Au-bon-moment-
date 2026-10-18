import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Video } from "lucide-react";
import { CHANNELS, MAIN_OCCASIONS, OCCASIONS, channelLabel, defaultRepeat, occasionIcon, occasionLabel } from "@/lib/bonmoment/occasions";
import { firstName, finishMessage, channelNeeds, isSocial, onlineNow, usedSignature, type DraftIssue } from "@/lib/bonmoment/message";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useT, useSimple, useLocale } from "@/lib/bonmoment/use-i18n";
import { nextDateInput, suggestSlot } from "@/lib/bonmoment/time";
import { moodLine, type MoodId, type WriteForm } from "@/lib/bonmoment/ideas";
import { playChime, playOccasion, playIdea, playTick } from "@/lib/bonmoment/sound";
import type { OccasionId, Relation, ToneId, CustomFest } from "@/lib/bonmoment/types";
import { RELATION_PICKS } from "@/lib/bonmoment/types";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { knownRelation } from "@/lib/bonmoment/seed";
import { Button, Chip, Field, Letter, fieldClass } from "./ui";
import { PrenomPanel } from "./prenom-panel";
import { RemoveButton } from "./agenda";
import { TranslateBar } from "./translate";
import { CopyMessage } from "./copy";
import { VideoExtra, RemoveVideoButton } from "./clip";
import { readPhoto } from "@/lib/bonmoment/photo";
import { readVideo } from "@/lib/bonmoment/video";
import type { PhotoShape, VoiceStyle } from "@/lib/bonmoment/types";
import { DownloadFile, DownloadVideo, WebFetch, AiPicture } from "./fetch";
import { VoiceCard } from "./voice";
import { Garland } from "./wallpaper";
import { cn } from "@/lib/cn";
import { SparkBurst, SealDrop, FestFlash, ThemeFlash } from "./effects";
import { PhoneBookAsk, PhoneBookButton } from "./book";
import { SearchBar, KinshipMarks } from "./search";
import { phoneBookReady, phoneLink, usePhoneHits } from "@/lib/bonmoment/directory";
import { contactMatches, relationOf } from "@/lib/bonmoment/query";
import { StickerBar } from "./stickers";
import { stickerMotion } from "./sticker-catalog";
import { Inspire, IdeaSearchLabel, requestIdea, MOOD_KEYS, WRITE_MOODS } from "./inspire";
import { FestLane } from "./fest-create";
import { shareCard } from "@/lib/bonmoment/card";
import { takeWriteForm } from "./search";
import { requestPlan } from "./plan";

function OccasionChoice({
  item,
  on,
  onPick,
}: {
  item: { id: OccasionId; emoji: string };
  on: boolean;
  onPick: (id: OccasionId, event?: { currentTarget: HTMLElement }) => void;
}) {
  const Icon = occasionIcon(item.id);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={(event) => onPick(item.id, event)}
      className={cn(
        "flex min-h-14 items-center gap-2 rounded-2xl border bg-surface px-3 py-2 text-left text-sm font-medium",
        on ? "border-wax bg-wax text-onwax shadow-lift" : "border-line text-ink",
      )}
    >
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", on ? "bg-onwax/15" : "bg-paper text-wax")} aria-hidden>
        <Icon className="size-4" />
      </span>
      <span className="text-base leading-none" aria-hidden>
        {item.emoji}
      </span>
      <span className="leading-tight">{occasionLabel(item.id)}</span>
    </button>
  );
}

export const RELATION_KEY: Record<Relation, MessageKey> = {
  parent: "relation.parent",
  papa: "relation.papa",
  maman: "relation.maman",
  ami: "relation.ami",
  famille: "relation.famille",
  amour: "relation.amour",
  tata: "relation.tata",
  tonton: "relation.tonton",
  enfant: "relation.enfant",
  frere: "relation.frere",
  soeur: "relation.soeur",
  papi: "relation.papi",
  mamie: "relation.mamie",
  cousin: "relation.cousin",
  grand: "relation.grand",
  collegue: "relation.collegue",
  autre: "relation.autre",
};

export function RelationChips({
  value,
  onChange,
}: {
  value: Relation | "";
  onChange: (next: Relation | "") => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-2">
      {RELATION_PICKS.map((id) => (
        <Chip key={id} active={value === id} onClick={() => onChange(value === id ? "" : id)}>
          {t(RELATION_KEY[id])}
        </Chip>
      ))}
    </div>
  );
}

const MAIN_WHO = RELATION_PICKS.slice(0, 6);

function cardMarks(body: string): string[] {
  return [...body.matchAll(/(\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu)].slice(-4).map((item) => item[0]);
}

function toneMood(tone?: ToneId): MoodId {
  if (tone === "humour") return "humour";
  if (tone === "court") return "content";
  if (tone === "poeme" || tone === "chaud") return "tendre";
  return "joyeux";
}

function toneForm(tone?: ToneId): WriteForm {
  if (tone === "poeme") return "poeme";
  if (tone === "chaud") return "lettre";
  return "sms";
}

export function Composer() {
  const t = useT();
  const draft = useBonMoment((state) => state.draft);
  const setDraft = useBonMoment((state) => state.setDraft);
  const contacts = useBonMoment((state) => state.contacts);
  const templates = useBonMoment((state) => state.templates);
  const addContact = useBonMoment((state) => state.addContact);
  const updateContact = useBonMoment((state) => state.updateContact);
  const saveDraft = useBonMoment((state) => state.saveDraft);
  const saveTemplate = useBonMoment((state) => state.saveTemplate);
  const setTab = useBonMoment((state) => state.setTab);
  const removeSchedule = useBonMoment((state) => state.removeSchedule);
  const settings = useBonMoment((state) => state.settings);
  const fests = useBonMoment((state) => state.fests ?? []);
  const setSettings = useBonMoment((state) => state.setSettings);
  const simple = useSimple();
  const locale = useLocale();
  const [idea, setIdea] = useState(0);
  const [ideaBusy, setIdeaBusy] = useState(false);
  const [mood, setMood] = useState<MoodId>(toneMood(settings.tone));
  const [form, setForm] = useState<WriteForm>(toneForm(settings.tone));
  useEffect(() => {
    const next = takeWriteForm();
    if (next) setForm(next);
  }, []);
  const [adding, setAdding] = useState(contacts.length === 0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [who, setWho] = useState<Relation | "">(() => knownRelation(contacts.find((item) => item.id === draft.contactId) ?? { id: "" }) ?? "");
  const [whoFilter, setWhoFilter] = useState<Relation | "">("");
  const [whoQuery, setWhoQuery] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [error, setError] = useState<DraftIssue | null>(null);
  const [warn, setWarn] = useState<DraftIssue | null>(null);
  const [spark, setSpark] = useState<{ x: number; y: number; occasion: OccasionId; n: number; big?: boolean } | null>(null);
  const [fest, setFest] = useState<{ id: OccasionId; n: number } | null>(null);
  const [themeFx, setThemeFx] = useState<{ mood: MoodId; x: number; y: number; n: number } | null>(null);
  const [ink, setInk] = useState(0);
  const [seal, setSeal] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [moreWho, setMoreWho] = useState(false);
  const [moreFest, setMoreFest] = useState(() => !MAIN_OCCASIONS.includes(draft.occasion));
  const [kept, setKept] = useState(false);
  const [starred, setStarred] = useState(false);
  const [cardNote, setCardNote] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const contact = contacts.find((item) => item.id === draft.contactId);
  const phoneState = usePhoneHits(whoQuery);
  const shown = contacts.filter((item) => (!whoFilter || knownRelation(item) === whoFilter) && contactMatches(item, whoQuery));
  const knownNames = new Set(contacts.map((item) => item.name.trim().toLocaleLowerCase()));
  const directory = phoneState.hits.filter((person) => !knownNames.has(person.name.trim().toLocaleLowerCase()));
  const choices = templates.filter((item) => item.occasion === draft.occasion);
  const outgoing = finishMessage(draft.body, contact?.name ?? "", usedSignature(settings));

  function burst(target: HTMLElement, big = false, occasion?: OccasionId) {
    const rect = target.getBoundingClientRect();
    const n = Date.now();
    setSpark({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      occasion: occasion ?? useBonMoment.getState().draft.occasion,
      n,
      big,
    });
    window.setTimeout(() => setSpark((current) => (current?.n === n ? null : current)), big ? 900 : 520);
  }

  function pickOccasion(id: OccasionId, event?: { currentTarget: HTMLElement }) {
    playOccasion(id);
    if (event) burst(event.currentTarget, true, id);
    const n = Date.now();
    setFest({ id, n });
    window.setTimeout(() => setFest((current) => (current?.n === n ? null : current)), 1200);
    const slot = suggestSlot(id, new Date());
    const currentIsTemplate = templates.some((item) => item.body === draft.body);
    const first = templates.find((item) => item.occasion === id);
    const fill = !draft.body.trim() || currentIsTemplate;
    const person = contacts.find((item) => item.id === draft.contactId);
    const birthday =
      !draft.scheduleId && id === "anniversaire" && person?.month && person.day
        ? nextDateInput(person.month, person.day)
        : null;
    setDraft({
      ...draft,
      occasion: id,
      festId: undefined,
      ...(slot ?? {}),
      ...(birthday ? { date: birthday } : {}),
      repeat: slot?.repeat ?? defaultRepeat(id),
      ...(fill
        ? {
            templateId: first?.id ?? null,
            body: first?.body ?? "",
          }
        : {}),
    });
  }

  function pickFest(fest: CustomFest, target: HTMLElement) {
    playChime();
    burst(target, true, "autre");
    const n = Date.now();
    setFest({ id: "autre", n });
    window.setTimeout(() => setFest((current) => (current?.n === n ? null : current)), 1200);
    if (fest.wallpaper) setSettings({ wallpaperId: fest.wallpaper, wallpaper: true });
    const fill = !draft.body.trim() || templates.some((item) => item.body === draft.body);
    setDraft({
      ...draft,
      occasion: "autre",
      festId: fest.id,
      repeat: "once",
      ...(fill ? { templateId: null, body: fest.line } : {}),
    });
  }

  function chooseContact(id: string) {
    const person = contacts.find((item) => item.id === id);
    const link = person ? knownRelation(person) : undefined;
    if (link) setWho(link);
    const birthday =
      !draft.scheduleId && draft.occasion === "anniversaire" && person?.month && person.day
        ? nextDateInput(person.month, person.day)
        : null;
    setDraft({ ...draft, contactId: id, ...(birthday ? { date: birthday } : {}) });
  }

  function pickWho(next: Relation | "") {
    setWho(next);
  }

  function anotherText() {
    if (choices.length === 0) return;
    const index = choices.findIndex((item) => item.id === draft.templateId || item.body === draft.body);
    const next = choices[(index + 1) % choices.length];
    setDraft({ ...draft, templateId: next.id, body: next.body, occasion: next.occasion });
  }

  function fillFromPhone(person: { name: string; phone: string; email: string }) {
    const existing = contacts.find((item) => item.name.trim().toLocaleLowerCase() === person.name.trim().toLocaleLowerCase());
    if (existing) {
      chooseContact(existing.id);
      setAdding(false);
      setContactError(null);
      return;
    }
    setAdding(true);
    setName(person.name);
    setPhone(person.phone);
    setEmail(person.email);
    setContactError(null);
  }

  function createContact() {
    if (name.trim().length < 2) {
      setContactError(t("composer.nameError"));
      return;
    }
    const id = addContact({ name, phone, email, ...(who ? { relation: who } : {}) });
    const latest = useBonMoment.getState().draft;
    setDraft({ ...latest, contactId: id });
    setAdding(false);
    setName("");
    setPhone("");
    setEmail("");
    setContactError(null);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const message = saveDraft();
    setError(message);
    if (message?.code === "limit") requestPlan();
    if (message && (message.code === "reach" || message.code === "phone" || message.code === "email")) setWarn(message);
    else setWarn(null);
    if (!message) {
      playChime();
      setSeal(true);
      window.setTimeout(() => setSeal(false), 1700);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl md:text-4xl">{draft.scheduleId ? t("composer.edit") : t("composer.new")}</h1>
        <p className="mt-2 text-base text-muted">{t("composer.lead")}</p>
        {settings.wallpaper ? <Garland occasion={draft.occasion} /> : null}
      </header>

      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-sm font-medium text-ink">{t("composer.for")}</p>
        <div className="grid grid-cols-3 gap-2">
          {(moreWho ? RELATION_PICKS : MAIN_WHO).map((item) => (
            <Chip
              key={item}
              className="w-full justify-center px-1"
              active={whoFilter === item}
              onClick={(event) => {
                const next = whoFilter === item ? "" : item;
                setWhoFilter(next);
                if (next) setWho(next);
                playTick();
                burst(event.currentTarget);
              }}
            >
              {t(RELATION_KEY[item])}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          aria-expanded={moreWho}
          onClick={() => setMoreWho((value) => !value)}
          className="self-start text-sm font-medium text-wax"
        >
          {moreWho ? t("composer.seeLess") : t("composer.seeMore")} {moreWho ? "▴" : "▾"}
        </button>
        <SearchBar value={whoQuery} onChange={setWhoQuery} placeholder={t("proches.find")} />
        {directory.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">{t("search.phone")}</p>
            {directory.map((person) => (
              <button
                key={`${person.name}-${person.phone}`}
                type="button"
                onClick={() => {
                  const link = phoneLink(person, whoQuery);
                  const role = link.relation || who || undefined;
                  const existing = contacts.find((item) => item.name.trim().toLocaleLowerCase() === person.name.trim().toLocaleLowerCase());
                  if (existing) {
                    updateContact(existing.id, {
                      ...(role ? { relation: role } : {}),
                      ...(link.nickname && !existing.nickname ? { nickname: link.nickname } : {}),
                      phone: person.phone || existing.phone,
                      email: person.email || existing.email,
                    });
                    chooseContact(existing.id);
                  } else {
                    const id = addContact({
                      name: person.name,
                      phone: person.phone,
                      email: person.email,
                      ...(role ? { relation: role } : {}),
                      ...(link.nickname ? { nickname: link.nickname } : {}),
                    });
                    const latest = useBonMoment.getState().draft;
                    setDraft({ ...latest, contactId: id });
                  }
                  setWhoQuery("");
                  setAdding(false);
                  playTick();
                }}
                className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 text-left"
              >
                <span className="truncate font-medium">{person.name}</span>
                <span className="shrink-0 text-sm text-muted">{person.nickname || person.phone}</span>
              </button>
            ))}
          </div>
        ) : null}
        {shown.length === 0 && directory.length === 0 ? (
          phoneState.loading ? (
            <p className="text-sm text-muted">{t("load.wait")}</p>
          ) : whoQuery.trim() ? (
            <div className="flex flex-col gap-2">
              <KinshipMarks
                query={whoQuery}
                onMark={(id, role) => {
                  const person = contacts.find((item) => item.id === id);
                  updateContact(id, { relation: role, ...(person?.nickname?.trim() ? {} : { nickname: whoQuery.trim() }) });
                  chooseContact(id);
                  setWho(role);
                  setWhoQuery("");
                  playTick();
                }}
              />
              {relationOf(whoQuery) && contacts.some((item) => item.relation !== relationOf(whoQuery)) ? null : (
                <p className="text-sm text-muted">{t("search.none")}</p>
              )}
              {phoneBookReady() ? null : <PhoneBookAsk />}
            </div>
          ) : (
            <p className="text-sm text-muted">{t("relation.empty")}</p>
          )
        ) : (
          <div className="flex flex-col gap-2">
            {shown.map((item) => {
              const link = knownRelation(item);
              const on = draft.contactId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(event) => {
                    chooseContact(item.id);
                    playTick();
                    burst(event.currentTarget);
                  }}
                  className={cn(
                    "flex h-12 items-center justify-between gap-3 rounded-2xl border px-4 text-left text-base",
                    on ? "border-wax bg-wax text-onwax" : "border-line bg-surface text-ink",
                  )}
                >
                  <span className="truncate font-medium">{item.name}</span>
                  {link ? <span className={cn("shrink-0 text-sm", on ? "text-onwax" : "text-muted")}>{t(RELATION_KEY[link])}</span> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm font-medium text-ink">{t("composer.theme")}</p>
        <div className="theme-pad grid grid-cols-2 gap-2 sm:grid-cols-4" data-mood={mood}>
          {WRITE_MOODS.map((item) => (
              <Chip key={item} className="w-full justify-center" active={mood === item}
              onClick={(event) => {
                setMood(item);
                playTick();
                const rect = event.currentTarget.getBoundingClientRect();
                const n = Date.now();
                setThemeFx({ mood: item, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, n });
                window.setTimeout(() => setThemeFx((current) => (current?.n === n ? null : current)), 760);
              }}
            >
              {t(MOOD_KEYS[item])}
            </Chip>
          ))}
        </div>
      </div>

      {adding ? (
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
          <PhoneBookButton onPick={fillFromPhone} />
          <p className="text-sm font-medium text-ink">{t("composer.link")}</p>
          <RelationChips value={who} onChange={pickWho} />
          <Field label={t("composer.fullName")}>
            <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Camille Laurent" />
          </Field>
          <Field label={t("composer.phone")} hint={t("composer.phoneHint")}>
            <input className={fieldClass} inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="06 12 34 56 78" />
          </Field>
          <Field label={t("composer.email")} hint={t("composer.emailHint")}>
            <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="camille@email.fr" />
          </Field>
          {contactError ? (
            <p role="alert" className="text-sm text-wax">
              {contactError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={createContact}>
              {t("composer.add")}
            </Button>
            {contacts.length > 0 ? (
              <Button variant="ghost" onClick={() => setAdding(false)}>
                {t("agenda.cancel")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-3">
          <Button variant="ghost" className="self-start px-0" onClick={() => setAdding(true)}>
            {t("composer.newPerson")}
          </Button>
          <PhoneBookButton onPick={fillFromPhone} />
        </div>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">{t("composer.occasion")}</legend>
        <FestLane selected={draft.festId} onPick={pickFest} />
        <div className="grid grid-cols-2 gap-2">
          {MAIN_OCCASIONS.map((id) => {
            const item = OCCASIONS.find((entry) => entry.id === id);
            if (!item) return null;
            return <OccasionChoice key={item.id} item={item} on={!draft.festId && draft.occasion === item.id} onPick={pickOccasion} />;
          })}
        </div>
        {moreFest ? (
          <div className="max-h-52 overflow-y-auto rounded-3xl border border-line bg-paper p-2">
            <div className="grid grid-cols-2 gap-2">
              {OCCASIONS.filter((item) => !MAIN_OCCASIONS.includes(item.id)).map((item) => (
                <OccasionChoice key={item.id} item={item} on={!draft.festId && draft.occasion === item.id} onPick={pickOccasion} />
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          aria-expanded={moreFest}
          onClick={() => setMoreFest((value) => !value)}
          className="self-start text-sm font-medium text-wax"
        >
          {moreFest ? t("composer.seeLess") : t("composer.seeMore")} {moreFest ? "▴" : "▾"}
        </button>
      </fieldset>

      <PrenomPanel />

      <section className="flex flex-col gap-3 rounded-[2rem] border border-line bg-surface p-4 shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-ink">{t("composer.message")}</h2>
            <p className="text-sm text-muted">{t("composer.messageHint")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button
              variant="quiet"
              onClick={(event) => {
                const person = contact ? firstName(contact.name) : "";
                const next = moodLine(locale, mood, person, idea + 1, draft.occasion, form);
                setDraft({ ...draft, templateId: null, body: next });
                setIdea((value) => value + 1);
                setInk((value) => value + 1);
                playIdea();
                const rect = event.currentTarget.getBoundingClientRect();
                const n = Date.now();
                setSpark({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, occasion: draft.occasion, n });
                window.setTimeout(() => setSpark((current) => (current?.n === n ? null : current)), 700);
              }}
            >
              {t("composer.idea")}
            </Button>
            <Button
              variant="quiet"
              disabled={ideaBusy}
              onClick={(event) => {
                const person = contact ? firstName(contact.name) : "";
                const rect = event.currentTarget.getBoundingClientRect();
                const n = Date.now();
                setSpark({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, occasion: draft.occasion, n });
                window.setTimeout(() => setSpark((current) => (current?.n === n ? null : current)), 700);
                setIdeaBusy(true);
                void requestIdea({
                  server: settings.gatewayUrl ?? "",
                  locale,
                  mood,
                  occasion: draft.occasion,
                  name: person,
                  form,
                  body: draft.body,
                }).then((result) => {
                  setDraft({ ...useBonMoment.getState().draft, templateId: null, body: result.text });
                  setInk((value) => value + 1);
                  playIdea();
                }).finally(() => setIdeaBusy(false));
              }}
            >
              {ideaBusy ? <IdeaSearchLabel /> : t("composer.ideaAi")}
            </Button>
          </div>
        </div>
        <Inspire
          name={contact ? firstName(contact.name) : ""}
          occasion={draft.occasion}
          body={draft.body}
          mood={mood}
          form={form}
          onForm={setForm}
          onText={(text) => setDraft({ ...useBonMoment.getState().draft, templateId: null, body: text })}
        />
        {simple && choices.length > 1 ? (
          <Button variant="quiet" className="self-start" onClick={anotherText}>
            {t("composer.another")}
          </Button>
        ) : null}
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.6rem] border border-line bg-paper p-3 shadow-lift transition-all duration-300",
            (settings.photoShape ?? "free") === "square" && "aspect-square",
            (settings.photoShape ?? "free") === "landscape" && "aspect-[2/1]",
            (settings.photoShape ?? "free") === "portrait" && "min-h-80",
          )}
        >
          {cardMarks(draft.body).map((emoji, index) => (
            <span
              key={`${emoji}-${index}`}
              aria-hidden
              className={cn("card-mark pointer-events-none absolute text-2xl opacity-80", stickerMotion(emoji))}
              style={{ right: `${0.6 + (index % 2) * 1.8}rem`, top: `${0.4 + Math.floor(index / 2) * 2}rem` }}
            >
              {emoji}
            </span>
          ))}
          <textarea
            className={cn(
              "w-full resize-none bg-transparent pr-14 text-base leading-relaxed text-ink outline-none transition-all duration-300",
              ink && "ink-flash",
              (settings.photoShape ?? "free") === "free" && "min-h-36",
              (settings.photoShape ?? "free") === "square" && "h-full min-h-52",
              (settings.photoShape ?? "free") === "landscape" && "h-full min-h-28",
              (settings.photoShape ?? "free") === "portrait" && "min-h-72",
            )}
            key={ink}
            aria-label={t("composer.message")}
            value={draft.body}
            onChange={(event) => setDraft({ ...draft, templateId: null, body: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["free", "square", "landscape", "portrait"] as const satisfies readonly PhotoShape[]).map((shape) => (
            <Chip key={shape} active={(settings.photoShape ?? "free") === shape} onClick={() => setSettings({ photoShape: shape })}>
              {t(`photo.shape.${shape}`)}
            </Chip>
          ))}
        </div>
        <StickerBar />
      </section>

      {!simple && choices.length > 0 ? (
        <details className="rounded-3xl border border-line bg-surface px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">{t("composer.ready")}</summary>
          <div className="mt-3 flex flex-col gap-2">
            {choices.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDraft({ ...draft, templateId: item.id, body: item.body, occasion: item.occasion })}
                className={
                  draft.templateId === item.id
                    ? "rounded-2xl border border-wax bg-paper px-4 py-3 text-left"
                    : "rounded-2xl border border-line bg-paper px-4 py-3 text-left"
                }
              >
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-muted">{item.body}</span>
              </button>
            ))}
          </div>
        </details>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={photoRef}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void readPhoto(file, useBonMoment.getState().settings.photoShape ?? "free")
                .then((image) => {
                  setPhotoError(null);
                  setDraft({ ...useBonMoment.getState().draft, image });
                })
                .catch(() => setPhotoError(t("photo.bad")));
            }}
          />
          {draft.image ? (
            <button type="button" className="size-14 overflow-hidden rounded-2xl border border-line" onClick={() => photoRef.current?.click()}>
              <img src={draft.image} alt="" className="size-full object-cover" />
            </button>
          ) : null}
          <Button variant="quiet" onClick={() => photoRef.current?.click()}>
            <ImagePlus className="size-4" aria-hidden />
            {draft.image ? t("photo.change") : t("photo.add")}
          </Button>
          {draft.image ? <DownloadFile href={draft.image} name="bonmoment.jpg" label={t("photo.download")} /> : null}
          <AiPicture
            occasion={draft.occasion}
            onFile={(file) => {
              void readPhoto(file, useBonMoment.getState().settings.photoShape ?? "free")
                .then((image) => {
                  setPhotoError(null);
                  setDraft({ ...useBonMoment.getState().draft, image });
                })
                .catch(() => setPhotoError(t("photo.aiFail")));
            }}
          />
          <WebFetch
            kind="image"
            onFile={(file) => {
              void readPhoto(file, useBonMoment.getState().settings.photoShape ?? "free")
                .then((image) => {
                  setPhotoError(null);
                  setDraft({ ...useBonMoment.getState().draft, image });
                })
                .catch(() => setPhotoError(t("photo.bad")));
            }}
          />
        </div>
        {photoError ? (
          <p role="alert" className="text-sm text-wax">
            {photoError}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={videoRef}
            className="hidden"
            type="file"
            accept="video/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setVideoBusy(true);
              setVideoError(null);
              void readVideo(file)
                .then((video) => {
                  setDraft({ ...useBonMoment.getState().draft, video });
                })
                .catch(() => setVideoError(t("video.bad")))
                .finally(() => setVideoBusy(false));
            }}
          />
          <Button variant="quiet" disabled={videoBusy} onClick={() => videoRef.current?.click()}>
            <Video className="size-4" aria-hidden />
            {videoBusy ? t("video.wait") : draft.video ? t("video.change") : t("video.add")}
          </Button>
          {draft.video ? (
            <RemoveVideoButton
              onRemove={() => {
                setVideoError(null);
                setDraft({ ...useBonMoment.getState().draft, video: undefined });
              }}
            />
          ) : null}
          {draft.video ? <DownloadVideo id={draft.video} /> : null}
          <WebFetch
            kind="video"
            onFile={(file) => {
              setVideoBusy(true);
              setVideoError(null);
              void readVideo(file)
                .then((video) => setDraft({ ...useBonMoment.getState().draft, video }))
                .catch(() => setVideoError(t("video.bad")))
                .finally(() => setVideoBusy(false));
            }}
          />
        </div>
        {videoError ? (
          <p role="alert" className="text-sm text-wax">
            {videoError}
          </p>
        ) : null}
        <VoiceCard
          id={draft.voice}
          style={draft.voiceStyle ?? settings.voiceStyle ?? "plain"}
          text={draft.body}
          onStyle={(voiceStyle: VoiceStyle) => {
            const latest = useBonMoment.getState().draft;
            setDraft({ ...latest, voiceStyle });
            setSettings({ voiceStyle });
          }}
          onSaved={(voice) => {
            const latest = useBonMoment.getState().draft;
            setDraft({
              ...latest,
              voice,
              voiceStyle: latest.voiceStyle ?? useBonMoment.getState().settings.voiceStyle ?? "plain",
            });
          }}
          onRemove={
            draft.voice
              ? () => {
                  const latest = useBonMoment.getState().draft;
                  setDraft({ ...latest, voice: undefined });
                }
              : undefined
          }
        />
      </div>

      <TranslateBar
        text={draft.body}
        onTranslated={(body) => {
          const latest = useBonMoment.getState().draft;
          setDraft({ ...latest, templateId: null, body });
        }}
      />

      <Letter
        name={contact?.name ?? ""}
        body={draft.body}
        image={draft.image}
        onRemoveImage={
          draft.image
            ? () => {
                setPhotoError(null);
                setDraft({ ...useBonMoment.getState().draft, image: undefined });
              }
            : undefined
        }
        extra={
          draft.video ? (
            <VideoExtra
              id={draft.video}
              onRemove={() => {
                setVideoError(null);
                setDraft({ ...useBonMoment.getState().draft, video: undefined });
              }}
            />
          ) : undefined
        }
        footer={
          contact
            ? `${fests.find((item) => item.id === draft.festId)?.title ?? occasionLabel(draft.occasion)} · ${channelLabel(draft.channel)} · ${draft.repeat === "yearly" ? t("agenda.yearlyShort") : t("composer.onceWord")}`
            : t("composer.pickFirst")
        }
        signature={usedSignature(settings)}
      />

      <CopyMessage text={outgoing} />

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("composer.day")}>
          <input
            className={fieldClass}
            type="date"
            required
            value={draft.date}
            onChange={(event) => setDraft({ ...draft, date: event.target.value })}
          />
        </Field>
        <Field label={t("composer.time")}>
          <input
            className={fieldClass}
            type="time"
            required
            value={draft.time}
            onChange={(event) => setDraft({ ...draft, time: event.target.value })}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">{t("composer.repeat")}</legend>
        <div className="grid grid-cols-2 gap-2">
          <Chip active={draft.repeat === "once"} onClick={() => setDraft({ ...draft, repeat: "once" })}>
            {t("composer.once")}
          </Chip>
          <Chip active={draft.repeat === "yearly"} onClick={() => setDraft({ ...draft, repeat: "yearly" })}>
            {t("composer.yearly")}
          </Chip>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">{t("composer.via")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {CHANNELS.map((item) => (
            <Chip key={item.id} className="w-full justify-center px-2" active={draft.channel === item.id} onClick={() => setDraft({ ...draft, channel: item.id })}>
              <span aria-hidden>{item.emoji}</span>
              {channelLabel(item.id)}
            </Chip>
          ))}
        </div>
        {!simple && draft.channel === "sms" && outgoing.trim().length > 1 ? (
          <p className={outgoing.length > 160 ? "text-sm text-wax" : "text-sm text-muted"}>
            {t("composer.smsCount", { count: outgoing.length })}
            {outgoing.length > 160 ? ` ${t("composer.smsLong")}` : ""}
          </p>
        ) : null}
        {draft.channel === "snapchat" ? <p className="text-sm text-muted">{t("snap.copied")}</p> : null}
        {isSocial(draft.channel) ? (
          <p className="text-sm text-ink">{onlineNow() ? t("social.ready") : t("social.offline")}</p>
        ) : null}
        {isSocial(draft.channel) ? <p className="text-sm text-muted">{t("social.note")}</p> : null}
        {contact && channelNeeds(draft.channel) !== "none" && !contact.phone.trim() && !contact.email.trim() ? (
          <p role="alert" className="rounded-2xl border border-wax bg-paper px-3 py-2 text-sm font-medium text-ink">
            {t("errors.reach", { name: firstName(contact.name) })}
          </p>
        ) : null}
        {contact && draft.channel === "email" && !contact.email.trim() ? (
          <p className="text-sm text-muted">{t("composer.noEmail", { name: firstName(contact.name) })}</p>
        ) : null}
      </fieldset>

      {error && error.code !== "reach" && error.code !== "phone" && error.code !== "email" ? (
        <p role="alert" className="text-sm text-wax">
          {issueText(t, error)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" type="submit">
          {draft.scheduleId ? t("composer.save") : t("composer.schedule")}
        </Button>
        <p className="basis-full text-sm text-muted">{t("composer.laterHint")}</p>
        <Button
          variant="quiet"
          onClick={() => {
            const body = draft.body.trim();
            if (body.length < 2) return;
            const title = body.split("\n")[0].replace(/\s+/g, " ").slice(0, 42);
            saveTemplate({ title: title || t("textes.keep"), body, occasion: draft.occasion, star: true });
            setStarred(true);
            playChime();
          }}
        >
          {starred ? t("fav.starred") : t("fav.star")}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            const body = (outgoing || draft.body).trim();
            if (body.length < 2) return;
            const fest = fests.find((item) => item.id === draft.festId);
            void shareCard({
              title: fest?.title ?? occasionLabel(draft.occasion),
              body,
              mark: fest?.emoji ?? "✨",
            }).then((result) => setCardNote(result === "fail" ? t("card.fail") : result === "shared" ? t("card.shared") : t("card.saved")));
          }}
        >
          {t("card.export")}
        </Button>
        {draft.scheduleId ? (
          <Button variant="ghost" onClick={() => setTab("agenda")}>
            {t("agenda.cancel")}
          </Button>
        ) : null}
        {draft.scheduleId ? (
          <RemoveButton
            onRemove={() => {
              removeSchedule(draft.scheduleId!);
              setTab("agenda");
            }}
          />
        ) : null}
      </div>
      {kept ? <p className="text-sm text-muted">{t("textes.kept")}</p> : null}
      {cardNote ? <p className="text-sm text-muted">{cardNote}</p> : null}
      {spark ? <SparkBurst key={spark.n} x={spark.x} y={spark.y} occasion={spark.occasion} big={spark.big} /> : null}
      {fest ? <FestFlash key={fest.n} occasion={fest.id} /> : null}
      {themeFx ? <ThemeFlash key={themeFx.n} mood={themeFx.mood} x={themeFx.x} y={themeFx.y} /> : null}
      {seal ? <SealDrop /> : null}
      {warn ? (
        <ReachDialog
          issue={warn}
          onClose={() => setWarn(null)}
          onFix={() => {
            setWarn(null);
            setAdding(true);
          }}
        />
      ) : null}
    </form>
  );
}

function issueText(t: ReturnType<typeof useT>, issue: DraftIssue): string {
  if (issue.code === "reach") return t("errors.reach", { name: issue.name || t("errors.someone") });
  if (issue.code === "phone" || issue.code === "email") {
    return t(issue.code === "phone" ? "errors.phone" : "errors.email", {
      name: issue.name || t("errors.someone"),
    });
  }
  if (issue.code === "person") return t("errors.person");
  if (issue.code === "body") return t("errors.body");
  if (issue.code === "limit") return t("errors.limit");
  return t("errors.when");
}

function ReachDialog({ issue, onClose, onFix }: { issue: DraftIssue; onClose: () => void; onFix: () => void }) {
  const t = useT();
  if (typeof document === "undefined") return null;
  const named = issue.code === "reach" || issue.code === "phone" || issue.code === "email";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 md:items-center" onClick={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reach-title"
        className="w-full max-w-md rounded-3xl border border-line bg-paper p-5 text-ink shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="reach-title" className="text-2xl">
          {t("errors.reachTitle")}
        </h2>
        <p className="mt-2 text-base leading-relaxed">{named ? issueText(t, issue) : t("errors.person")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={onFix}>
            {t("errors.fix")}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t("plan.close")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
