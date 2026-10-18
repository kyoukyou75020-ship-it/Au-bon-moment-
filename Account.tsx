 import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { authClient, authEnabled, signIn } from "@/lib/auth/client";
import { checkCode, currentWho, freshId, peekCode, restoreMagic, saveWho, sendCode, type Who } from "@/lib/bonmoment/account";
import { playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button, fieldClass } from "./ui";
import { Intro, introDue } from "./intro";

const COUNTRIES = [
  { id: "FR", dial: "+33" },
  { id: "BE", dial: "+32" },
  { id: "CH", dial: "+41" },
  { id: "ES", dial: "+34" },
  { id: "IT", dial: "+39" },
  { id: "DE", dial: "+49" },
  { id: "PT", dial: "+351" },
  { id: "GB", dial: "+44" },
  { id: "MA", dial: "+212" },
  { id: "DZ", dial: "+213" },
  { id: "TN", dial: "+216" },
  { id: "CA", dial: "+1" },
];

function mailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function guestPerson(): Who {
  return { id: freshId(), name: "", email: "", phone: "", provider: "guest", pro: false };
}

export function AccountGate({ children, enterNow = false }: { children: ReactNode; enterNow?: boolean }) {
  const [who, setWho] = useState<Who | null>(() => currentWho() ?? (enterNow ? guestPerson() : null));
  const [intro, setIntro] = useState(() => useBonMoment.getState().settings.introOff !== true && introDue());
  useEffect(() => {
    const apply = () => {
      if (useBonMoment.getState().settings.introOff === true) {
        setIntro(false);
        return;
      }
      const every = useBonMoment.getState().settings.introEvery === true;
      if (every || introDue()) setIntro(true);
    };
    if (useBonMoment.persist.hasHydrated()) apply();
    return useBonMoment.persist.onFinishHydration(apply);
  }, []);
  useEffect(() => {
    const refresh = () => setWho(currentWho());
    window.addEventListener("bonmoment-who", refresh);
    return () => window.removeEventListener("bonmoment-who", refresh);
  }, []);
  useEffect(() => {
    const invited = enterNow || new URLSearchParams(window.location.search).has("entrer");
    if (!invited) return;
    if (!currentWho()) {
      try {
        setWho(saveWho(guestPerson()));
      } catch {
        setWho(guestPerson());
      }
    }
    document.getElementById("entrer-wait")?.remove();
  }, [enterNow]);
  if (!who) return <AccountScreen onDone={(person) => { setWho(person); setIntro(useBonMoment.getState().settings.introOff !== true); }} />;
  if (intro) return <Intro onDone={() => setIntro(false)} />;
  return <>{children}</>;
}

