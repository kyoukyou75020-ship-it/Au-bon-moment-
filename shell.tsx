import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, CalendarRange, PenLine, ScrollText, Settings, Users, type LucideIcon } from "lucide-react";
import { armPhotoWrites, bindPhotoFlush } from "@/lib/bonmoment/cache";
import { bindIncomingPdf, nextPdfAt, planOf, watchDocs } from "@/lib/bonmoment/docs";
import { startCloud } from "@/lib/bonmoment/cloud";
import { RTL } from "@/lib/bonmoment/extra-lang";
import { nativeSend } from "@/lib/bonmoment/message";
import { setWebChoice } from "@/lib/bonmoment/remote";
import { playPage, primeAudio } from "@/lib/bonmoment/sound";
import { persistedSnapshot, useBonMoment } from "@/lib/bonmoment/store";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import type { ButtonShape, TabId } from "@/lib/bonmoment/types";
import { useLocale, useSimple, useT } from "@/lib/bonmoment/use-i18n";
import { cn } from "@/lib/cn";
import { linkMagic } from "@/lib/bonmoment/account";
import { AccountGate } from "./account";
import { Agenda } from "./agenda";
import { CalendarView } from "./calendar";
import { Composer } from "./composer";
import { Confetti } from "./confetti";
import { DonateButton } from "./donate";
import { SealDrop } from "./effects";
import { HelpButton } from "./help";
import { InstallButton } from "./install";
import { Journal } from "./journal";
import { ShotButton } from "./tools";
import { jumpTo } from "./search";
import { LanguageButton } from "./language";
import { BootScreen } from "./loader";
import { NotificationBox } from "./notifications";
import { AdBanner, PlanDialog, requestPlan, usePlanOpen } from "./plan";
import { Proches } from "./proches";
import { SaveButton } from "./save";
import { Settings as SettingsPage } from "./settings";
import { ShareButton } from "./share";
import { Textes } from "./textes";
import { Seal } from "./ui";
import { resolveScene, Wallpaper } from "./wallpaper";
import { LockButton, LockGate } from "./guard";
import { StickerRain } from "./rain";

const PAGE_LINK: Record<string, TabId> = {
  agenda: "agenda",
  messages: "agenda",
  composer: "composer",
  ecrire: "composer",
  textes: "textes",
  favoris: "textes",
  proches: "proches",
  amis: "proches",
  journal: "journal",
  envoyes: "journal",
  reglages: "reglages",
  calendrier: "calendrier",
};

const ORDER: TabId[] = ["agenda", "calendrier", "composer", "textes", "proches", "journal", "reglages"];

const NAV: { id: TabId; label: MessageKey; icon: LucideIcon }[] = [
  { id: "agenda", label: "nav.agenda", icon: CalendarDays },
  { id: "calendrier", label: "calendar.nav", icon: CalendarRange },
  { id: "composer", label: "nav.write", icon: PenLine },
  { id: "textes", label: "nav.texts", icon: BookOpen },
  { id: "proches", label: "nav.people", icon: Users },
  { id: "journal", label: "nav.journal", icon: ScrollText },
];

const SETTINGS_ITEM = { id: "reglages" as const, label: "nav.settings" as const, icon: Settings };

function buttonMark(shape: ButtonShape): string {
  if (shape === "coeur") return '"♡"';
  if (shape === "fleur") return '"🌸"';
  if (shape === "etoile") return '"⭐"';
  if (shape === "mignon") return '"🐾"';
  return "none";
}

function buttonRadius(shape: ButtonShape): string {
  if (shape === "coeur") return "1.7rem";
  if (shape === "fleur") return "1.35rem";
  if (shape === "etoile") return "0.8rem";
  if (shape === "mignon") return "1.9rem";
  return "999px";
}

function ReliefStage() {
  return (
    <div className="relief-stage pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <span className="relief-slab relief-slab-a" />
      <span className="relief-slab relief-slab-b" />
      <span className="relief-slab relief-slab-c" />
    </div>
  );
}

