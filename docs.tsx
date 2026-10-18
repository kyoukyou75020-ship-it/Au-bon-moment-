import { useRef, useState } from "react";
import { CHANNELS, channelLabel } from "@/lib/bonmoment/occasions";
import { dropPdf, handPdf, planOf, readPdfFile, savePdf } from "@/lib/bonmoment/docs";
import { mailInboxUrl, mailLoginUrl, openOutside } from "@/lib/bonmoment/message";
import { requestPlan } from "./plan";
import { playChime, playTick } from "@/lib/bonmoment/sound";
import { isProUser, useBonMoment } from "@/lib/bonmoment/store";
import type { DocItem, DocStatus, MailLink, MailProvider, MailServers } from "@/lib/bonmoment/types";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { Button, Field, fieldClass } from "./ui";

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const SERVERS: Record<MailProvider, MailServers> = {
  gmail: { smtpHost: "smtp.gmail.com", smtpPort: "587", imapHost: "imap.gmail.com", imapPort: "993", tls: true },
  outlook: { smtpHost: "smtp-mail.outlook.com", smtpPort: "587", imapHost: "outlook.office365.com", imapPort: "993", tls: true },
  yahoo: { smtpHost: "smtp.mail.yahoo.com", smtpPort: "587", imapHost: "imap.mail.yahoo.com", imapPort: "993", tls: true },
  icloud: { smtpHost: "smtp.mail.me.com", smtpPort: "587", imapHost: "imap.mail.me.com", imapPort: "993", tls: true },
  other: { smtpHost: "", smtpPort: "587", imapHost: "", imapPort: "993", tls: true },
};

function freshId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `pdf-${Date.now().toString(36)}`;
}

function statusKey(status: DocStatus) {
  if (status === "waiting") return "docs.waiting" as const;
  if (status === "sent") return "docs.sent" as const;
  if (status === "planned") return "docs.planned" as const;
  return "docs.detected" as const;
}

