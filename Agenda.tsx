import { useState } from "react";
import { Copy, ImagePlus, Pencil, Repeat, Trash2, Video } from "lucide-react";
import { channelLabel, defaultRepeat, occasionIcon, occasionLabel } from "@/lib/bonmoment/occasions";
import { channelNeeds, finishMessage, firstName, launchHref, messageHref, openLabel, usedSignature } from "@/lib/bonmoment/message";
import { sharePhoto } from "@/lib/bonmoment/photo";
import { shareVideo } from "@/lib/bonmoment/video";
import { comingSoon } from "@/lib/bonmoment/soon";
import { playOccasion, playPage, playSparkle, playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import { SEASON } from "@/lib/bonmoment/calendar";
import { countdownLabel, daysUntil, formatDay, formatLongDate, formatMonth, formatWhen, staticMonth, staticWhen, suggestSlot } from "@/lib/bonmoment/time";
import type { OccasionId, Schedule, TabId } from "@/lib/bonmoment/types";
import { useSimple, useT } from "@/lib/bonmoment/use-i18n";
import { announce } from "./notifications";
import { HelpButton } from "./help";
import { CrowdBadge } from "./crowd";
import { HomeSearch, matchesQuery } from "./search";
import { Tour } from "./tour";
import { Button, Chip, Field, Letter, RemovePhotoButton, fieldClass } from "./ui";
import { CopyMessage, copyText } from "./copy";
import { DownloadFile, DownloadVideo } from "./fetch";
import { RemoveVideoButton, VideoExtra, VideoFrame } from "./clip";
import { VoiceLine } from "./voice";
import { TranslateBar } from "./translate";

export function StartGuide() {
  const t = useT();
  const contacts = useBonMoment((state) => state.contacts);
  const schedules = useBonMoment((state) => state.schedules);
  const logs = useBonMoment((state) => state.logs);
  const setTab = useBonMoment((state) => state.setTab);
  const hidden = useBonMoment((state) => state.settings.startHidden === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  const real = contacts.some((item) => !item.example);
  const written = schedules.some((item) => {
    const person = contacts.find((entry) => entry.id === item.contactId);
    return person ? !person.example : true;
  });
  const sent = logs.length > 0;
  const steps: { ok: boolean; label: string; go: TabId }[] = [
    { ok: real, label: t("start.1"), go: "proches" },
    { ok: written, label: t("start.2"), go: "composer" },
    { ok: sent, label: t("start.3"), go: "journal" },
  ];
  const done = steps.filter((item) => item.ok).length;
  function toggle() {
    playTick();
    setSettings({ startHidden: !hidden });
  }
  if (hidden) {
    return (
      <Button variant="quiet" className="mb-4" onClick={toggle}>
        {t("start.show")}
      </Button>
    );
  }
  return (
    <div className="mb-4 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{t("start.title")}</p>
        <p className="text-sm text-muted">
          {done} / {steps.length}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-wax" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((item) => (
          <li key={item.label}>
            <button type="button" onClick={() => { playTick(); setTab(item.go); }} className="flex w-full items-center gap-2 text-left text-sm text-ink">
              <span className={item.ok ? "text-ink" : "text-muted"} aria-hidden>
                {item.ok ? "✓" : "○"}
              </span>
              <span className={item.ok ? "text-muted line-through" : "font-medium"}>{item.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <Button variant="quiet" className="mt-3" onClick={toggle}>
        {t("start.hide")}
      </Button>
    </div>
  );
}

export function ExampleToggle() {
  const t = useT();
  const contacts = useBonMoment((state) => state.contacts);
  const removeExamples = useBonMoment((state) => state.removeExamples);
  const restoreExamples = useBonMoment((state) => state.restoreExamples);
  const hasExamples = contacts.some((contact) => contact.example);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{t(hasExamples ? "agenda.examples" : "agenda.examplesOff")}</p>
      <Button
        variant={hasExamples ? "quiet" : "primary"}
        className="shrink-0"
        onClick={() => {
          playTick();
          if (hasExamples) removeExamples();
          else restoreExamples();
        }}
      >
        {t(hasExamples ? "agenda.removeExamples" : "agenda.restoreExamples")}
      </Button>
    </div>
  );
}

export function Agenda() {
  const t = useT();
  const schedules = useBonMoment((state) => state.schedules);
  const contacts = useBonMoment((state) => state.contacts);
  const templates = useBonMoment((state) => state.templates);
  const fests = useBonMoment((state) => state.fests ?? []);
  const clockSynced = useBonMoment((state) => state.clockSynced);
  const setTab = useBonMoment((state) => state.setTab);
  const beginNew = useBonMoment((state) => state.beginNew);
  const beginEdit = useBonMoment((state) => state.beginEdit);
  const removeSchedule = useBonMoment((state) => state.removeSchedule);
  const clearImage = useBonMoment((state) => state.clearImage);
  const clearVideo = useBonMoment((state) => state.clearVideo);
  const clearVoice = useBonMoment((state) => state.clearVoice);
  const signature = usedSignature(useBonMoment((state) => state.settings));
  const active = schedules.filter((item) => item.status !== "sent").slice().sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const due = active.filter((item) => item.status === "due");
  const later = active.filter((item) => item.status !== "due");
  const soon = clockSynced ? comingSoon(contacts, schedules) : [];
  const [query, setQuery] = useState("");
  const [soonOpen, setSoonOpen] = useState(false);

  function titleOf(schedule: { occasion: OccasionId; festId?: string }) {
    const fest = schedule.festId ? fests.find((item) => item.id === schedule.festId) : undefined;
    return fest?.title ?? occasionLabel(schedule.occasion);
  }

  function visible(schedule: Schedule) {
    const contact = contacts.find((item) => item.id === schedule.contactId);
    return matchesQuery(query, [contact?.name, contact?.phone, contact?.email, titleOf(schedule), schedule.body]);
  }

  const dueShown = due.filter(visible);
  const laterShown = later.filter(visible);
  const soonShown = soon.filter((item) => matchesQuery(query, [item.title, occasionLabel(item.occasion)]));
  const searching = query.trim().length > 0;

  function startSoon(item: (typeof soon)[number]) {
    playOccasion(item.occasion);
    const template = templates.find((entry) => entry.occasion === item.occasion);
    beginNew({
      occasion: item.occasion,
      contactId: item.contactId ?? "",
      date: item.date,
      templateId: template?.id ?? null,
      body: template?.body ?? "",
      repeat: "yearly",
    });
  }

  function startOccasion(id: OccasionId) {
    const slot = suggestSlot(id, new Date());
    const template = templates.find((item) => item.occasion === id);
    beginNew({
      occasion: id,
      templateId: template?.id ?? null,
      body: template?.body ?? "",
      repeat: defaultRepeat(id),
      ...(slot ?? {}),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <HomeSearch value={query} onChange={setQuery} />
        </div>
        <HelpButton />
        <CrowdBadge />
        <button
          type="button"
          onClick={() => {
            playPage();
            setTab("calendrier");
          }}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-xl"
          aria-label={t("calendar.open")}
        >
          <span aria-hidden>{SEASON[clockSynced ? new Date().getMonth() : 9]}</span>
        </button>
      </div>
      <StartGuide />
      <Tour />
      <header>
        <p className="text-sm text-muted" suppressHydrationWarning>
          {formatLongDate()}
        </p>
        <h1 className="mt-1 text-3xl md:text-4xl">{t("agenda.title")}</h1>
      </header>
      {searching && laterShown.length === 0 ? null : (
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl">{t("agenda.waiting")}</h2>
          <p className="text-sm text-muted">{t("agenda.waitingHint")}</p>
          {laterShown.length === 0 ? (
            searching ? null : (
              <div className="rounded-3xl border border-dashed border-line bg-surface px-5 py-6">
                <p className="text-base text-ink">{t("agenda.empty")}</p>
                <p className="mt-1 text-sm text-muted">{t("agenda.emptyHint")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["anniversaire", "mariage", "enterrement", "noel"] as const).map((id) => {
                    const Icon = occasionIcon(id);
                    return (
                      <Chip key={id} onClick={() => startOccasion(id)}>
                        <Icon className="size-4" aria-hidden />
                        {occasionLabel(id)}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <ul className="flex flex-col gap-3">
              {laterShown.map((schedule, index) => {
                const contact = contacts.find((item) => item.id === schedule.contactId);
                const Icon = occasionIcon(schedule.occasion);
                const day = clockSynced ? formatDay(schedule.at) : String(schedule.day);
                const month = clockSynced ? formatMonth(schedule.at) : staticMonth(schedule.month);
                const when = clockSynced ? formatWhen(schedule.at) : staticWhen(schedule);
                return (
                  <li key={schedule.id} className="rise rounded-3xl border border-line bg-surface p-4 shadow-lift" style={{ animationDelay: `${index * 60}ms` }}>
                    <div className="flex gap-4">
                      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-paper">
                        <span className="font-serif text-2xl leading-none tabular-nums">{day}</span>
                        <span className="mt-1 text-xs text-muted">{month}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{contact?.name ?? t("agenda.removed")}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                          <Icon className="size-4" aria-hidden />
                          <span>{titleOf(schedule)}</span>
                          <span aria-hidden>·</span>
                          <span>{channelLabel(schedule.channel)}</span>
                          {schedule.repeat === "yearly" ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Repeat className="size-3.5" aria-hidden />
                                {t("agenda.yearly")}
                              </span>
                            </>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-ink">{when}</p>
                        {schedule.image ? (
                          <div className="mt-3 flex flex-col items-start gap-2">
                            <img src={schedule.image} alt="" className="h-24 w-full rounded-2xl object-cover" />
                            <RemovePhotoButton onRemove={() => clearImage(schedule.id)} />
                            <DownloadFile href={schedule.image} name="bonmoment.jpg" label={t("photo.download")} />
                          </div>
                        ) : null}
                        {schedule.video ? (
                          <div className="mt-3 flex flex-col items-start gap-2">
                            <VideoFrame id={schedule.video} />
                            <div className="flex flex-wrap gap-2">
                              <RemoveVideoButton onRemove={() => clearVideo(schedule.id)} />
                              <DownloadVideo id={schedule.video} />
                            </div>
                          </div>
                        ) : null}
                        {schedule.voice ? <VoiceLine id={schedule.voice} style={schedule.voiceStyle} onRemove={() => clearVoice(schedule.id)} /> : null}
                        {clockSynced ? (
                          <p className={`mt-2 inline-flex rounded-full bg-paper px-2 py-0.5 text-xs text-ink ${daysUntil(schedule.at) <= 1 ? "pulse-soft" : ""}`}>
                            {countdownLabel(schedule.at)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <OpenLater schedule={schedule} />
                      <CopyMessage text={finishMessage(schedule.body, contact?.name ?? "", signature)} />
                      <Button variant="quiet" onClick={() => beginEdit(schedule.id)}>
                        <Pencil className="size-4" aria-hidden />
                        {t("agenda.edit")}
                      </Button>
                      <RemoveButton onRemove={() => removeSchedule(schedule.id)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
      {dueShown.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl">{t("agenda.due")}</h2>
          {dueShown.map((schedule) => (
            <DueCard key={schedule.id} schedule={schedule} clockSynced={clockSynced} />
          ))}
        </section>
      ) : null}
      {soonShown.length > 0 ? (
        <section className="rounded-3xl border border-line bg-surface">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            aria-expanded={soonOpen}
            onClick={() => {
              playTick();
              setSoonOpen((value) => !value);
            }}
          >
            <span className="text-lg font-medium text-ink">{t("soon.title")}</span>
            <span aria-hidden className="text-xl text-muted">
              {soonOpen ? "–" : "+"}
            </span>
          </button>
          {soonOpen ? (
            <ul className="no-scrollbar flex w-full min-w-0 gap-3 overflow-x-auto px-4 pb-4">
              {soonShown.map((item) => {
                const Icon = occasionIcon(item.occasion);
                const when = item.days <= 0 ? t("soon.today") : item.days === 1 ? t("soon.tomorrow") : t("soon.days", { count: item.days });
                return (
                  <li key={item.key} className="w-44 shrink-0">
                    <button type="button" onClick={() => startSoon(item)} className="flex h-full w-full flex-col items-start gap-2 rounded-3xl border border-line bg-paper p-4 text-left">
                      <Icon className="size-5 text-wax" aria-hidden />
                      <span className="line-clamp-2 font-medium text-ink">{item.title || occasionLabel(item.occasion)}</span>
                      <span className="text-sm text-muted">{when}</span>
                      <span className="text-sm text-wax">{t("soon.write")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}
      <ExampleToggle />
      <p className="text-sm text-muted">{t("agenda.footer")}</p>
    </div>
  );
}

function DueCard({ schedule, clockSynced }: { schedule: Schedule; clockSynced: boolean }) {
  const t = useT();
  const contact = useBonMoment((state) => state.contacts.find((item) => item.id === schedule.contactId));
  const fests = useBonMoment((state) => state.fests ?? []);
  const updateContact = useBonMoment((state) => state.updateContact);
  const markSent = useBonMoment((state) => state.markSent);
  const setTab = useBonMoment((state) => state.setTab);
  const beginEdit = useBonMoment((state) => state.beginEdit);
  const removeSchedule = useBonMoment((state) => state.removeSchedule);
  const replaceBody = useBonMoment((state) => state.replaceBody);
  const clearImage = useBonMoment((state) => state.clearImage);
  const clearVideo = useBonMoment((state) => state.clearVideo);
  const clearVoice = useBonMoment((state) => state.clearVoice);
  const signature = usedSignature(useBonMoment((state) => state.settings));
  const simple = useSimple();
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [videoNote, setVideoNote] = useState<string | null>(null);
  if (!contact) return null;
  const needs = channelNeeds(schedule.channel);
  const missing = needs === "none" ? false : needs === "phone" ? !contact.phone.trim() : !contact.email.trim();
  const when = clockSynced ? formatWhen(schedule.at) : staticWhen(schedule);
  const Icon = occasionIcon(schedule.occasion);
  const label = fests.find((item) => item.id === schedule.festId)?.title ?? occasionLabel(schedule.occasion);

  async function copy() {
    try {
      await copyText(finishMessage(schedule.body, contact?.name ?? "", signature));
      playTick();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t("agenda.copyFail"));
    }
  }

  function open() {
    if (!contact) return;
    const nextPhone = phone.trim();
    const nextEmail = email.trim();
    if (needs === "phone" && !nextPhone) {
      setError(t("agenda.needPhone"));
      return;
    }
    if (needs === "email" && !nextEmail.includes("@")) {
      setError(t("agenda.needEmail"));
      return;
    }
    if (missing) updateContact(contact.id, needs === "phone" ? { phone: nextPhone } : { email: nextEmail });
    const href = messageHref(schedule.channel, { ...contact, phone: nextPhone, email: nextEmail }, schedule.body, label, signature);
    if (!href) {
      setError(t("agenda.incomplete"));
      return;
    }
    setError(null);
    const result = launchHref(schedule.channel, href);
    setOpened(result === "opened" ? t("agenda.opened", { where: channelLabel(schedule.channel) }) : t("agenda.notOpened"));
    if (result === "opened") setConfirm(true);
  }

  async function sendPhoto() {
    if (!schedule.image || !contact) return;
    const result = await sharePhoto(finishMessage(schedule.body, contact.name, signature), schedule.image);
    if (result === "saved") setPhotoNote(t("photo.saved"));
    if (result === "shared") setPhotoNote(null);
  }

  async function sendVideo() {
    if (!schedule.video || !contact) return;
    const result = await shareVideo(finishMessage(schedule.body, contact.name, signature), schedule.video);
    if (result === "saved") setVideoNote(t("video.saved"));
    if (result === "missing") setVideoNote(t("video.missing"));
    if (result === "shared") setVideoNote(null);
  }

  return (
    <article className="rounded-3xl border border-line bg-surface p-4 shadow-lift sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-wax">
            <Icon className="size-4" aria-hidden />
            {label}
          </p>
          <h3 className="mt-1 text-2xl text-ink">{contact.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {when} · {channelLabel(schedule.channel)}
            {schedule.repeat === "yearly" ? ` · ${t("agenda.yearlyShort")}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {missing && needs === "phone" ? (
          <Field label={t("agenda.phoneLabel", { name: firstName(contact.name) })} hint={t("agenda.phoneHint")}>
            <input className={fieldClass} inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={phone} onChange={(event) => setPhone(event.target.value)} suppressHydrationWarning />
          </Field>
        ) : null}
        {missing && needs === "email" ? (
          <Field label={t("agenda.emailLabel", { name: firstName(contact.name) })}>
            <input className={fieldClass} type="email" autoComplete="email" placeholder="prenom@email.fr" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-wax">
            {error}
          </p>
        ) : null}
        {opened ? <p className="text-sm text-muted">{opened}</p> : null}
        {photoNote ? <p className="text-sm text-muted">{photoNote}</p> : null}
        {videoNote ? <p className="text-sm text-muted">{videoNote}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={open}>
            {missing ? t("agenda.saveOpen") : openLabel(schedule.channel)}
          </Button>
          <Button variant="quiet" onClick={() => void copy()}>
            <Copy className="size-4" aria-hidden />
            {copied ? t("agenda.copied") : t("agenda.copy")}
          </Button>
          {schedule.image ? (
            <Button variant="quiet" onClick={() => void sendPhoto()}>
              <ImagePlus className="size-4" aria-hidden />
              {t("photo.share")}
            </Button>
          ) : null}
          {schedule.video ? (
            <Button variant="quiet" onClick={() => void sendVideo()}>
              <Video className="size-4" aria-hidden />
              {t("video.share")}
            </Button>
          ) : null}
          {schedule.image ? <DownloadFile href={schedule.image} name="bonmoment.jpg" label={t("photo.download")} /> : null}
          {schedule.video ? <DownloadVideo id={schedule.video} /> : null}
          {confirm ? (
            <Button
              variant="primary"
              onClick={() => {
                playSparkle();
                markSent(schedule.id);
                announce("sent", contact?.name ?? "");
                setTab("journal");
              }}
            >
              {t("agenda.confirm")}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              {t("agenda.sent")}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="quiet" onClick={() => beginEdit(schedule.id)}>
            <Pencil className="size-4" aria-hidden />
            {t("agenda.edit")}
          </Button>
          <RemoveButton onRemove={() => removeSchedule(schedule.id)} />
        </div>
      </div>
      <div className="mt-4">
        <Letter
          name={contact.name}
          body={schedule.body}
          image={schedule.image}
          onRemoveImage={() => clearImage(schedule.id)}
          extra={
            schedule.video || schedule.voice ? (
              <>
                {schedule.video ? <VideoExtra id={schedule.video} onRemove={() => clearVideo(schedule.id)} /> : null}
                {schedule.voice ? <VoiceLine id={schedule.voice} style={schedule.voiceStyle} onRemove={() => clearVoice(schedule.id)} /> : null}
              </>
            ) : undefined
          }
          footer={schedule.repeat === "yearly" ? t("agenda.reschedule") : undefined}
          signature={signature}
        />
        {simple ? null : (
          <div className="mt-4">
            <TranslateBar text={schedule.body} onTranslated={(body) => replaceBody(schedule.id, body)} />
          </div>
        )}
      </div>
    </article>
  );
}

function OpenLater({ schedule }: { schedule: Schedule }) {
  const t = useT();
  const contact = useBonMoment((state) => state.contacts.find((item) => item.id === schedule.contactId));
  const fests = useBonMoment((state) => state.fests ?? []);
  const signature = usedSignature(useBonMoment((state) => state.settings));
  const markSent = useBonMoment((state) => state.markSent);
  const setTab = useBonMoment((state) => state.setTab);
  const [note, setNote] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const label = fests.find((item) => item.id === schedule.festId)?.title ?? occasionLabel(schedule.occasion);

  function open() {
    if (!contact) return;
    const href = messageHref(schedule.channel, contact, schedule.body, label, signature);
    if (!href) {
      setNote(schedule.channel === "email" ? t("agenda.needEmail") : t("agenda.needPhone"));
      return;
    }
    const result = launchHref(schedule.channel, href);
    setNote(result === "opened" ? t("agenda.opened", { where: channelLabel(schedule.channel) }) : t("agenda.notOpened"));
    if (result === "opened") setConfirm(true);
  }

  return (
    <>
      <Button variant="primary" onClick={open}>
        {openLabel(schedule.channel)}
      </Button>
      {confirm ? (
        <Button
          variant="primary"
          onClick={() => {
            playSparkle();
            markSent(schedule.id);
            announce("sent", contact?.name ?? "");
            setTab("journal");
          }}
        >
          {t("agenda.confirm")}
        </Button>
      ) : (
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          {t("agenda.sent")}
        </Button>
      )}
      {note ? <p className="basis-full text-sm text-muted">{note}</p> : null}
    </>
  );
}

export function RemoveButton({ onRemove }: { onRemove: () => void }) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{t("agenda.removeAsk")}</span>
        <Button
          variant="primary"
          onClick={() => {
            playTick();
            onRemove();
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          {t("agenda.remove")}
        </Button>
        <Button variant="ghost" onClick={() => setConfirm(false)}>
          {t("agenda.cancel")}
        </Button>
      </div>
    );
  }
  return (
    <Button variant="quiet" onClick={() => setConfirm(true)}>
      <Trash2 className="size-4" aria-hidden />
      {t("agenda.remove")}
    </Button>
  );
}
