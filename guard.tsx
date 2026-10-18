import { useEffect, useRef, useState, type ReactNode } from "react";
import { askBio, askDeviceFinger, canUseBio, hashPin, holdLock, isHeld, newSalt, registerBio, releaseLock, subscribeLock } from "@/lib/bonmoment/lock";
import { nativeSend } from "@/lib/bonmoment/message";
import { playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import { isLocale } from "@/lib/bonmoment/i18n";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { Button, Field, fieldClass } from "./ui";

const LOCK_NOTE: Record<"ok" | "mismatch" | "short" | "weak" | "bio" | "bioNo", MessageKey> = {
  ok: "lock.note.ok",
  mismatch: "lock.note.mismatch",
  short: "lock.note.short",
  weak: "lock.weak",
  bio: "lock.note.bio",
  bioNo: "lock.note.bioNo",
};

const BACKUP_NOTE: Record<"out" | "in" | "bad", MessageKey> = {
  out: "backup.note.out",
  in: "backup.note.in",
  bad: "backup.note.bad",
};

export function LockGate({ children }: { children: ReactNode }) {
  const lockOn = useBonMoment((state) => state.settings.lockOn === true);
  const pinHash = useBonMoment((state) => state.settings.pinHash ?? "");
  const bioId = useBonMoment((state) => state.settings.bioId ?? "");
  const locked = lockOn && (pinHash.length > 0 || bioId.length > 0);
  const passed = useRef(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    nativeSend()?.secure?.(locked);
    return () => nativeSend()?.secure?.(false);
  }, [locked]);

  useEffect(() => subscribeLock(() => {
    if (isHeld()) {
      passed.current = false;
      setOpen(false);
    }
  }), []);

  useEffect(() => {
    if (!locked) {
      setOpen(true);
      return;
    }
    if (!passed.current) setOpen(false);
  }, [locked]);

  useEffect(() => {
    if (!locked) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") holdLock();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [locked]);

  if (!locked || open) return children;
  return (
    <LockScreen
      onUnlock={() => {
        passed.current = true;
        releaseLock();
        setOpen(true);
      }}
    />
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const;

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const t = useT();
  const salt = useBonMoment((state) => state.settings.pinSalt ?? "");
  const pinHash = useBonMoment((state) => state.settings.pinHash ?? "");
  const bioId = useBonMoment((state) => state.settings.bioId ?? "");
  const setSettings = useBonMoment((state) => state.setSettings);
  const [pin, setPin] = useState("");
  const [bad, setBad] = useState(false);
  const [bioNote, setBioNote] = useState(false);

  async function tryPin(next: string) {
    if (next.length < 4) return;
    const hash = await hashPin(next, salt);
    if (hash === pinHash) {
      setBad(false);
      onUnlock();
      return;
    }
    setBad(true);
    setPin("");
  }

  function press(key: string) {
    playTick();
    setBad(false);
    if (key === "⌫") {
      setPin((value) => value.slice(0, -1));
      return;
    }
    if (!key || pin.length >= 4) return;
    const next = `${pin}${key}`;
    setPin(next);
    void tryPin(next);
  }

  async function bio() {
    playTick();
    setBioNote(false);
    if (bioId === "device" || (!bioId && canUseBio())) {
      const native = await askDeviceFinger();
      if (native === true) {
        if (!bioId) setSettings({ bioId: "device", lockOn: true });
        onUnlock();
        return;
      }
      if (native === false) {
        setBad(true);
        return;
      }
    }
    if (!canUseBio()) {
      setBioNote(true);
      return;
    }
    let id = bioId === "device" ? "" : bioId;
    if (!id) {
      try {
        id = (await registerBio()) ?? "";
      } catch {
        id = "";
      }
      if (!id) {
        setBioNote(true);
        return;
      }
      setSettings({ bioId: id, lockOn: true });
    }
    const ok = await askBio(id);
    if (ok) onUnlock();
    else setBad(true);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 text-ink">
      <div className="w-full max-w-xs rounded-3xl border border-line bg-surface p-5 text-center">
        <h1 className="text-3xl">{t("lock.title")}</h1>
        <p className="mt-2 text-sm text-muted">{pinHash ? t("lock.hint") : t("lock.bioLead")}</p>
        {pinHash ? (
        <p className="mt-4 flex justify-center gap-3" aria-label={t("lock.pin")}>
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={index < pin.length ? "size-3 rounded-full bg-ink" : "size-3 rounded-full border border-ink"} />
          ))}
        </p>
        ) : null}
        {bad ? <p className="mt-3 text-sm text-wax">{t("lock.bad")}</p> : null}
        {bioNote ? <p className="mt-3 text-sm text-muted">{t("lock.note.bioNo")}</p> : null}
        <Button variant="primary" className="mt-4 w-full" type="button" onClick={() => void bio()}>
          {t("lock.finger")}
        </Button>
        {pinHash ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {KEYS.map((key) =>
            key === "" ? (
              <span key="gap" />
            ) : (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                className="h-14 rounded-2xl border border-line bg-paper text-xl font-medium text-ink"
              >
                {key}
              </button>
            ),
          )}
        </div>
        ) : null}
      </div>
    </div>
  );
}

export function LockButton({ onMissing }: { onMissing: () => void }) {
  const t = useT();
  const on = useBonMoment((state) => state.settings.lockOn === true && (Boolean(state.settings.pinHash) || Boolean(state.settings.bioId)));
  return (
    <button
      type="button"
      aria-label={t("lock.now")}
      onClick={() => {
        playTick();
        if (on) holdLock();
        else onMissing();
      }}
      className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-lg text-ink"
    >
      <span aria-hidden>{on ? "🔒" : "🔓"}</span>
    </button>
  );
}