export function App({ enterNow = false }: { enterNow?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const simple = useSimple();
  const dark = useBonMoment((state) => state.settings.dark === true);
  const large = useBonMoment((state) => state.settings.large === true);
  const tab = useBonMoment((state) => state.tab);
  const setTab = useBonMoment((state) => state.setTab);
  const schedules = useBonMoment((state) => state.schedules);
  const settings = useBonMoment((state) => state.settings);
  const docPlan = useBonMoment((state) => state.docPlan);
  const pdfs = useBonMoment((state) => state.docs);
  const contacts = useBonMoment((state) => state.contacts);
  const occasion = useBonMoment((state) => state.draft.occasion);
  const confetti = useBonMoment((state) => state.confetti);
  const [burst, setBurst] = useState(false);
  const [planOpen, setPlanOpen] = usePlanOpen();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL.has(locale) ? "rtl" : "ltr";
  }, [locale]);

  useEffect(() => {
    let timer = 0;
    const pause = () => {
      document.documentElement.classList.add("fx-busy");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => document.documentElement.classList.remove("fx-busy"), 160);
    };
    window.addEventListener("pointerdown", pause, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", pause);
      document.documentElement.classList.remove("fx-busy");
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#1a1613" : "#f4efe6");
  }, [dark]);

  useEffect(() => {
    document.documentElement.classList.toggle("large-type", large);
  }, [large]);

  useEffect(() => {
    const root = document.documentElement;
    const color = settings.color ?? "bordeaux";
    if (color === "bordeaux") delete root.dataset.color;
    else root.dataset.color = color;
    const paper = settings.paper ?? "creme";
    if (paper === "creme") delete root.dataset.paper;
    else root.dataset.paper = paper;
    root.dataset.hints = settings.hints === false ? "off" : "on";
  }, [settings.color, settings.paper, settings.hints]);

  useEffect(() => {
    const root = document.documentElement;
    const global = settings.buttonShape ?? "rond";
    const custom = settings.buttonCustom === true;
    const picked = settings.buttonShapes ?? {};
    root.dataset.btnMode = custom ? "custom" : "all";
    root.style.setProperty("--btn-mark", buttonMark(global));
    root.style.setProperty("--btn-radius", buttonRadius(global));
    root.style.setProperty("--btn-mark-go", buttonMark(picked.action ?? global));
    root.style.setProperty("--btn-mark-ok", buttonMark(picked.valider ?? global));
    root.style.setProperty("--btn-mark-love", buttonMark(picked.amour ?? (global === "rond" ? "coeur" : global)));
    root.style.setProperty("--r-go", buttonRadius(picked.action ?? global));
    root.style.setProperty("--r-ok", buttonRadius(picked.valider ?? global));
    root.style.setProperty("--r-love", buttonRadius(picked.amour ?? (global === "rond" ? "coeur" : global)));
  }, [settings.buttonShape, settings.buttonCustom, settings.buttonShapes]);

  useEffect(() => {
    let alive = true;
    let unbind = () => {};
    void (async () => {
      try {
        await Promise.race([
          useBonMoment.persist.rehydrate(),
          new Promise((resolve) => window.setTimeout(resolve, 1500)),
        ]);
      } catch {
        /* keep the letters already on the device */
      }
      if (!alive) return;
      const params = new URLSearchParams(window.location.search);
      const opened = PAGE_LINK[params.get("page") ?? ""];
      if (params.has("effacer")) useBonMoment.getState().setTab("reglages");
      else if (opened) useBonMoment.getState().setTab(opened);
      else useBonMoment.getState().setTab("agenda");
      armPhotoWrites();
      useBonMoment.getState().applySeed();
      useBonMoment.getState().refreshDue();
      unbind = bindPhotoFlush(persistedSnapshot);
      const stopCloud = startCloud();
      const previous = unbind;
      unbind = () => {
        previous();
        stopCloud();
      };
    })();
    const refresh = () => {
      useBonMoment.getState().refreshDue();
      watchDocs();
    };
    const timer = window.setInterval(refresh, 15000);
    const onShow = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onShow);
    const host = window as Window & { __bonmomentDue?: () => void };
    host.__bonmomentDue = refresh;
    bindIncomingPdf();
    return () => {
      alive = false;
      unbind();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
      if (host.__bonmomentDue === refresh) delete host.__bonmomentDue;
    };
  }, []);

  useEffect(() => {
    if (confetti === 0) return;
    setBurst(true);
    const timer = window.setTimeout(() => setBurst(false), 2800);
    return () => window.clearTimeout(timer);
  }, [confetti]);

  useEffect(() => {
    const unlock = () => {
      primeAudio();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const due = schedules.filter((item) => item.status === "due").length;
  const wallpaperId = settings.wallpaperId ?? (settings.wallpaper === false ? "off" : "auto");
  const fun = settings.fun ?? "fete";
  const glow = settings.glow ?? 60;
  const scene = resolveScene(wallpaperId, occasion, tab);
  const pro = settings.plan === "pro";
  const showAd = !pro && settings.hideAd !== true;
  const funSeen = useRef(fun);
  const [funPulse, setFunPulse] = useState(0);
  useEffect(() => {
    if (funSeen.current === fun) return;
    funSeen.current = fun;
    setFunPulse((value) => value + 1);
  }, [fun]);

  useEffect(() => {
    setWebChoice(settings.web);
    nativeSend()?.net?.(settings.web !== false);
  }, [settings.web]);

  useEffect(() => {
    const bridge = nativeSend();
    if (!bridge?.plan) return;
    const after = Date.now() + 5000;
    const planned =
      settings.autoSend === false
        ? []
        : schedules
            .filter((item) => item.status === "scheduled" && Date.parse(item.at) > after)
            .map((item) => ({
              id: item.id,
              at: Date.parse(item.at),
              body: contacts.find((person) => person.id === item.contactId)?.name ?? "BonMoment",
            }));
    const pdfAt = nextPdfAt(planOf(docPlan));
    if (pdfAt && pdfAt > after && (pdfs ?? []).some((item) => item.status !== "sent")) {
      planned.push({ id: "pdf-bonmoment", at: pdfAt, body: "PDF" });
    }
    bridge.plan(JSON.stringify(planned));
  }, [schedules, contacts, settings.autoSend, docPlan, pdfs]);

  useEffect(() => {
    if (settings.plan === "pro") linkMagic();
  }, [settings.plan]);

  useEffect(() => {
    watchDocs();
    const timer = window.setInterval(() => watchDocs(), 20000);
    const onShow = () => watchDocs();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, []);

  const shown = ORDER.includes(tab) ? tab : "agenda";
  const [light, setLight] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)");
    const apply = () => setLight(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  function openTab(next: TabId) {
    if (next === tab) return;
    playPage();
    setTab(next);
    window.scrollTo(0, 0);
  }

  const bar = NAV.filter((item) => item.id !== "calendrier");
  const mobileIds = (settings.navOrder ?? []).filter((id) => bar.some((item) => item.id === id));
  const mobile = [
    ...mobileIds.map((id) => bar.find((item) => item.id === id)!),
    ...bar.filter((item) => !mobileIds.some((id) => id === item.id)),
  ];
  const side = [...mobile, NAV.find((item) => item.id === "calendrier")!];

  return (
    <AccountGate enterNow={enterNow}>
    <LockGate>
    <div id="bonmoment-root" data-fun={fun} className={cn("min-h-dvh bg-paper text-ink", simple && "cm1", scene && !light && "scene-on")}>
      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r border-line px-5 py-8 md:flex">
          <Brand />
          <div className="mt-6 flex flex-col items-start gap-3">
            <LanguageButton />
            <div className="flex items-center gap-2">
              <NotificationBox />
              <HelpButton />
            </div>
          </div>
          <nav className="mt-6 flex flex-col gap-1" aria-label={t("nav.sections")}>
            {side.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                label={t(item.label)}
                active={tab === item.id}
                count={item.id === "agenda" ? due : 0}
                onClick={() => openTab(item.id)}
              />
            ))}
            <NavButton
              item={SETTINGS_ITEM}
              label={t("nav.settings")}
              active={tab === "reglages"}
              count={0}
              onClick={() => openTab("reglages")}
            />
          </nav>
          <div className="mt-auto flex flex-col items-start gap-3">
            {pro ? null : (
              <button type="button" onClick={requestPlan} className="w-full rounded-2xl border border-line bg-surface p-3 text-left">
                <p className="text-xs font-medium tracking-wide text-brass uppercase">{t("plan.adLabel")}</p>
                <p className="mt-1 text-sm text-ink">{t("plan.ad1")}</p>
                <p className="mt-1 text-sm text-muted">{t("plan.price")}</p>
              </button>
            )}
            <SaveButton wide />
            <ShareButton />
            <DonateButton />
            <InstallButton />
          </div>
        </aside>
        <div className="relative isolate min-h-dvh min-w-0 flex-1">
          {settings.color === "relief" ? <ReliefStage /> : null}
          {scene ? <Wallpaper scene={scene} fun={fun} glow={glow} emojiScale={settings.stickerSize === "petit" ? 0.7 : settings.stickerSize === "grand" ? 1.7 : 1} /> : null}
          <StickerRain />
          <header className="sticky top-0 z-30 flex min-w-0 items-center gap-2 bg-paper/95 px-3 py-2 backdrop-blur-none md:hidden">
            <Brand compact />
            <div className="flex max-w-[68%] shrink-0 items-center gap-1 overflow-x-auto">
              <LanguageButton iconOnly />
              <LockButton
                onMissing={() => {
                  openTab("reglages");
                  jumpTo("security");
                }}
              />
              <button
                type="button"
                onClick={() => openTab("reglages")}
                aria-label={t("nav.settings")}
                aria-current={tab === "reglages" ? "page" : undefined}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full border bg-surface text-ink",
                  tab === "reglages" ? "border-ink" : "border-line",
                )}
              >
                <Settings className="size-4" aria-hidden />
              </button>
              <InstallButton iconOnly />
              <ShotButton iconOnly />
              <NotificationBox />
            </div>
          </header>
          <main className={cn("relative z-10 mx-auto w-full max-w-2xl px-4 pt-1 md:px-8 md:py-10 md:pb-16", showAd ? "pb-40" : "pb-28")}>
            <div key={shown} className={settings.color === "relief" ? "relief-in" : "fav-in"}>
              {shown === "agenda" ? <Agenda /> : null}
              {shown === "calendrier" ? <CalendarView /> : null}
              {shown === "composer" ? <Composer /> : null}
              {shown === "textes" ? <Textes /> : null}
              {shown === "proches" ? <Proches /> : null}
              {shown === "journal" ? <Journal /> : null}
              {shown === "reglages" ? <SettingsPage /> : null}
            </div>
          </main>
        </div>
      </div>
      <nav className="nav-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper md:hidden" aria-label={t("nav.sections")}>
        <AdBanner />
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {mobile
            .filter((item) => item.id !== "calendrier")
            .map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openTab(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex h-16 w-full flex-col items-center justify-center gap-1 text-xs", active ? "text-wax" : "text-muted")}
                  >
                    <span className="relative">
                      <Icon className="size-5" aria-hidden />
                      {item.id === "agenda" && due > 0 ? (
                        <span className="absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-wax px-1 text-xs leading-none text-onwax tabular-nums">
                          {due}
                        </span>
                      ) : null}
                    </span>
                    <span className="w-full truncate px-1 text-center">{t(item.label)}</span>
                  </button>
                </li>
              );
            })}
        </ul>
      </nav>
      {burst ? <Confetti burst /> : null}
      {burst ? <SealDrop /> : null}
      {funPulse > 0 ? (
        <div key={funPulse} className={cn("fun-flash pointer-events-none fixed inset-0 z-30", `fun-flash-${fun}`)} />
      ) : null}
      <PlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />
      <BootScreen skip={enterNow} />
    </div>
    </LockGate>
    </AccountGate>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const pro = useBonMoment((state) => state.settings.plan === "pro");
  return (
    <div className={cn("flex min-w-0 items-center gap-3", compact && "flex-1")}>
      <Seal />
      <div className={cn("min-w-0", compact && "flex-1")}>
        <p className={cn("truncate font-serif text-ink", compact ? "text-sm leading-tight whitespace-nowrap" : "text-2xl leading-none")}>Au bon moment</p>
        <p className={cn("truncate tracking-wide text-brass uppercase", compact ? "text-xs whitespace-nowrap" : "mt-1 text-xs")}>{t(pro ? "plan.pro" : "plan.free")}</p>
        {compact ? null : <p className="mt-1 text-sm text-muted">{t("brand.tagline")}</p>}
      </div>
    </div>
  );
}

function NavButton({
  item,
  label,
  active,
  count,
  onClick,
}: {
  item: { icon: LucideIcon };
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm transition-colors duration-150",
        active ? "bg-surface font-medium text-ink shadow-lift" : "text-muted hover:text-ink",
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="flex-1">{label}</span>
      {count > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-wax px-1 text-xs text-onwax tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}