export function AccountScreen({ onDone }: { onDone: (who: Who) => void }) {
  const t = useT();
  const setSettings = useBonMoment((state) => state.setSettings);
  const gateway = useBonMoment((state) => state.settings.gateway === true);
  const gatewayKey = useBonMoment((state) => state.settings.gatewayKey ?? "");
  const gatewayUrl = useBonMoment((state) => state.settings.gatewayUrl ?? "");
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("+33");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [step, setStep] = useState<"form" | "code">("form");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [local, setLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const target = mode === "email" ? email.trim().toLowerCase() : `${dial}${phone.replace(/\D/g, "")}`;

  function enter(next: Who) {
    let saved = next;
    try {
      saved = saveWho(next);
    } catch {
      saved = next;
    }
    if (saved.pro) setSettings({ plan: "pro", planSource: "play" });
    onDone(saved);
  }

  async function ask() {
    if (name.trim().length < 2) {
      setNote(t("auth.needName"));
      return;
    }
    if (!terms) {
      setNote(t("auth.needTerms"));
      return;
    }
    if (mode === "email" && !mailOk(email)) {
      setNote(t("auth.needMail"));
      return;
    }
    if (mode === "phone" && phone.replace(/\D/g, "").length < 8) {
      setNote(t("auth.needPhone"));
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const delivery = await sendCode(target, {
        key: gateway ? gatewayKey : "",
        url: gatewayUrl,
        phone: mode === "phone",
      });
      setStep("code");
      setLocal(delivery !== "sent");
      if (delivery === "sent") {
        setNote(t("auth.sent"));
      } else {
        setCode(peekCode());
        setNote(t("auth.local"));
      }
    } catch {
      setNote(t("auth.fail"));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(typed = code) {
    setBusy(true);
    try {
      const ok = await checkCode(target, typed);
      if (!ok) {
        setNote(t("auth.badCode"));
        return;
      }
      enter({
        id: freshId(),
        name: name.trim(),
        email: mode === "email" ? target : "",
        phone: mode === "phone" ? target : "",
        provider: mode,
        pro: false,
      });
    } catch {
      setNote(t("auth.fail"));
    } finally {
      setBusy(false);
    }
  }

  function enterNamed(provider: "google" | "apple") {
    const found = email.trim().toLowerCase();
    enter({
      id: freshId(),
      name: name.trim() || (found.includes("@") ? found.split("@")[0] : "Toi"),
      email: mailOk(found) ? found : "",
      phone: "",
      provider,
      pro: false,
    });
  }

  async function social(provider: "google" | "apple") {
    playTick();
    if (!terms) {
      setNote(t("auth.needTerms"));
      return;
    }
    if (!authEnabled) {
      setNote(provider === "google" ? t("auth.googleWait") : t("auth.appleWait"));
      enterNamed(provider);
      return;
    }
    try {
      await signIn(provider === "google" ? "grok-google" : "grok-apple");
      const session = await authClient.getSession();
      const user = session.data?.user;
      const found = user?.email?.trim().toLowerCase() ?? "";
      if (!found) {
        setNote(t("auth.fail"));
        enterNamed(provider);
        return;
      }
      enter({
        id: user?.id || freshId(),
        name: user?.name?.trim() || name.trim() || found.split("@")[0],
        email: found,
        phone: "",
        provider,
        pro: false,
      });
    } catch {
      setNote(provider === "apple" ? t("auth.appleWait") : t("auth.fail"));
      enterNamed(provider);
    }
  }

  function goIn(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    try {
      playTick();
    } catch {
      /* the sound can wait */
    }
    enter(guestPerson());
  }

  function restore() {
    playTick();
    if (restoreMagic()) {
      setSettings({ plan: "pro", planSource: "play" });
      setNote(t("auth.restored"));
      return;
    }
    setNote(t("auth.restoreNone"));
  }

  const trial = step === "code" ? peekCode() : "";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 bg-paper px-5 py-10 text-ink">
      <div>
        <p className="text-sm font-medium tracking-wide text-brass uppercase">{t("auth.kicker")}</p>
        <h1 className="mt-1 font-serif text-4xl">{t("auth.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("auth.lead")}</p>
      </div>
      <p className="text-center text-sm text-muted">{t("auth.orAccount")}</p>
      <div className="flex gap-2">
        {(["email", "phone"] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => {
              setMode(id);
              setStep("form");
              setNote("");
            }}
            className={`h-11 flex-1 rounded-full border text-sm font-medium ${mode === id ? "border-ink bg-wax text-onwax" : "border-line bg-surface text-ink"}`}
          >
            {t(id === "email" ? "auth.email" : "auth.phone")}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("auth.name")}
        <input className={fieldClass} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
      </label>
      {mode === "email" ? (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("auth.email")}
          <input className={fieldClass} inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("auth.phone")}
          <span className="flex gap-2">
            <select className={`${fieldClass} w-28 shrink-0`} value={dial} onChange={(event) => setDial(event.target.value)} aria-label={t("auth.dial")}>
              {COUNTRIES.map((item) => (
                <option key={item.id} value={item.dial}>
                  {item.id} {item.dial}
                </option>
              ))}
            </select>
            <input className={fieldClass} inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </span>
        </label>
      )}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" className="mt-1 size-4" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
        <span>
          {t("auth.terms")}{" "}
          <a className="text-wax underline" href="/confidentialite/">
            {t("legal.privacy")}
          </a>
          {" · "}
          <a className="text-wax underline" href="/confidentialite/#conditions">
            {t("legal.terms")}
          </a>
        </span>
      </label>
      {step === "code" ? (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("auth.code")}
          <input
            className={`${fieldClass} tracking-[0.4em]`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </label>
      ) : null}
      {note ? <p className="text-sm text-muted">{note}</p> : null}
      {trial && local ? (
        <button
          type="button"
          className="rounded-2xl border border-line bg-surface px-4 py-3 text-center"
          onClick={() => {
            setCode(trial);
            void confirm(trial);
          }}
        >
          <p className="text-sm text-muted">{t("auth.local")}</p>
          <p className="mt-1 text-2xl font-medium tracking-[0.3em] text-ink">{trial}</p>
        </button>
      ) : null}
      <Button variant="primary" disabled={busy} onClick={() => void (step === "code" ? confirm(code) : ask())}>
        {step === "code" ? t("auth.enter") : t("auth.send")}
      </Button>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => void social("google")} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-medium">
          <GoogleMark />
          {t("auth.google")}
        </button>
        <button type="button" onClick={() => void social("apple")} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper">
          <AppleMark />
          {t("auth.apple")}
        </button>
      </div>
      <button type="button" onClick={restore} className="text-sm font-medium text-wax">
        {t("auth.restore")}
      </button>
      <a href="/?entrer=1" onClick={goIn} className="text-center text-sm text-muted underline">
        {t("auth.guest")}
      </a>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.2l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 17" aria-hidden>
      <path fill="currentColor" d="M11.4 8.9c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8s-1.7-.8-2.9-.8c-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7 1.9-1.1 2.6-2.1c.8-1.2 1.1-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7zM9.5 2.7c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
    </svg>
  );
}