export function LockPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [note, setNote] = useState<"ok" | "mismatch" | "short" | "weak" | "bio" | "bioNo" | null>(null);
  const on = settings.lockOn === true && Boolean(settings.pinHash);

  async function save() {
    if (pin.length < 4) {
      setNote("short");
      return;
    }
    if (pin[0] === pin[1] && pin[1] === pin[2] && pin[2] === pin[3]) {
      setNote("weak");
      return;
    }
    if (pin === "1234" || pin === "4321" || pin === "2580" || pin === "0852" || pin === "1212" || pin === "0123") {
      setNote("weak");
      return;
    }
    if (pin !== again) {
      setNote("mismatch");
      return;
    }
    const salt = newSalt();
    const pinHash = await hashPin(pin, salt);
    setSettings({ lockOn: true, pinSalt: salt, pinHash });
    setPin("");
    setAgain("");
    setNote("ok");
    playTick();
    holdLock();
  }

  async function bio() {
    playTick();
    const native = await askDeviceFinger();
    if (native === true) {
      setSettings({ bioId: "device", lockOn: true });
      setNote("bio");
      return;
    }
    if (native === false) {
      setNote("bioNo");
      return;
    }
    try {
      const id = await registerBio();
      if (!id) {
        setNote("bioNo");
        return;
      }
      setSettings({ bioId: id, lockOn: true });
      setNote("bio");
    } catch {
      setNote("bioNo");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("lock.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("lock.panel")}</p>
      </div>
      {on ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" className="self-start" onClick={() => holdLock()}>
            {t("lock.now")}
          </Button>
          <Button
            variant="quiet"
            className="self-start"
            onClick={() => {
              playTick();
              setSettings({ lockOn: false, pinHash: "", pinSalt: "", bioId: "" });
              setNote(null);
            }}
          >
            {t("lock.off")}
          </Button>
        </div>
      ) : (
        <>
          <Field label={t("lock.pin")}>
            <input
              className={fieldClass}
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </Field>
          <Field label={t("lock.again")}>
            <input
              className={fieldClass}
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={again}
              onChange={(event) => setAgain(event.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </Field>
          <Button variant="primary" className="self-start" onClick={() => void save()}>
            {t("lock.save")}
          </Button>
        </>
      )}
      <div className="rounded-2xl border border-line bg-paper p-3">
        <p className="font-medium text-ink">{t("lock.finger")}</p>
        <p className="mt-1 text-sm text-muted">{t("lock.bioLead")}</p>
        <Button
          variant={settings.bioId ? "quiet" : "primary"}
          className="mt-3 self-start"
          onClick={() => {
            if (!canUseBio()) {
              setNote("bioNo");
              return;
            }
            void bio();
          }}
        >
          {settings.bioId ? t("lock.bioOn") : t("lock.finger")}
        </Button>
      </div>
      {note ? <p className="text-sm text-muted">{t(LOCK_NOTE[note])}</p> : null}
    </div>
  );
}

export function BackupPanel() {
  const t = useT();
  const [note, setNote] = useState<"out" | "in" | "bad" | null>(null);

  function download() {
    playTick();
    const state = useBonMoment.getState();
    const settings = { ...state.settings };
    delete settings.gatewayKey;
    delete settings.pinHash;
    delete settings.pinSalt;
    delete settings.bioId;
    settings.lockOn = false;
    const file = {
      app: "bonmoment",
      version: 1,
      contacts: state.contacts,
      schedules: state.schedules,
      templates: state.templates,
      locale: state.locale,
      settings,
    };
    const blob = new Blob([JSON.stringify(file)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "au-bon-moment.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setNote("out");
  }

  function restore(file: File) {
    void file.text().then((raw) => {
      try {
        const data = JSON.parse(raw) as {
          app?: string;
          contacts?: unknown;
          schedules?: unknown;
          templates?: unknown;
          settings?: Record<string, unknown>;
          locale?: string;
        };
        if (data.app !== "bonmoment" || !Array.isArray(data.contacts) || !Array.isArray(data.schedules)) {
          setNote("bad");
          return;
        }
        const current = useBonMoment.getState();
        useBonMoment.setState({
          contacts: data.contacts as typeof current.contacts,
          schedules: data.schedules as typeof current.schedules,
          templates: Array.isArray(data.templates) ? (data.templates as typeof current.templates) : current.templates,
          settings: data.settings
            ? {
                ...current.settings,
                ...data.settings,
                gatewayKey: current.settings.gatewayKey,
                pinHash: current.settings.pinHash,
                pinSalt: current.settings.pinSalt,
                bioId: current.settings.bioId,
                lockOn: current.settings.lockOn,
              }
            : current.settings,
          locale: typeof data.locale === "string" && isLocale(data.locale) ? data.locale : current.locale,
          initialized: true,
        });
        setNote("in");
        playTick();
      } catch {
        setNote("bad");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("backup.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("backup.hint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={download}>
          {t("backup.out")}
        </Button>
        <label className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink">
          {t("backup.in")}
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) restore(file);
            }}
          />
        </label>
      </div>
      {note ? <p className="text-sm text-muted">{t(BACKUP_NOTE[note])}</p> : null}
    </div>
  );
}
