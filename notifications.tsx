import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { currentWho } from "@/lib/bonmoment/account";
import { translate } from "@/lib/bonmoment/i18n";
import { launchHref, shareSheet } from "@/lib/bonmoment/message";
import { occasionLabel } from "@/lib/bonmoment/occasions";
import { comingSoon } from "@/lib/bonmoment/soon";
import { playPage, playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button } from "./ui";

export function announce(kind: "sent" | "got", name: string) {
  const { settings, locale } = useBonMoment.getState();
  const text = translate(locale, kind === "sent" ? "notify.sent" : "notify.got", { name });
  pingSent(text);
  const who = currentWho();
  const by = settings.tellBy ?? "none";
  if (by === "mail" && who?.email) {
    const href = `mailto:${encodeURIComponent(who.email)}?subject=${encodeURIComponent("Au bon moment")}&body=${encodeURIComponent(text)}`;
    launchHref("email", href);
    return;
  }
  if (by === "sms" && who?.phone) {
    const href = `sms:${who.phone}?body=${encodeURIComponent(text)}`;
    launchHref("sms", href);
    return;
  }
  if (by === "social") {
    if (shareSheet(text)) return;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      void navigator.share({ title: "Au bon moment", text }).catch(() => undefined);
    }
  }
}

export function pingSent(text: string) {
  if (useBonMoment.getState().settings.notify === false) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification("Au bon moment", { body: text });
  } catch {
    /* the in-app list still shows it */
  }
}

export async function previewAlert(text: string): Promise<"shown" | "need" | "here"> {
  if (typeof Notification === "undefined") return "here";
  try {
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") return "need";
    new Notification("Au bon moment", { body: text });
    return "shown";
  } catch {
    return "here";
  }
}

export function AlertTry() {
  const t = useT();
  const [note, setNote] = useState<"shown" | "need" | "here" | null>(null);
  const [open, setOpen] = useState(false);

  async function go() {
    playTick();
    const result = await previewAlert(t("alert.sample"));
    setNote(result);
    setOpen(true);
    window.setTimeout(() => setOpen(false), 6500);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="quiet" onClick={() => void go()}>
        <Bell className="size-4" aria-hidden />
        {t("alert.try")}
      </Button>
      {note ? <p className="text-sm text-muted">{t(note === "shown" ? "alert.shown" : note === "need" ? "alert.need" : "alert.here")}</p> : null}
      {open ? <AlertCard text={t("alert.sample")} title={t("alert.app")} /> : null}
    </div>
  );
}

function AlertCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-line bg-paper p-3 text-ink shadow-lift" role="status">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-wax text-sm font-medium text-onwax">B</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted">{text}</span>
      </span>
    </div>
  );
}

export function NotificationBox() {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [perm, setPerm] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const contacts = useBonMoment((state) => state.contacts);
  const schedules = useBonMoment((state) => state.schedules);
  const templates = useBonMoment((state) => state.templates);
  const clockSynced = useBonMoment((state) => state.clockSynced);
  const beginEdit = useBonMoment((state) => state.beginEdit);
  const beginNew = useBonMoment((state) => state.beginNew);
  const logs = useBonMoment((state) => state.logs);
  const setTab = useBonMoment((state) => state.setTab);
  const due = schedules.filter((item) => item.status === "due");
  const soon = clockSynced ? comingSoon(contacts, schedules).filter((item) => item.days <= 30) : [];
  const sent = logs.slice(0, 3);
  const count = due.length + soon.length + sent.length;

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      const target = event.target as Node;
      if (root.current?.contains(target) || panel.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(event: { currentTarget: HTMLElement }) {
    playTick();
    const rect = event.currentTarget.getBoundingClientRect();
    const openAbove = window.innerHeight - rect.bottom < 260;
    const right = Math.max(8, window.innerWidth - rect.right);
    setPlace(
      openAbove
        ? { bottom: window.innerHeight - rect.top + 8, right }
        : { top: rect.bottom + 8, right },
    );
    setOpen((value) => !value);
  }

  async function enable() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPerm(result);
  }

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={toggle}
        aria-label={t("notify.title")}
        aria-expanded={open}
        className="relative inline-flex size-11 items-center justify-center rounded-2xl border border-line bg-surface text-ink"
      >
        <Bell className="size-4" aria-hidden />
        {count > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-wax px-1 text-[10px] leading-none text-onwax tabular-nums">
            {count}
          </span>
        ) : null}
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              className="sheet-in fixed z-50 flex max-h-[min(24rem,calc(100dvh-6rem))] w-64 max-w-[calc(100vw-1rem)] flex-col gap-2 overflow-y-auto rounded-3xl border border-line bg-surface p-3 shadow-lift"
              style={place ?? undefined}
            >
              <p className="px-1 font-medium text-ink">{t("notify.title")}</p>
              {count === 0 ? <p className="px-1 text-sm text-muted">{t("notify.empty")}</p> : null}
              {due.map((item) => {
                const contact = contacts.find((person) => person.id === item.contactId);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="rounded-2xl bg-paper px-3 py-2 text-left"
                    onClick={() => {
                      playPage();
                      setOpen(false);
                      beginEdit(item.id);
                    }}
                  >
                    <span className="block text-sm font-medium text-ink">{contact?.name ?? occasionLabel(item.occasion)}</span>
                    <span className="block text-xs text-wax">{t("agenda.due")}</span>
                  </button>
                );
              })}
              {soon.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="rounded-2xl bg-paper px-3 py-2 text-left"
                  onClick={() => {
                    playPage();
                    setOpen(false);
                    const template = templates.find((entry) => entry.occasion === item.occasion);
                    beginNew({
                      occasion: item.occasion,
                      contactId: item.contactId ?? "",
                      date: item.date,
                      templateId: template?.id ?? null,
                      body: template?.body ?? "",
                      repeat: "yearly",
                    });
                  }}
                >
                  <span className="block text-sm font-medium text-ink">{item.title || occasionLabel(item.occasion)}</span>
                  <span className="block text-xs text-muted">
                    {item.days <= 0 ? t("soon.today") : item.days === 1 ? t("soon.tomorrow") : t("soon.days", { count: item.days })}
                  </span>
                </button>
              ))}
              {sent.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-2xl bg-paper px-3 py-2 text-left"
                  onClick={() => {
                    playPage();
                    setOpen(false);
                    setTab("journal");
                  }}
                >
                  <span className="block text-sm font-medium text-ink">{t("notify.sent", { name: item.contactName })}</span>
                  <span className="block text-xs text-muted">{t("notify.left")}</span>
                </button>
              ))}
              {sent.length > 0 ? <p className="px-1 text-xs text-muted">{t("help.4")}</p> : null}
              {perm === "default" ? (
                <Button variant="quiet" onClick={() => void enable()}>
                  {t("notify.enable")}
                </Button>
              ) : null}
              {perm === "granted" ? <p className="px-1 text-xs text-muted">{t("notify.on")}</p> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