export function DocsPanel() {
  const t = useT();
  const mail = useBonMoment((state) => state.mail);
  const plan = planOf(useBonMoment((state) => state.docPlan));
  const docs = useBonMoment((state) => state.docs ?? []);
  const contacts = useBonMoment((state) => state.contacts);
  const pro = isProUser(useBonMoment((state) => state.settings));
  const savedServers = useBonMoment((state) => state.settings.mailServers);
  const [open, setOpen] = useState(false);
  const [serversOpen, setServersOpen] = useState(false);
  const [servers, setServers] = useState<MailServers>(SERVERS.gmail);
  const [provider, setProvider] = useState<MailLink["provider"]>("gmail");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function savePlan(patch: Partial<typeof plan>) {
    useBonMoment.setState({ docPlan: { ...planOf(useBonMoment.getState().docPlan), ...patch } });
  }

  function allow() {
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setNote(t("docs.needMail"));
      return;
    }
    const url = mailLoginUrl(provider);
    if (url.startsWith("https://")) openOutside(url);
    useBonMoment.setState({
      mail: { provider, email: address, at: new Date().toISOString(), live: true },
    });
    setOpen(false);
    setNote(null);
    playChime();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const kept = (useBonMoment.getState().docs ?? []).filter((item) => item.status !== "sent");
    if (!pro && kept.length >= 1) {
      requestPlan();
      setNote(t("errors.limit"));
      return;
    }
    const read = await readPdfFile(file);
    if (!read) {
      setNote(t("docs.bad"));
      return;
    }
    const id = freshId();
    await savePdf(id, read.blob);
    const item: DocItem = {
      id,
      name: read.name,
      bytes: read.blob.size,
      at: new Date().toISOString(),
      status: plan.contactId ? "planned" : "detected",
    };
    useBonMoment.setState({ docs: [item, ...(useBonMoment.getState().docs ?? [])].slice(0, 12) });
    setNote(null);
    playTick();
  }

  async function send(doc: DocItem) {
    const current = planOf(useBonMoment.getState().docPlan);
    const person = contacts.find((item) => item.id === current.contactId);
    if (!person) {
      setNote(t("docs.whoEmpty"));
      return;
    }
    playTick();
    const result = await handPdf(doc, person, current.channel, `Document : ${doc.name}`);
    if (result === "missing") {
      setNote(t("docs.missing"));
      return;
    }
    const body = `Document : ${doc.name}`;
    useBonMoment.setState({
      docs: (useBonMoment.getState().docs ?? []).map((item) => (item.id === doc.id ? { ...item, status: "sent" } : item)),
      logs: [
        {
          id: freshId(),
          scheduleId: doc.id,
          contactName: person.name,
          occasion: "autre",
          channel: current.channel,
          body,
          sentAt: new Date().toISOString(),
          fileName: doc.name,
        },
        ...useBonMoment.getState().logs,
      ],
    });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Au bon moment", { body: `${doc.name} est parti pour ${person.name}.` });
      } catch {
        /* alert blocked */
      }
    }
    setNote(result === "opened" ? t("docs.opened") : t("docs.done"));
    playChime();
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{t("docs.lead")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={pro ? "primary" : "quiet"}
          className={pro ? undefined : "opacity-60"}
          onClick={() => {
            playTick();
            if (!pro) {
              requestPlan();
              return;
            }
            setOpen((value) => !value);
          }}
        >
          {t("docs.link")}
        </Button>
        {!pro ? (
          <button type="button" onClick={requestPlan} className="rounded-full bg-wax px-2 py-0.5 text-xs font-medium tracking-wide text-onwax">
            {t("plan.badge")}
          </button>
        ) : null}
        <span className="inline-flex items-center gap-2 text-sm text-ink">
          <span className={`size-3 rounded-full ${mail ? "bg-emerald-500" : "bg-line"}`} aria-hidden />
          {mail ? `${mail.email} · ${t("docs.linked")}` : t("docs.off")}
        </span>
      </div>
      {mail ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="quiet"
            onClick={() => {
              playTick();
              const url = mailInboxUrl(mail.provider);
              openOutside(url || `mailto:${mail.email}`);
            }}
          >
            {t("docs.open")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              playTick();
              useBonMoment.setState({ mail: null });
            }}
          >
            {t("docs.unlink")}
          </Button>
        </div>
      ) : null}
      {mail?.provider === "other" && !open ? <p className="text-sm text-muted">{t("docs.otherHint")}</p> : null}
      {open ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-3">
          <p className="text-sm font-medium text-ink">{t("docs.provider")}</p>
          <div className="flex flex-wrap gap-2">
            {(["gmail", "outlook", "yahoo", "icloud", "other"] as const).map((item) => (
              <Button key={item} variant={provider === item ? "primary" : "quiet"} onClick={() => setProvider(item)}>
                {t(`docs.${item}`)}
              </Button>
            ))}
          </div>
          {provider === "other" ? <p className="text-sm text-muted">{t("docs.otherHint")}</p> : null}
          <Field label={t("docs.address")}>
            <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="moi@email.fr" />
          </Field>
          <Button variant="primary" className="self-start" onClick={allow}>
            {t("docs.allow")}
          </Button>
        </div>
      ) : null}
      <p className="text-sm text-muted">{t("docs.hint")}</p>
      <p className="text-sm text-muted">{t("docs.oauth")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="quiet"
          className={pro ? undefined : "opacity-60"}
          onClick={() => {
            playTick();
            if (!pro) {
              requestPlan();
              return;
            }
            setServers(savedServers?.smtpHost || savedServers?.imapHost ? savedServers : SERVERS[mail?.provider ?? provider]);
            setServersOpen((value) => !value);
          }}
        >
          {t("docs.servers")}
        </Button>
        {!pro ? (
          <button type="button" onClick={requestPlan} className="rounded-full bg-wax px-2 py-0.5 text-xs font-medium tracking-wide text-onwax">
            {t("plan.badge")}
          </button>
        ) : null}
      </div>
      {serversOpen && pro ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-3">
          <p className="text-sm text-muted">{t("docs.serversLead")}</p>
          <Field label={t("docs.smtp")}>
            <input className={fieldClass} value={servers.smtpHost} autoComplete="off" placeholder="smtp.exemple.fr" onChange={(event) => setServers({ ...servers, smtpHost: event.target.value })} />
          </Field>
          <Field label={t("docs.port")}>
            <input className={fieldClass} inputMode="numeric" value={servers.smtpPort} onChange={(event) => setServers({ ...servers, smtpPort: event.target.value.replace(/\D/g, "").slice(0, 5) })} />
          </Field>
          <Field label={t("docs.imap")}>
            <input className={fieldClass} value={servers.imapHost} autoComplete="off" placeholder="imap.exemple.fr" onChange={(event) => setServers({ ...servers, imapHost: event.target.value })} />
          </Field>
          <Field label={t("docs.port")}>
            <input className={fieldClass} inputMode="numeric" value={servers.imapPort} onChange={(event) => setServers({ ...servers, imapPort: event.target.value.replace(/\D/g, "").slice(0, 5) })} />
          </Field>
          <label className="flex items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={servers.tls} onChange={(event) => setServers({ ...servers, tls: event.target.checked })} />
            {t("docs.tls")}
          </label>
          <Button
            variant="primary"
            className="self-start"
            onClick={() => {
              playTick();
              useBonMoment.getState().setSettings({
                mailServers: {
                  smtpHost: servers.smtpHost.trim().slice(0, 120),
                  smtpPort: servers.smtpPort || "587",
                  imapHost: servers.imapHost.trim().slice(0, 120),
                  imapPort: servers.imapPort || "993",
                  tls: servers.tls,
                },
              });
              setNote(t("docs.serversSaved"));
              setServersOpen(false);
            }}
          >
            {t("docs.allow")}
          </Button>
        </div>
      ) : null}
      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" checked={plan.watchPdf} onChange={(event) => savePlan({ watchPdf: event.target.checked })} />
        {t("docs.watch")}
      </label>
      <Field label={t("docs.who")}>
        <select className={fieldClass} value={plan.contactId} onChange={(event) => savePlan({ contactId: event.target.value, lastSlot: "" })}>
          <option value="">{t("docs.whoEmpty")}</option>
          {contacts.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("docs.channel")}>
        <select className={fieldClass} value={plan.channel} onChange={(event) => savePlan({ channel: event.target.value as typeof plan.channel })}>
          {CHANNELS.map((item) => (
            <option key={item.id} value={item.id}>
              {channelLabel(item.id)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("docs.every")}>
        <select className={fieldClass} value={plan.every} onChange={(event) => savePlan({ every: event.target.value as typeof plan.every, lastSlot: "" })}>
          <option value="day">{t("docs.day")}</option>
          <option value="week">{t("docs.week")}</option>
          <option value="once">{t("docs.once")}</option>
        </select>
      </Field>
      {plan.every === "week" ? (
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <Button key={day} variant={plan.weekday === day ? "primary" : "quiet"} onClick={() => savePlan({ weekday: day, lastSlot: "" })}>
              {t(`docs.d${day}` as MessageKey)}
            </Button>
          ))}
        </div>
      ) : null}
      {plan.every === "once" ? (
        <Field label={t("docs.date")}>
          <input className={fieldClass} type="date" value={plan.date} onChange={(event) => savePlan({ date: event.target.value, lastSlot: "" })} />
        </Field>
      ) : null}
      <Field label={t("docs.time")}>
        <input
          className={fieldClass}
          type="time"
          value={plan.time}
          onChange={(event) => {
            if (/^\d{2}:\d{2}$/.test(event.target.value)) savePlan({ time: event.target.value, lastSlot: "" });
          }}
        />
      </Field>
      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" checked={plan.ask} onChange={(event) => savePlan({ ask: event.target.checked })} />
        {t("docs.ask")}
      </label>
      {plan.ask ? null : <p className="text-sm text-muted">{t("docs.auto")}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button variant="quiet" className="self-start" onClick={() => fileRef.current?.click()}>
        {t("docs.add")}
      </Button>
      {note ? <p className="text-sm text-muted">{note}</p> : null}
      {docs.length === 0 ? (
        <p className="text-sm text-muted">{t("docs.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {docs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
                <p className="text-xs text-muted">{t(statusKey(doc.status))}</p>
              </div>
              <div className="flex gap-2">
                {doc.status !== "sent" ? (
                  <Button variant="primary" onClick={() => void send(doc)}>
                    {t(plan.ask ? "docs.validate" : "docs.send")}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => {
                    void dropPdf(doc.id);
                    useBonMoment.setState({ docs: (useBonMoment.getState().docs ?? []).filter((item) => item.id !== doc.id) });
                  }}
                >
                  {t("docs.remove")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
