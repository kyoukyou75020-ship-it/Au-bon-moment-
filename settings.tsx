import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { CHANNELS, channelLabel } from "@/lib/bonmoment/occasions";
import { AlbumPanel } from "./album";
import { cacheWriteFailed, photoStats, subscribeCache } from "@/lib/bonmoment/cache";
import { loadClip } from "@/lib/bonmoment/video";
import { playChime, playTick } from "@/lib/bonmoment/sound";
import { openOutside, nativeSend } from "@/lib/bonmoment/message";
import { isProUser, useBonMoment } from "@/lib/bonmoment/store";
import type { AutoWhen, ButtonShape, Channel, ColorId, FunLevel, LeadId, PaperId, PhotoShape, StickerFamily, StickerWay, StickerWhen, ToneId, VoiceStyle, WallpaperId } from "@/lib/bonmoment/types";
import { VOICE_STYLES, speakText } from "@/lib/bonmoment/voice";
import { LOCALES, type MessageKey } from "@/lib/bonmoment/i18n";
import { useT } from "@/lib/bonmoment/use-i18n";
import { LanguageButton } from "./language";
import { ShareButton, shopLink } from "./share";
import { currentWho, leaveWho } from "@/lib/bonmoment/account";
import { PAYPAL_CREATE, giftLink, paypalGift, paypalLink } from "./donate";
import { Button, Chip, Field, fieldClass } from "./ui";
import { SaveButton } from "./save";
import { PlanCard, billingStatus, playTip, requestPlan } from "./plan";
import { CloudPanel } from "./cloud-panel";
import { ShotButton, TestButton } from "./tools";
import { ScenePop, sceneLook } from "./effects";
import { CoverPanel } from "./cover";
import { IntroPanel } from "./intro";
import { AlertTry } from "./notifications";
import { SearchBar, matchesQuery, useOpenFold } from "./search";
import { DocsPanel } from "./docs";
import { BackupPanel, LockPanel } from "./guard";
import { STICKER_THEMES } from "./rain";
import { StickerPickButton } from "./stickers";
import { cn } from "@/lib/cn";
import { askGateway, type GateReason } from "@/lib/bonmoment/gateway";
import { copyText } from "./copy";

const SHAPES: PhotoShape[] = ["free", "square", "landscape", "portrait"];
const SHAPE_KEY: Record<PhotoShape, MessageKey> = {
  free: "photo.shape.free",
  square: "photo.shape.square",
  landscape: "photo.shape.landscape",
  portrait: "photo.shape.portrait",
};
const STYLE_KEY: Record<VoiceStyle, MessageKey> = {
  plain: "voice.style.plain",
  bear: "voice.style.bear",
  quick: "voice.style.quick",
  robot: "voice.style.robot",
  mouse: "voice.style.mouse",
  soft: "voice.style.soft",
  vive: "voice.style.vive",
  grave: "voice.style.grave",
  tendre: "voice.style.tendre",
  rieuse: "voice.style.rieuse",
  conte: "voice.style.conte",
  calme: "voice.style.calme",
};

function VoiceLang() {
  const t = useT();
  const lang = useBonMoment((state) => state.settings.speakLang ?? "fr");
  const style = useBonMoment((state) => state.settings.voiceStyle ?? "plain");
  const body = useBonMoment((state) => state.draft.body);
  const setSettings = useBonMoment((state) => state.setSettings);
  const [query, setQuery] = useState("");
  const shown = LOCALES.filter((item) => matchesQuery(query, [item.native, item.id]));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">{t("voice.lang")}</p>
      <SearchBar value={query} onChange={setQuery} placeholder={t("voice.langFind")} />
      <div className="flex flex-wrap gap-2">
        {shown.map((item) => (
          <Chip key={item.id} active={lang === item.id} onClick={() => setSettings({ speakLang: item.id })}>
            {item.native}
          </Chip>
        ))}
      </div>
      <button
        type="button"
        className="inline-flex h-11 items-center gap-2 self-start rounded-2xl border border-line bg-paper px-4 text-sm font-medium text-ink"
        onClick={() => speakText(body.trim() || t("voice.sample"), style, lang)}
      >
        <span aria-hidden>🔊</span>
        {t("voice.speak")}
      </button>
    </div>
  );
}

function ResetSettings() {
  const t = useT();
  const resetSettings = useBonMoment((state) => state.resetSettings);
  const [ask, setAsk] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2">
      {ask ? (
        <div className="flex w-full flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
          <p className="font-medium text-ink">{t("settings.resetAsk")}</p>
          <p className="text-sm text-muted">{t("settings.resetHint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                resetSettings();
                playChime();
                setAsk(false);
              }}
            >
              {t("settings.resetYes")}
            </Button>
            <Button variant="quiet" onClick={() => setAsk(false)}>
              {t("settings.resetNo")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="quiet" onClick={() => setAsk(true)}>
          {t("settings.reset")}
        </Button>
      )}
    </div>
  );
}

function AccountLine() {
  const t = useT();
  const who = currentWho();
  if (!who) return null;
  const label = who.provider === "guest" ? t("auth.guest") : who.name || who.email || who.phone;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-muted">{t("auth.who")}</p>
        <p className="truncate font-medium text-ink">{label}</p>
      </div>
      <Button
        variant="quiet"
        onClick={() => {
          playTick();
          leaveWho();
        }}
      >
        {t("auth.out")}
      </Button>
    </div>
  );
}

const FREE_FOLDS = ["easy", "album", "donate", "privacy", "security"] as const;
const PRO_FOLDS = ["place", "look", "share", "updates", "docs", "early", "fond", "stick", "shapes", "voice", "ia", "auto", "cloud"] as const;
const PLACE_FOLDS = [...FREE_FOLDS, ...PRO_FOLDS] as const;
const PLACE_ICONS = ["agenda", "composer", "textes", "proches", "journal"] as const;

function lined<T extends string>(saved: readonly string[] | undefined, all: readonly T[]): T[] {
  const known = (saved ?? []).filter((item): item is T => (all as readonly string[]).includes(item));
  return [...known, ...all.filter((item) => !known.includes(item))];
}

function Fold({
  id = "",
  title,
  children,
  open = false,
  locked = false,
  rank = 0,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  open?: boolean;
  locked?: boolean;
  rank?: number;
}) {
  const t = useT();
  const jump = useOpenFold(id);
  const [on, setOn] = useState(open);
  useEffect(() => {
    if (jump.wanted) setOn(true);
  }, [jump.tick, jump.wanted]);
  return (
    <section ref={jump.ref} style={{ order: rank }} className={cn("overflow-hidden rounded-3xl border bg-paper", locked ? "border-wax" : "border-line")}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        aria-expanded={on}
        onClick={() => {
          playTick();
          if (locked) requestPlan();
          setOn((value) => !value);
        }}
      >
        <span className={cn("text-lg font-medium", locked ? "text-muted" : "text-ink")}>{title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {locked ? (
            <span className="rounded-full bg-wax px-2 py-0.5 text-xs font-medium tracking-wide text-onwax">{t("plan.badge")}</span>
          ) : null}
          <span aria-hidden className="text-xl leading-none text-muted">
            {on ? "–" : "+"}
          </span>
        </span>
      </button>
      {on ? (
        <div className="flex flex-col gap-4 px-3 pb-4">
          {locked ? <p className="text-sm text-muted">{t("plan.locked")}</p> : null}
          {locked ? <div className="pointer-events-none flex flex-col gap-4 opacity-50">{children}</div> : children}
        </div>
      ) : null}
    </section>
  );
}

export function Settings() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const pro = isProUser(settings);
  const foldIds = PLACE_FOLDS;
  function rankOf(id: string) {
    const saved = (settings.foldOrder ?? []).filter((item) => (foldIds as readonly string[]).includes(item));
    const order = [...saved, ...foldIds.filter((item) => !saved.includes(item))];
    const free = (FREE_FOLDS as readonly string[]).includes(id);
    const group = order.filter((item) => (FREE_FOLDS as readonly string[]).includes(item) === free);
    const index = group.indexOf(id);
    return (free ? 1 : 200) + (index < 0 ? group.length : index);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl md:text-4xl">{t("settings.title")}</h1>
        <p className="mt-2 text-base text-muted">{t("settings.lead")}</p>
        <AccountLine />
      </header>

      <PlanCard />

      <div ref={useOpenFold("plan").ref}>
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-wax bg-surface p-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{settings.plan === "pro" ? t("plan.pro") : t("settings.simple")}</p>
          <p className="mt-1 text-sm text-ink">{settings.plan === "pro" ? t("settings.toLight") : t("settings.toPro")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.plan === "pro"}
          aria-label={settings.plan === "pro" ? t("plan.pro") : t("settings.simple")}
          onClick={() => {
            playTick();
            if (settings.plan === "pro") {
              if (settings.planSource === "play") return;
              setSettings({ plan: "free", planSource: undefined });
              return;
            }
            requestPlan();
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", settings.plan === "pro" ? "bg-wax" : "bg-line")}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
              settings.plan === "pro" ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
      </div>

      <div className="flex flex-col gap-3">
        <p style={{ order: 0 }} className="px-1 text-sm font-medium tracking-wide text-brass uppercase">{t("settings.basic")}</p>
        <Fold id="easy" title={t("settings.group.easy")} rank={rankOf("easy")}>
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-4">
            <div className="min-w-0">
              <p className="font-medium text-ink">{t("settings.dark")}</p>
              <p className="mt-1 text-sm text-muted">{t("settings.darkHint")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.dark === true}
              aria-label={t("settings.dark")}
              onClick={() => {
                playTick();
                setSettings({ dark: settings.dark !== true });
              }}
              className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", settings.dark === true ? "bg-wax" : "bg-line")}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
                  settings.dark === true ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-4">
            <div className="min-w-0">
              <p className="font-medium text-ink">{t("settings.sound")}</p>
              <p className="mt-1 text-sm text-muted">{t("settings.soundHint")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.sound !== false}
              aria-label={t("settings.sound")}
              onClick={() => {
                const next = settings.sound === false;
                setSettings({ sound: next });
                if (next) playChime();
              }}
              className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", settings.sound !== false ? "bg-wax" : "bg-line")}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
                  settings.sound !== false ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
          <LargePanel />
          <NotifyPanel />
          <UnsentPanel />
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-4">
            <div className="min-w-0">
              <p className="font-medium text-ink">{t("settings.language")}</p>
            </div>
            <LanguageButton />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-4">
            <p className="font-medium text-ink">{t("settings.time")}</p>
            <input
              className={`${fieldClass} w-28`}
              type="time"
              value={settings.time}
              onChange={(event) => setSettings({ time: event.target.value })}
            />
          </div>
          <ShowPanel />
        </Fold>
        <Fold id="album" title={t("album.title")} rank={rankOf("album")}>
          <AlbumPanel />
        </Fold>

        <p style={{ order: 150 }} className="mt-2 px-1 text-sm font-medium tracking-wide text-brass uppercase">{t("settings.advanced")}</p>
        <p style={{ order: 151 }} className="px-1 text-sm text-muted">{t("settings.proOnly")}</p>
        <Fold id="docs" title={t("docs.fold")} locked={!pro} rank={rankOf("docs")}>
          <DocsPanel />
        </Fold>
        <Fold id="early" title={t("settings.group.early")} locked={!pro} rank={rankOf("early")}>
          <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
            <p className="text-sm leading-relaxed text-ink">{t("settings.earlyLead")}</p>
            <label className="flex items-center gap-3 text-sm text-ink">
              <input type="checkbox" checked={settings.early === true} onChange={(event) => setSettings({ early: event.target.checked })} />
              {t("settings.earlyOn")}
            </label>
            {settings.early ? <p className="text-sm text-muted">{t("settings.earlyReady")}</p> : null}
          </div>
        </Fold>
        <Fold id="place" title={t("place.title")} locked={!pro} rank={rankOf("place")}>
          <PlacePanel />
        </Fold>
        <Fold id="look" title={t("settings.group.look")} locked={!pro} rank={rankOf("look")}>
          <CoverPanel />
          <IntroPanel />
          <ThemeRail />
        </Fold>
        <Fold id="fond" title={t("settings.group.fond")} locked={!pro} rank={rankOf("fond")}>
          <PaperPanel />
          <GlowSlider />
          <FunPanel />
        </Fold>
        <Fold id="stick" title={t("settings.group.stick")} locked={!pro} rank={rankOf("stick")}>
          <StickerPanel />
        </Fold>
        <Fold id="shapes" title={t("settings.group.shapes")} locked={!pro} rank={rankOf("shapes")}>
          <ButtonShapePanel />
          <fieldset className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
            <legend className="font-medium text-ink">{t("photo.shape")}</legend>
            <p className="text-sm text-ink">{t("photo.shapeLive")}</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((shape) => (
                <Chip
                  key={shape}
                  active={(settings.photoShape ?? "free") === shape}
                  onClick={() => {
                    playTick();
                    setSettings({ photoShape: shape });
                  }}
                >
                  {t(SHAPE_KEY[shape])}
                </Chip>
              ))}
            </div>
            <ShapeFrame shape={settings.photoShape ?? "free"} />
          </fieldset>
        </Fold>
        <Fold id="voice" title={t("settings.group.voice")} locked={!pro} rank={rankOf("voice")}>
          <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
            <p className="font-medium text-ink">{t("settings.voice")}</p>
            <div className="flex flex-wrap gap-2">
              {VOICE_STYLES.map((style) => (
                <Chip key={style} active={(settings.voiceStyle ?? "plain") === style} onClick={() => setSettings({ voiceStyle: style })}>
                  {t(STYLE_KEY[style])}
                </Chip>
              ))}
            </div>
            <VoiceLang />
          </div>
        </Fold>
        <Fold id="ia" title={t("settings.group.ia")} locked={!pro} rank={rankOf("ia")}>
          <TonePanel />
          <SignPanel />
        </Fold>
        <Fold id="auto" title={t("settings.group.auto")} locked={!pro} rank={rankOf("auto")}>
          <TellPanel />
          <AutoPanel />
          <RemindPanel />
          {settings.simple === false ? (
            <>
              <Field label={t("settings.channel")}>
                <select
                  className={fieldClass}
                  value={settings.channel}
                  onChange={(event) => setSettings({ channel: event.target.value as Channel })}
                >
                  {CHANNELS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {channelLabel(item.id)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("settings.time")} hint={t("settings.timeHint")}>
                <input
                  className={fieldClass}
                  type="time"
                  value={settings.time}
                  onChange={(event) => {
                    if (/^\d{2}:\d{2}$/.test(event.target.value)) setSettings({ time: event.target.value });
                  }}
                />
              </Field>
            </>
          ) : null}
        </Fold>

        <Fold id="share" title={t("settings.group.share")} locked={!pro} rank={rankOf("share")}>
          <AccessLinks />
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface p-4">
            <ShotButton />
            <TestButton />
            <AlertTry />
          </div>
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface p-4">
            <div>
              <p className="font-medium text-ink">{t("share.button")}</p>
              <p className="mt-1 text-sm text-muted">{t("share.hint")}</p>
            </div>
            <Field label={t("share.link")} hint={t("share.linkHint")}>
              <input
                className={fieldClass}
                inputMode="url"
                autoComplete="off"
                maxLength={200}
                value={settings.storeUrl ?? ""}
                placeholder="https://"
                onChange={(event) => setSettings({ storeUrl: event.target.value })}
              />
            </Field>
            {(settings.storeUrl ?? "").trim() && !shopLink(settings.storeUrl) ? (
              <p className="text-sm text-wax">{t("share.linkBad")}</p>
            ) : null}
            <ShareButton />
          </div>
          <div className="flex flex-col items-start gap-2 px-1">
            <p className="text-sm font-medium text-ink">{t("settings.language")}</p>
            <LanguageButton />
          </div>
        </Fold>
      <Fold id="cloud" title={t("cloud.title")} locked={!pro} rank={rankOf("cloud")}>
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-ink">{t("net.title")}</p>
              <p className="mt-1 text-sm text-muted">{t("net.hint")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.web !== false}
              aria-label={t("net.title")}
              onClick={() => {
                playTick();
                setSettings({ web: settings.web === false });
              }}
              className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", settings.web !== false ? "bg-wax" : "bg-line")}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
                  settings.web !== false ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
          <p className="text-sm text-ink">
            {settings.web === false ? t("net.off") : typeof navigator !== "undefined" && navigator.onLine === false ? t("net.down") : t("net.on")}
          </p>
          {settings.web !== false ? (
            <Field label={t("net.url")} hint={t("net.urlHint")}>
              <input
                className={fieldClass}
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://"
                value={settings.gatewayUrl ?? ""}
                onChange={(event) => setSettings({ gatewayUrl: event.target.value })}
              />
            </Field>
          ) : null}
        </div>
        <CloudPanel />
      </Fold>
      <Fold id="donate" title={t("donate.helpTitle")} rank={rankOf("donate")}>
        <DonateHelp />
      </Fold>
      <Fold id="privacy" title={t("settings.group.privacy")} rank={rankOf("privacy")}>
        <LegalPanel />
        {pro ? (
          <>
            <DiscreetPanel />
            <CachePanel />
            <VideoPanel />
            <VoicePanel />
            <TempPanel />
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <button type="button" onClick={requestPlan} className="self-start rounded-full bg-wax px-3 py-1 text-xs font-medium tracking-wide text-onwax">
              {t("plan.badge")}
            </button>
            <p className="text-sm text-muted">{t("plan.locked")}</p>
            <div className="pointer-events-none flex flex-col gap-4 opacity-50">
              <DiscreetPanel />
              <CachePanel />
              <VideoPanel />
              <VoicePanel />
              <TempPanel />
            </div>
          </div>
        )}
      </Fold>
      <Fold id="updates" title={t("update.section")} locked={!pro} rank={rankOf("updates")}>
        <UpdatePanel />
      </Fold>
      <Fold id="security" title={t("settings.group.security")} rank={rankOf("security")}>
        <div className="rounded-3xl border border-line bg-surface p-4">
          <p className="font-medium text-ink">{t("secure.shield")}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
            <li>{t("secure.item1")}</li>
            <li>{t("secure.item2")}</li>
            <li>{t("secure.item3")}</li>
            <li>{t("secure.item4")}</li>
          </ul>
        </div>
        <LinkPanel />
        <LockPanel />
        {pro ? (
          <BackupPanel />
        ) : (
          <div className="flex flex-col gap-3">
            <button type="button" onClick={requestPlan} className="self-start rounded-full bg-wax px-3 py-1 text-xs font-medium tracking-wide text-onwax">
              {t("plan.badge")}
            </button>
            <p className="text-sm text-muted">{t("plan.locked")}</p>
            <div className="pointer-events-none opacity-50">
              <BackupPanel />
            </div>
          </div>
        )}
      </Fold>
      </div>
      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
        <div>
          <p className="font-medium text-ink">{t("settings.doneTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("settings.doneHint")}</p>
        </div>
        <SaveButton wide label={t("settings.saveBtn")} />
        <ResetSettings />
      </section>
    </div>
  );
}

function PlacePanel() {
  const t = useT();
  const navOrder = useBonMoment((state) => state.settings.navOrder);
  const foldOrder = useBonMoment((state) => state.settings.foldOrder);
  const setSettings = useBonMoment((state) => state.setSettings);
  const icons = lined(navOrder, PLACE_ICONS);
  const folds = lined(foldOrder, PLACE_FOLDS);
  const freeFolds = folds.filter((id) => (FREE_FOLDS as readonly string[]).includes(id));
  const proFolds = folds.filter((id) => (PRO_FOLDS as readonly string[]).includes(id));
  const foldName: Record<(typeof PLACE_FOLDS)[number], MessageKey> = {
    place: "place.title",
    easy: "settings.group.easy",
    album: "album.title",
    docs: "docs.fold",
    early: "settings.group.early",
    look: "settings.group.look",
    fond: "settings.group.fond",
    stick: "settings.group.stick",
    shapes: "settings.group.shapes",
    voice: "settings.group.voice",
    ia: "settings.group.ia",
    auto: "settings.group.auto",
    share: "settings.group.share",
    cloud: "cloud.title",
    donate: "donate.helpTitle",
    privacy: "settings.group.privacy",
    updates: "update.section",
    security: "settings.group.security",
  };
  const iconName: Record<(typeof PLACE_ICONS)[number], MessageKey> = {
    agenda: "nav.agenda",
    composer: "nav.write",
    textes: "nav.texts",
    proches: "nav.people",
    journal: "nav.journal",
  };

  function nudgeIcons(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= icons.length) return;
    const copy = icons.slice();
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    playTick();
    setSettings({ navOrder: copy });
  }

  function nudgeFolds(list: string[], index: number, dir: -1 | 1, group: "free" | "pro") {
    const next = index + dir;
    if (next < 0 || next >= list.length) return;
    const copy = list.slice();
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    playTick();
    setSettings({ foldOrder: group === "free" ? [...copy, ...proFolds] : [...freeFolds, ...copy] });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t("place.lead")}</p>
      <OrderList title={t("place.icons")} rows={icons.map((id) => t(iconName[id]))} onMove={(index, dir) => nudgeIcons(index, dir)} />
      <OrderList title={t("settings.basic")} rows={freeFolds.map((id) => t(foldName[id]))} onMove={(index, dir) => nudgeFolds(freeFolds, index, dir, "free")} />
      <OrderList title={t("settings.advanced")} rows={proFolds.map((id) => t(foldName[id]))} onMove={(index, dir) => nudgeFolds(proFolds, index, dir, "pro")} />
      <SaveButton label={t("save.now")} />
      <p className="text-sm text-muted">{t("save.stay")}</p>
    </div>
  );
}

function OrderList({ title, rows, onMove }: { title: string; rows: string[]; onMove: (index: number, dir: -1 | 1) => void }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-ink">{title}</p>
      <ul className="flex flex-col gap-2">
        {rows.map((label, index) => (
          <li key={`${label}-${index}`} className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
            <button type="button" aria-label={t("place.up")} disabled={index === 0} onClick={() => onMove(index, -1)} className="size-9 rounded-full border border-line text-ink disabled:opacity-30">
              ↑
            </button>
            <button type="button" aria-label={t("place.down")} disabled={index === rows.length - 1} onClick={() => onMove(index, 1)} className="size-9 rounded-full border border-line text-ink disabled:opacity-30">
              ↓
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AccessLinks() {
  const t = useT();
  const setTab = useBonMoment((state) => state.setTab);
  const [copied, setCopied] = useState<string | null>(null);
  const links: { label: MessageKey; href: string; page?: "agenda" | "composer" | "textes" | "proches" | "journal" | "reglages" }[] = [
    { label: "nav.agenda", href: "/?entrer=1&page=agenda", page: "agenda" },
    { label: "nav.write", href: "/?entrer=1&page=composer", page: "composer" },
    { label: "nav.texts", href: "/?entrer=1&page=textes", page: "textes" },
    { label: "nav.people", href: "/?entrer=1&page=proches", page: "proches" },
    { label: "nav.journal", href: "/?entrer=1&page=journal", page: "journal" },
    { label: "nav.settings", href: "/?entrer=1&page=reglages", page: "reglages" },
    { label: "legal.privacy", href: "/confidentialite/" },
    { label: "legal.terms", href: "/confidentialite/#conditions" },
    { label: "legal.delete", href: "/suppression/" },
  ];
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <p className="font-medium text-ink">{t("access.title")}</p>
      <p className="text-sm text-muted">{t("access.lead")}</p>
      <ul className="flex flex-col gap-2">
        {links.map((item) => (
          <li key={item.href} className="flex items-center gap-2">
            <button
              type="button"
              className="min-w-0 flex-1 rounded-2xl border border-line bg-paper px-3 py-2 text-left text-sm font-medium text-ink"
              onClick={() => {
                playTick();
                if (item.page) {
                  setTab(item.page);
                  window.scrollTo(0, 0);
                  return;
                }
                window.location.assign(item.href);
              }}
            >
              {t(item.label)}
            </button>
            <button
              type="button"
              className="shrink-0 rounded-full border border-line px-3 py-2 text-xs text-ink"
              onClick={() => {
                const link = `${window.location.origin}${item.href}`;
                const done = () => {
                  setCopied(item.href);
                  window.setTimeout(() => setCopied((current) => (current === item.href ? null : current)), 1600);
                };
                if (navigator.clipboard) void navigator.clipboard.writeText(link).then(done).catch(done);
                else done();
              }}
            >
              {copied === item.href ? t("access.copied") : t("access.copy")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpdatePanel() {
  const t = useT();
  const [note, setNote] = useState<"store" | "web" | null>(null);
  const [bug, setBug] = useState("");
  const [bugNote, setBugNote] = useState<"sent" | "empty" | null>(null);
  const bridge = typeof window !== "undefined" ? nativeSend() : null;
  let version = "1.11";
  try {
    const raw = bridge?.apps?.();
    const parsed = raw ? (JSON.parse(raw) as { version?: string }) : null;
    if (parsed?.version) version = parsed.version;
  } catch {
    /* keep the bundled version */
  }
  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-3 rounded-3xl border border-wax bg-surface p-4">
        <p className="font-medium text-ink">{t("update.title")}</p>
        <p className="text-sm text-muted">{t("update.lead")}</p>
        <p className="text-sm text-ink">
          {t("update.version")} · {version}
        </p>
        <Button
          variant="primary"
          onClick={() => {
            playTick();
            const opened = bridge?.store?.();
            if (opened === "ok") {
              setNote("store");
              return;
            }
            const href = "https://play.google.com/store/apps/details?id=fr.bonmoment.app";
            if (!openOutside(href)) window.open(href, "_blank", "noopener");
            setNote("web");
          }}
        >
          {t("update.button")}
        </Button>
        {note ? <p className="text-sm text-muted">{t(note === "store" ? "update.opened" : "update.web")}</p> : null}
      </section>
      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
        <p className="font-medium text-ink">{t("update.bug")}</p>
        <p className="text-sm text-muted">{t("update.bugHint")}</p>
        <textarea
          className={`${fieldClass} h-28 py-3`}
          value={bug}
          maxLength={800}
          onChange={(event) => setBug(event.target.value)}
        />
        <Button
          variant="quiet"
          onClick={() => {
            const text = bug.trim();
            if (text.length < 4) {
              setBugNote("empty");
              return;
            }
            playTick();
            const report = `Au bon moment ${version}\n${text}`;
            const share = navigator.share?.({ title: "Bug Au bon moment", text: report });
            if (share) {
              void share.then(() => setBugNote("sent")).catch(() => setBugNote("sent"));
              return;
            }
            const href = `mailto:?subject=${encodeURIComponent("Bug Au bon moment")}&body=${encodeURIComponent(report)}`;
            if (!openOutside(href)) window.location.assign(href);
            setBugNote("sent");
          }}
        >
          {t("update.send")}
        </Button>
        {bugNote ? <p className="text-sm text-muted">{t(bugNote === "sent" ? "update.sent" : "update.empty")}</p> : null}
      </section>
    </div>
  );
}

function LinkPanel() {
  const t = useT();
  const web = useBonMoment((state) => state.settings.web !== false);
  const [ping, setPing] = useState<"ok" | "bad" | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  let apps: Record<string, boolean> = {};
  try {
    const raw = typeof window !== "undefined" ? nativeSend()?.apps?.() : "";
    apps = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    apps = {};
  }
  const onPhone = typeof window !== "undefined" && Boolean(nativeSend());
  const rows: { key: MessageKey; on: boolean }[] = [
    { key: "link.net", on: web && (typeof navigator === "undefined" || navigator.onLine !== false) },
    { key: "link.play", on: billingStatus().ready },
    { key: "link.whatsapp", on: onPhone ? apps.whatsapp === true : true },
    { key: "link.instagram", on: onPhone ? apps.instagram === true : true },
    { key: "link.facebook", on: onPhone ? apps.facebook === true : true },
    { key: "link.tiktok", on: onPhone ? apps.tiktok === true : true },
    { key: "link.mail", on: onPhone ? apps.mail === true : true },
    { key: "link.sms", on: true },
  ];
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <p className="font-medium text-ink">{t("link.title")}</p>
      <p className="text-sm text-muted">{t("link.lead")}</p>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink">{t(row.key)}</span>
            <span className={row.on ? "font-medium text-ink" : "text-muted"}>{t(row.on ? "link.ok" : "link.miss")}</span>
          </li>
        ))}
      </ul>
      <Button
        variant="quiet"
        onClick={() => {
          playTick();
          setBusy(true);
          setPing(null);
          const finish = (ok: boolean) => {
            setBusy(false);
            setPing(ok ? "ok" : "bad");
          };
          if (typeof navigator !== "undefined" && navigator.onLine === false) {
            finish(false);
            return;
          }
          void fetch("https://www.gstatic.com/generate_204", { mode: "no-cors", cache: "no-store" })
            .then(() => finish(true))
            .catch(() => finish(false));
        }}
      >
        {t("link.test")}
      </Button>
      {busy ? <p className="text-sm text-muted">…</p> : null}
      {ping ? <p className="text-sm text-ink">{t(ping === "ok" ? "link.netOk" : "link.netBad")}</p> : null}
      <div className="mt-1 flex flex-col gap-2 border-t border-line pt-3">
        <p className="font-medium text-ink">{t("play.console")}</p>
        <p className="text-sm text-muted">{t("play.consoleHint")}</p>
        <p className="text-sm text-ink">{t("play.ids")}</p>
        <p className="text-sm break-all text-muted">{typeof window === "undefined" ? "" : `${window.location.origin}/confidentialite/`}</p>
        <p className="text-sm break-all text-muted">{typeof window === "undefined" ? "" : `${window.location.origin}/suppression/`}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              playTick();
              const href = "https://play.google.com/console";
              if (!openOutside(href)) window.open(href, "_blank", "noopener");
            }}
          >
            {t("play.consoleOpen")}
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              playTick();
              const href = "https://play.google.com/store/apps/details?id=fr.bonmoment.app";
              if (!openOutside(href)) window.open(href, "_blank", "noopener");
            }}
          >
            {t("play.storeOpen")}
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              playTick();
              const href = `${window.location.origin}/confidentialite/`;
              if (!openOutside(href)) window.open(href, "_blank", "noopener");
            }}
          >
            {t("play.privacy")}
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              playTick();
              const href = `${window.location.origin}/suppression/`;
              if (!openOutside(href)) window.open(href, "_blank", "noopener");
            }}
          >
            {t("play.delete")}
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              playTick();
              const origin = window.location.origin;
              const text = [
                "Paquet : fr.bonmoment.app",
                `Politique de confidentialité : ${origin}/confidentialite/`,
                `Suppression du compte : ${origin}/suppression/`,
                "Produits (achat unique) : magique 1,99 €, don_2, don_5, don_10",
                "Play Console : https://play.google.com/console",
              ].join("\n");
              void navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => setCopied(false));
            }}
          >
            {t("play.copy")}
          </Button>
        </div>
        {copied ? <p className="text-sm text-ink">{t("play.copied")}</p> : null}
      </div>
    </section>
  );
}

function BillingPanel() {
  const t = useT();
  const on = useBonMoment((state) => state.settings.playBilling !== false);
  const setSettings = useBonMoment((state) => state.setSettings);
  const [play, setPlay] = useState<"ok" | "wait" | null>(null);
  const status = billingStatus();
  return (
    <section className="flex w-full flex-col gap-3 rounded-3xl border border-brass bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("bill.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("bill.version")}</p>
        </div>
        <span className="shrink-0 rounded-full border border-brass px-2 py-1 text-xs font-medium text-ink">{status.version}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{t("bill.switch")}</p>
          <p className="mt-1 text-sm text-muted">{t("bill.switchHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("bill.switch")}
          onClick={() => {
            playTick();
            setSettings({ playBilling: !on });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full", on ? "bg-wax" : "bg-line")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift", on ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>
      <p className="text-sm text-muted">{status.ready ? t("bill.ready") : t("bill.wait")}</p>
      {on ? (
        <>
          <p className="text-sm font-medium text-ink">{t("bill.products")}</p>
          <div className="flex flex-wrap gap-2">
            {([2, 5, 10] as const).map((euros) => (
              <Button
                key={euros}
                variant="quiet"
                onClick={() => {
                  playTick();
                  setPlay(playTip(euros));
                }}
              >
                {euros} €
              </Button>
            ))}
          </div>
          {play === "ok" ? <p className="text-sm text-muted">{t("donate.playOk")}</p> : null}
          {play === "wait" ? <p className="text-sm text-muted">{t("donate.playWait")}</p> : null}
          <p className="text-sm text-muted">{t("bill.note")}</p>
        </>
      ) : null}
    </section>
  );
}

function DonateHelp() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const donateUrl = settings.donateUrl ?? "";
  const link = paypalLink(donateUrl);
  const bad = donateUrl.trim().length > 0 && !link;
  return (
    <section className="flex flex-col items-start gap-3">
      <p className="text-sm leading-relaxed text-ink">{t("donate.legal")}</p>
      <p className="text-sm text-muted">{t("donate.separate")}</p>
      <Field label={t("donate.setup")} hint={t("donate.setupHint")}>
        <input
          id="paypal-lien"
          className={fieldClass}
          inputMode="url"
          autoComplete="off"
          maxLength={200}
          value={donateUrl}
          placeholder="https://www.paypal.me/ton-nom"
          onChange={(event) => setSettings({ donateUrl: event.target.value })}
        />
      </Field>
      {bad ? <p className="text-sm text-muted">{t("donate.linkBad")}</p> : null}
      <Button
        variant="primary"
        onClick={() => {
          playTick();
          if (link) {
            openOutside(link);
            return;
          }
          document.getElementById("paypal-lien")?.focus();
        }}
      >
        {t("donate.button")}
      </Button>
      {!link ? <p className="text-sm text-muted">{t("donate.need")}</p> : null}
      {link ? (
        <div className="flex flex-wrap gap-2">
          {[2, 5, 10].map((euros) => (
            <Button
              key={euros}
              variant="quiet"
              onClick={() => {
                playTick();
                openOutside(paypalGift(donateUrl, euros));
              }}
            >
              {euros} €
            </Button>
          ))}
        </div>
      ) : null}
      <BillingPanel />
      <Fold title={t("donate.links")}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="quiet"
            onClick={() => {
              playTick();
              openOutside(PAYPAL_CREATE);
            }}
          >
            {t("donate.create")}
          </Button>
        </div>
        <GiftField label={t("donate.lydia")} hint={t("donate.lydiaHint")} value={settings.lydiaUrl ?? ""} placeholder="https://lydia-app.com/" onChange={(lydiaUrl) => setSettings({ lydiaUrl })} />
        <GiftField label={t("donate.hello")} hint={t("donate.helloHint")} value={settings.helloassoUrl ?? ""} placeholder="https://www.helloasso.com/" onChange={(helloassoUrl) => setSettings({ helloassoUrl })} />
        <GiftField label={t("donate.revolut")} hint={t("donate.revolutHint")} value={settings.revolutUrl ?? ""} placeholder="https://revolut.me/" onChange={(revolutUrl) => setSettings({ revolutUrl })} />
        <GiftField label={t("donate.other")} hint={t("donate.otherHint")} value={settings.giftUrl ?? ""} placeholder="https://" onChange={(giftUrl) => setSettings({ giftUrl })} />
        <GiftField label={t("donate.cryptoLink")} hint={t("donate.cryptoHint")} value={settings.cryptoUrl ?? ""} placeholder="https://" onChange={(cryptoUrl) => setSettings({ cryptoUrl })} />
        <AddressField label={t("donate.btc")} scheme="bitcoin" value={settings.btcAddress ?? ""} placeholder="bc1…" onChange={(btcAddress) => setSettings({ btcAddress })} />
        <AddressField label={t("donate.eth")} scheme="ethereum" value={settings.ethAddress ?? ""} placeholder="0x…" onChange={(ethAddress) => setSettings({ ethAddress })} />
      </Fold>
    </section>
  );
}

function GiftField({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const link = giftLink(value);
  const bad = value.trim().length > 0 && !link;
  const t = useT();
  return (
    <div className="flex w-full flex-col gap-2">
      <Field label={label} hint={hint}>
        <input
          className={fieldClass}
          inputMode="url"
          autoComplete="off"
          maxLength={200}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
      {bad ? <p className="text-sm text-wax">{t("donate.linkBad")}</p> : null}
      {link ? (
        <Button
          variant="quiet"
          onClick={() => {
            playTick();
            openOutside(link);
          }}
        >
          {label}
        </Button>
      ) : null}
    </div>
  );
}

function AddressField({
  label,
  scheme,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  scheme: "bitcoin" | "ethereum";
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const t = useT();
  const clean = value.trim();
  const ok = clean.length >= 20 && !/\s/.test(clean);
  const [done, setDone] = useState(false);
  const [qr, setQr] = useState("");
  useEffect(() => {
    if (!ok) {
      setQr("");
      return;
    }
    let live = true;
    void QRCode.toDataURL(`${scheme}:${clean}`, { margin: 1, width: 180, color: { dark: "#2a2118", light: "#fffaf3" } }).then((src) => {
      if (live) setQr(src);
    });
    return () => {
      live = false;
    };
  }, [clean, ok, scheme]);
  return (
    <div className="flex w-full flex-col gap-2">
      <Field label={label} hint={t("donate.addressHint")}>
        <input
          className={fieldClass}
          autoComplete="off"
          spellCheck={false}
          maxLength={120}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
      {ok ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3">
          {qr ? <img src={qr} alt="" width={88} height={88} className="h-[88px] w-[88px] shrink-0 rounded-lg bg-white" /> : null}
          <div className="flex min-w-0 flex-col items-start gap-2">
            <p className="text-sm break-all text-ink">{clean}</p>
            <Button
              variant="quiet"
              onClick={() => {
                playTick();
                void copyText(clean).then(() => {
                  setDone(true);
                  window.setTimeout(() => setDone(false), 1600);
                });
              }}
            >
              {done ? t("donate.copied") : t("donate.copy")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const TONES: { id: ToneId; key: MessageKey }[] = [
  { id: "chaud", key: "tone.chaud" },
  { id: "humour", key: "tone.humour" },
  { id: "court", key: "tone.court" },
  { id: "poeme", key: "tone.poeme" },
];

const LEADS: { id: LeadId; key: MessageKey }[] = [
  { id: "exact", key: "lead.exact" },
  { id: "eve", key: "lead.eve" },
  { id: "early", key: "lead.early" },
];

const SNOOZES = [0, 15, 30, 60] as const;

const THEME_KEY: Record<StickerFamily, MessageKey> = {
  coeurs: "stick.hearts",
  etoiles: "stick.stars",
  bonbons: "stick.sweets",
  animaux: "stick.animals",
  halloween: "stick.halloween",
  mix: "stick.mix",
  pays: "stick.pays",
};

function StickerPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const on = settings.stickersOn !== false;
  const families = settings.stickerFamilies ?? (["coeurs", "etoiles", "bonbons", "animaux"] as StickerFamily[]);
  const picks = settings.stickerPicks ?? [];
  const way = settings.stickerWay ?? "bas";
  const when = settings.stickerWhen ?? "fond";

  function toggleFamily(id: StickerFamily) {
    const next = families.includes(id) ? families.filter((item) => item !== id) : [...families, id];
    setSettings({ stickerFamilies: next, stickerPicks: [] });
  }

  function togglePick(emoji: string) {
    const has = picks.includes(emoji);
    const next = has ? picks.filter((item) => item !== emoji) : picks.length >= 5 ? picks : [...picks, emoji];
    setSettings({ stickerPicks: next });
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("stick.on")}</p>
          <p className="mt-1 text-sm text-muted">{t("stick.onHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("stick.on")}
          onClick={() => {
            playTick();
            setSettings({ stickersOn: !on });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-wax" : "bg-line")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform", on ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>
      {on ? (
        <>
          <p className="text-sm font-medium text-ink">{t("stick.when")}</p>
          <div className="flex flex-wrap gap-2">
            {(["fond", "ouverture", "envoi"] as StickerWhen[]).map((id) => (
              <Chip key={id} active={when === id} onClick={() => setSettings({ stickerWhen: id })}>
                {t(id === "fond" ? "stick.home" : id === "ouverture" ? "stick.open" : "stick.send")}
              </Chip>
            ))}
          </div>
          <p className="text-sm font-medium text-ink">{t("stick.families")}</p>
          <div className="flex flex-wrap gap-2">
            {STICKER_THEMES.map((item) => (
              <Chip key={item.id} active={picks.length === 0 && families.includes(item.id)} onClick={() => toggleFamily(item.id)}>
                {t(THEME_KEY[item.id])}
              </Chip>
            ))}
          </div>
          <p className="text-sm font-medium text-ink">{t("stick.picks")}</p>
          <p className="text-sm text-muted">{t("stick.picksHint")}</p>
          <StickerPickButton picked={picks} onPick={togglePick} />
          <p className="text-sm font-medium text-ink">{t("stick.way")}</p>
          <div className="flex flex-wrap gap-2">
            {(["bas", "haut", "flot"] as StickerWay[]).map((id) => (
              <Chip key={id} active={way === id} onClick={() => setSettings({ stickerWay: id })}>
                {t(id === "bas" ? "stick.down" : id === "haut" ? "stick.up" : "stick.float")}
              </Chip>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ButtonShapePanel() {
  const t = useT();
  const shape = useBonMoment((state) => state.settings.buttonShape ?? "rond");
  const custom = useBonMoment((state) => state.settings.buttonCustom === true);
  const stored = useBonMoment((state) => state.settings.buttonShapes);
  const picked = stored ?? {};
  const setSettings = useBonMoment((state) => state.setSettings);
  const shapes: { id: ButtonShape; key: MessageKey }[] = [
    { id: "rond", key: "shape.rond" },
    { id: "coeur", key: "shape.coeur" },
    { id: "fleur", key: "shape.fleur" },
    { id: "etoile", key: "shape.etoile" },
    { id: "mignon", key: "shape.mignon" },
  ];
  const roles: { id: "action" | "amour" | "valider"; key: MessageKey }[] = [
    { id: "action", key: "shape.action" },
    { id: "valider", key: "shape.ok" },
    { id: "amour", key: "shape.love" },
  ];

  function setRole(role: "action" | "amour" | "valider", next: ButtonShape) {
    setSettings({ buttonShapes: { ...picked, [role]: next } });
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <p className="font-medium text-ink">{t("shape.title")}</p>
      <p className="text-sm text-muted">{t("shape.hint")}</p>
      <div className="flex flex-wrap gap-2">
        {shapes.map((item) => (
          <Chip key={item.id} active={!custom && shape === item.id} onClick={() => setSettings({ buttonShape: item.id, buttonCustom: false })}>
            {t(item.key)}
          </Chip>
        ))}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={custom}
        onClick={() => {
          playTick();
          setSettings({ buttonCustom: !custom });
        }}
        className="flex items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-medium text-ink">{t("shape.custom")}</span>
        <span className={cn("relative h-7 w-12 shrink-0 rounded-full", custom ? "bg-wax" : "bg-line")}>
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax", custom ? "translate-x-5" : "translate-x-0")} />
        </span>
      </button>
      {custom ? (
        <div className="flex flex-col gap-3">
          {roles.map((role) => (
            <div key={role.id}>
              <p className="text-sm font-medium text-ink">{t(role.key)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {shapes.map((item) => (
                  <Chip
                    key={item.id}
                    active={(picked[role.id] ?? shape) === item.id}
                    onClick={() => setRole(role.id, item.id)}
                  >
                    {t(item.key)}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-line bg-paper p-3">
        <Button variant="primary">{t("shape.previewOk")}</Button>
        <Button variant="quiet">{t("shape.previewGo")}</Button>
        <Button variant="quiet" kind="amour">{t("shape.previewLove")}</Button>
      </div>
    </div>
  );
}

function GlowSlider() {
  const t = useT();
  const glow = useBonMoment((state) => state.settings.glow ?? 60);
  const setSettings = useBonMoment((state) => state.setSettings);
  return (
    <div className="rounded-3xl border border-line bg-surface p-4">
      <p className="font-medium text-ink">{t("glow.title")}</p>
      <p className="mt-1 text-sm text-muted">{t("glow.hint")}</p>
      <input
        className="mt-3 w-full accent-wax"
        type="range"
        min={0}
        max={100}
        value={glow}
        aria-label={t("glow.title")}
        onChange={(event) => setSettings({ glow: Number(event.target.value) })}
      />
      <p className="mt-1 text-sm text-ink">{glow < 30 ? t("glow.soft") : glow > 70 ? t("glow.strong") : t("glow.mid")}</p>
    </div>
  );
}

function TonePanel() {
  const t = useT();
  const tone = useBonMoment((state) => state.settings.tone);
  const setSettings = useBonMoment((state) => state.setSettings);
  return (
    <div className="rounded-3xl border border-line bg-surface p-4">
      <p className="font-medium text-ink">{t("tone.title")}</p>
      <p className="mt-1 text-sm text-muted">{t("tone.hint")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TONES.map((item) => (
          <Chip key={item.id} active={(tone ?? "chaud") === item.id} onClick={() => setSettings({ tone: item.id })}>
            {t(item.key)}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function SignPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const on = settings.signOn === true || (settings.signOn !== false && settings.signature.trim().length > 0);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("sign.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("sign.hint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("sign.title")}
          onClick={() => {
            playTick();
            setSettings({ signOn: !on });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-wax" : "bg-line")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform", on ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>
      {on ? (
        <Field label={t("settings.signature")} hint={t("settings.signatureHint")}>
          <input
            className={fieldClass}
            maxLength={40}
            value={settings.signature}
            placeholder={t("sign.sample")}
            onChange={(event) => setSettings({ signature: event.target.value, signOn: true })}
          />
        </Field>
      ) : null}
    </div>
  );
}

function RemindPanel() {
  const t = useT();
  const lead = useBonMoment((state) => state.settings.lead ?? "exact");
  const snooze = useBonMoment((state) => state.settings.snooze ?? 0);
  const recap = useBonMoment((state) => state.settings.recapTime ?? "08:00");
  const quiet = useBonMoment((state) => state.settings.quietOn === true);
  const quietFrom = useBonMoment((state) => state.settings.quietFrom ?? "22:00");
  const quietTo = useBonMoment((state) => state.settings.quietTo ?? "07:00");
  const setSettings = useBonMoment((state) => state.setSettings);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("lead.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("lead.hint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {LEADS.map((item) => (
          <Chip key={item.id} active={lead === item.id} onClick={() => setSettings({ lead: item.id })}>
            {t(item.key)}
          </Chip>
        ))}
      </div>
      <p className="text-sm font-medium text-ink">{t("snooze.title")}</p>
      <p className="text-sm text-muted">{t("snooze.hint")}</p>
      <div className="flex flex-wrap gap-2">
        {SNOOZES.map((item) => (
          <Chip key={item} active={snooze === item} onClick={() => setSettings({ snooze: item })}>
            {item === 0 ? t("snooze.off") : t("snooze.min", { count: item })}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-ink">
        {t("remind.line", {
          lead: t(lead === "eve" ? "lead.eve" : lead === "early" ? "lead.early" : "lead.exact"),
          snooze: snooze === 0 ? t("snooze.off") : t("snooze.min", { count: snooze }),
          recap: recap || "–",
        })}
      </p>
      <Field label={t("recap.title")} hint={t("recap.hint")}>
        <input
          className={fieldClass}
          type="time"
          value={recap}
          onChange={(event) => {
            if (/^\d{2}:\d{2}$/.test(event.target.value)) setSettings({ recapTime: event.target.value, recapSent: "" });
          }}
        />
      </Field>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{t("quiet.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("quiet.hint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={quiet}
          aria-label={t("quiet.title")}
          onClick={() => {
            playTick();
            setSettings({ quietOn: !quiet });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", quiet ? "bg-wax" : "bg-line")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform", quiet ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>
      {quiet ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("quiet.from")}>
            <input className={fieldClass} type="time" value={quietFrom} onChange={(event) => setSettings({ quietFrom: event.target.value })} />
          </Field>
          <Field label={t("quiet.to")}>
            <input className={fieldClass} type="time" value={quietTo} onChange={(event) => setSettings({ quietTo: event.target.value })} />
          </Field>
        </div>
      ) : null}
      {quiet ? <p className="text-sm text-ink">{t("quiet.line", { from: quietFrom, to: quietTo })}</p> : null}
    </div>
  );
}

function DiscreetPanel() {
  const t = useT();
  const on = useBonMoment((state) => state.settings.discreet === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-ink">{t("discreet.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("discreet.hint")}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={t("discreet.title")}
        onClick={() => {
          playTick();
          setSettings({ discreet: !on });
        }}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-wax" : "bg-line")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform", on ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  );
}

function CachePanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const schedules = useBonMoment((state) => state.schedules);
  const logs = useBonMoment((state) => state.logs);
  const draft = useBonMoment((state) => state.draft);
  const clearPhotos = useBonMoment((state) => state.clearPhotos);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const failed = useSyncExternalStore(subscribeCache, cacheWriteFailed, () => false);
  const saved = [...schedules, ...logs];
  const stats = photoStats(saved);
  const draftLoose = Boolean(draft.image) && !saved.some((item) => item.image === draft.image);
  const keep = settings.keepPhotos !== false;
  const size = Math.max(stats.count > 0 ? 1 : 0, Math.round(stats.bytes / 1024));

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("cache.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("cache.hint")}</p>
        <p className="mt-2 text-sm text-ink">
          {stats.count === 0 ? t("cache.none") : t(stats.count === 1 ? "cache.countOne" : "cache.count", { count: stats.count, size })}
        </p>
        <p className={cn("mt-1 text-sm", failed ? "text-wax" : "text-muted")}>
          {failed ? t("cache.failed") : keep ? t("cache.kept") : t("cache.session")}
        </p>
        {draftLoose ? <p className="mt-1 text-sm text-muted">{t("cache.draft")}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("cache.keep")}</p>
          <p className="mt-1 text-sm text-muted">{t("cache.keepHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={keep}
          aria-label={t("cache.keep")}
          onClick={() => {
            playTick();
            setDone(false);
            setSettings({ keepPhotos: !keep });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", keep ? "bg-wax" : "bg-line")}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
              keep ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
      {stats.count > 0 ? (
        confirm ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{t("cache.clearAsk")}</span>
            <Button
              variant="primary"
              onClick={() => {
                playTick();
                clearPhotos();
                setConfirm(false);
                setDone(true);
              }}
            >
              {t("cache.clear")}
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              {t("agenda.cancel")}
            </Button>
          </div>
        ) : (
          <Button variant="quiet" className="self-start" onClick={() => setConfirm(true)}>
            {t("cache.clear")}
          </Button>
        )
      ) : null}
      {done ? <p className="text-sm text-muted">{t("cache.done")}</p> : null}
    </div>
  );
}

function VideoPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const schedules = useBonMoment((state) => state.schedules);
  const logs = useBonMoment((state) => state.logs);
  const draft = useBonMoment((state) => state.draft);
  const clearVideos = useBonMoment((state) => state.clearVideos);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [bytes, setBytes] = useState(0);
  const ids = [...new Set([...schedules, ...logs].map((item) => item.video).filter((id): id is string => Boolean(id)))];
  const key = ids.join("|");
  const draftVideo = draft.video;
  const draftLoose = draftVideo != null && !ids.includes(draftVideo);
  const keep = settings.keepVideos !== false;

  useEffect(() => {
    const list = key ? key.split("|") : [];
    let dead = false;
    void (async () => {
      let total = 0;
      for (const id of list) {
        const clip = await loadClip(id);
        if (clip) total += clip.size || clip.blob.size;
      }
      if (!dead) setBytes(total);
    })();
    return () => {
      dead = true;
    };
  }, [key]);

  const size = Math.max(ids.length > 0 ? 1 : 0, Math.round(bytes / 1024));

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("videos.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("videos.hint")}</p>
        <p className="mt-2 text-sm text-ink">
          {ids.length === 0
            ? t("videos.none")
            : t(ids.length === 1 ? "videos.countOne" : "videos.count", { count: ids.length, size })}
        </p>
        <p className="mt-1 text-sm text-muted">{keep ? t("videos.kept") : t("videos.session")}</p>
        {draftLoose ? <p className="mt-1 text-sm text-muted">{t("videos.draft")}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("videos.keep")}</p>
          <p className="mt-1 text-sm text-muted">{t("videos.keepHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={keep}
          aria-label={t("videos.keep")}
          onClick={() => {
            playTick();
            setDone(false);
            setSettings({ keepVideos: !keep });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", keep ? "bg-wax" : "bg-line")}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
              keep ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
      {ids.length > 0 ? (
        confirm ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{t("videos.clearAsk")}</span>
            <Button
              variant="primary"
              onClick={() => {
                playTick();
                clearVideos();
                setConfirm(false);
                setDone(true);
              }}
            >
              {t("videos.clear")}
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              {t("agenda.cancel")}
            </Button>
          </div>
        ) : (
          <Button variant="quiet" className="self-start" onClick={() => setConfirm(true)}>
            {t("videos.clear")}
          </Button>
        )
      ) : null}
      {done ? <p className="text-sm text-muted">{t("videos.done")}</p> : null}
    </div>
  );
}

function UnsentPanel() {
  const t = useT();
  const on = useBonMoment((state) => state.settings.unsentOn !== false);
  const every = useBonMoment((state) => state.settings.unsentEvery ?? 60);
  const setSettings = useBonMoment((state) => state.setSettings);
  const steps = [30, 60, 120];
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("unsent.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("unsent.hint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("unsent.title")}
          onClick={() => {
            playTick();
            setSettings({ unsentOn: !on, unsentAt: 0 });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-wax" : "bg-line")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform", on ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>
      {on ? (
        <div className="flex flex-wrap gap-2">
          {steps.map((item) => (
            <Chip
              key={item}
              active={every === item}
              onClick={() => {
                playTick();
                setSettings({ unsentEvery: item, unsentAt: 0 });
              }}
            >
              {item < 60 ? t("unsent.min", { count: item }) : t("unsent.hour", { count: item / 60 })}
            </Chip>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function TellPanel() {
  const t = useT();
  const tellBy = useBonMoment((state) => state.settings.tellBy ?? "none");
  const tellGot = useBonMoment((state) => state.settings.tellGot === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  const who = currentWho();
  const choices = ["none", "mail", "sms", "social"] as const;
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("tell.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("tell.lead")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {choices.map((id) => (
          <Chip
            key={id}
            active={tellBy === id}
            onClick={() => {
              playTick();
              setSettings({ tellBy: id });
            }}
          >
            {t(`tell.${id}`)}
          </Chip>
        ))}
      </div>
      {tellBy === "mail" && !who?.email ? <p className="text-sm text-muted">{t("tell.needMail")}</p> : null}
      {tellBy === "sms" && !who?.phone ? <p className="text-sm text-muted">{t("tell.needPhone")}</p> : null}
      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" checked={tellGot} onChange={(event) => setSettings({ tellGot: event.target.checked })} />
        {t("tell.got")}
      </label>
      <p className="text-sm text-muted">{t("tell.gotHint")}</p>
    </section>
  );
}

function NotifyPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const on = settings.notify !== false;
  const [perm, setPerm] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("settings.notify")}</p>
          <p className="mt-1 text-sm text-muted">{t("settings.notifyHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("settings.notify")}
          onClick={() => {
            playTick();
            const next = !on;
            setSettings({ notify: next });
            if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
              void Notification.requestPermission().then((result) => setPerm(result));
            }
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-wax" : "bg-line")}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
              on ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
      {perm === "granted" ? <p className="text-sm text-muted">{t("settings.notifyOn")}</p> : null}
      {perm === "denied" ? <p className="text-sm text-wax">{t("settings.notifyOff")}</p> : null}
      {perm === "default" ? (
        <Button
          variant="quiet"
          className="self-start"
          onClick={() => {
            if (typeof Notification === "undefined") return;
            void Notification.requestPermission().then((result) => {
              setPerm(result);
              if (result === "granted") setSettings({ notify: true });
            });
          }}
        >
          {t("settings.notifyAsk")}
        </Button>
      ) : null}
    </div>
  );
}

function LargePanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const on = settings.large === true;
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-ink">{t("settings.large")}</p>
        <p className="mt-1 text-sm text-muted">{t("settings.largeHint")}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={t("settings.large")}
        onClick={() => {
          playTick();
          setSettings({ large: !on });
        }}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-wax" : "bg-line")}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
            on ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

const SCENES: { id: WallpaperId; key: MessageKey; emoji: string }[] = [
  { id: "auto", key: "fun.scene.auto", emoji: "🎈" },
  { id: "anniversaire", key: "fun.scene.anniversaire", emoji: "🎂" },
  { id: "noel", key: "fun.scene.noel", emoji: "🎄" },
  { id: "nouvel-an", key: "fun.scene.an", emoji: "🎆" },
  { id: "coeurs", key: "fun.scene.coeurs", emoji: "💕" },
  { id: "jardin", key: "fun.scene.jardin", emoji: "🌷" },
  { id: "aurore", key: "fun.scene.aurore", emoji: "🌅" },
  { id: "foret", key: "fun.scene.foret", emoji: "🌲" },
  { id: "soleil", key: "fun.scene.soleil", emoji: "☀️" },
  { id: "lavande", key: "fun.scene.lavande", emoji: "💜" },
  { id: "mer", key: "fun.scene.mer", emoji: "🌊" },
  { id: "neige", key: "fun.scene.neige", emoji: "❄️" },
  { id: "etoiles", key: "fun.scene.etoiles", emoji: "✨" },
  { id: "paillettes", key: "fun.scene.paillettes", emoji: "💖" },
  { id: "bonbons", key: "fun.scene.bonbons", emoji: "🍬" },
  { id: "chatons", key: "fun.scene.chatons", emoji: "🐱" },
  { id: "arc", key: "fun.scene.arc", emoji: "🌈" },
  { id: "papillons", key: "fun.scene.papillons", emoji: "🦋" },
  { id: "ballons", key: "fun.scene.ballons", emoji: "🎈" },
  { id: "lune", key: "fun.scene.lune", emoji: "🌙" },
  { id: "fraises", key: "fun.scene.fraises", emoji: "🍓" },
  { id: "neon", key: "fun.scene.neon", emoji: "🌃" },
  { id: "hologramme", key: "fun.scene.hologramme", emoji: "💠" },
  { id: "cyber", key: "fun.scene.cyber", emoji: "🤖" },
  { id: "laser", key: "fun.scene.laser", emoji: "⚡" },
  { id: "off", key: "fun.scene.off", emoji: "🚫" },
];

const LEVELS: { id: FunLevel; key: MessageKey }[] = [
  { id: "calme", key: "fun.calme" },
  { id: "fete", key: "fun.fete" },
  { id: "folie", key: "fun.folie" },
];

function ShapeFrame({ shape }: { shape: PhotoShape }) {
  const t = useT();
  return (
    <div
      className={cn(
        "shape-frame mx-auto flex items-center justify-center rounded-3xl border-2 border-wax bg-paper px-3 text-center text-sm font-medium text-ink transition-all duration-300",
        shape === "square" && "size-40",
        shape === "landscape" && "h-24 w-full max-w-sm",
        shape === "portrait" && "h-56 w-36",
        shape === "free" && "h-28 w-full",
      )}
    >
      {t(SHAPE_KEY[shape])}
    </div>
  );
}

const FREE_THEMES = new Set<ColorId>(["bordeaux", "noir", "rose", "relief"]);

const BUTTON_COLORS: { id: ColorId; key: MessageKey; swatch: string }[] = [
  { id: "bordeaux", key: "color.bordeaux", swatch: "#8e2f2c" },
  { id: "relief", key: "color.relief", swatch: "linear-gradient(180deg,#ffe7dc 0%,#ff6a3d 42%,#8d2e18 43%,#c9b7a4 100%)" },
  { id: "noir", key: "color.noir", swatch: "#161311" },
  { id: "rose", key: "color.rose", swatch: "#f2b6c6" },
  { id: "crayon", key: "color.crayon", swatch: "linear-gradient(135deg,#f7f4ee,#6e6a64,#1a1a1a)" },
  { id: "pop", key: "color.pop", swatch: "linear-gradient(135deg,#5ce1ff,#ff2bd6,#ffe14a)" },
  { id: "arcade", key: "color.arcade", swatch: "linear-gradient(135deg,#12081c,#39ff14,#ff2bd6)" },
  { id: "parchemin", key: "color.parchemin", swatch: "linear-gradient(135deg,#f3e6c8,#8a6232,#c6a15b)" },
  { id: "cosmique", key: "color.cosmique", swatch: "linear-gradient(135deg,#0c1024,#7a6cff,#d4c4ff)" },
  { id: "halloween", key: "color.halloween", swatch: "linear-gradient(135deg,#ee7a1a,#1a1024,#7a4bb8)" },
  { id: "ete", key: "color.ete", swatch: "linear-gradient(135deg,#f0c14a,#1498a8,#f3e0b8)" },
  { id: "hiver", key: "color.hiver", swatch: "linear-gradient(135deg,#d7e6f2,#7ea4c8,#c5ced6)" },
  { id: "arc", key: "color.arc", swatch: "linear-gradient(135deg,#e85d8c,#f0a04a,#e8d25a,#5cba7a,#4aa0e0,#8a6ad4)" },
  { id: "fluo", key: "color.fluo", swatch: "#ff2d55" },
  { id: "neon", key: "color.neon", swatch: "#ff6a00" },
  { id: "soleil", key: "color.soleil", swatch: "#ffe14a" },
  { id: "menthe", key: "color.menthe", swatch: "#1ec98a" },
  { id: "elec", key: "color.elec", swatch: "#2f6bff" },
  { id: "flash", key: "color.flash", swatch: "#9b4dff" },
  { id: "bonbon", key: "color.bonbon", swatch: "#ff4fa3" },
  { id: "or", key: "color.or", swatch: "#e0b43a" },
  { id: "bleu", key: "color.bleu", swatch: "#2f7fbe" },
  { id: "violet", key: "color.violet", swatch: "#6d4ea8" },
  { id: "vert", key: "color.vert", swatch: "#2f8a5b" },
];

const PAPER_COLORS: { id: PaperId; key: MessageKey; swatch: string }[] = [
  { id: "creme", key: "paper.creme", swatch: "#f4efe6" },
  { id: "corail", key: "paper.corail", swatch: "#ff6f61" },
  { id: "lagon", key: "paper.lagon", swatch: "#12d6c8" },
  { id: "soleil", key: "paper.soleil", swatch: "#ffe14a" },
  { id: "mandarine", key: "paper.mandarine", swatch: "#ff8a1a" },
  { id: "fuchsia", key: "paper.fuchsia", swatch: "#ff3d9a" },
  { id: "citron", key: "paper.citron", swatch: "#c6ff3d" },
  { id: "ocean", key: "paper.ocean", swatch: "#245bff" },
  { id: "prune", key: "paper.prune", swatch: "#6a2bd6" },
  { id: "aurore", key: "paper.aurore", swatch: "linear-gradient(135deg,#ff5d8f,#ffb703,#7ae0c2)" },
  { id: "cosmos", key: "paper.cosmos", swatch: "linear-gradient(135deg,#1b1140,#6a2bd6,#ff3d9a)" },
  { id: "ciel", key: "paper.ciel", swatch: "#e5f3ff" },
  { id: "paille", key: "paper.paille", swatch: "#fff4c8" },
  { id: "poudre", key: "paper.poudre", swatch: "#ffe4ef" },
  { id: "eau", key: "paper.eau", swatch: "#dff6ee" },
  { id: "lilas", key: "paper.lilas", swatch: "#f0e6ff" },
  { id: "peche", key: "paper.peche", swatch: "#ffe6d6" },
  { id: "sable", key: "paper.sable", swatch: "#f3e6d4" },
  { id: "nuit", key: "paper.nuit", swatch: "#14110f" },
  { id: "douce", key: "paper.douce", swatch: "linear-gradient(135deg,#ffe4ef,#fff3c9,#d9f6e4,#d7ecff)" },
  { id: "futur", key: "paper.futur", swatch: "linear-gradient(135deg,#07041a,#00f0ff,#7a6cff)" },
  { id: "neon", key: "paper.neon", swatch: "linear-gradient(135deg,#12081c,#ff2bd6,#39ff14)" },
];

function ColorRail<T extends string>({
  label,
  value,
  items,
  onPick,
  locked,
}: {
  label: string;
  value: T;
  items: { id: T; key: MessageKey; swatch: string }[];
  onPick: (id: T) => void;
  locked?: (id: T) => boolean;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const on = value === item.id;
          const shut = locked?.(item.id) === true;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(item.id)}
              className="relative flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <span
                className={cn("size-11 rounded-full border-2", on ? "border-ink" : "border-white", shut && "opacity-80")}
                style={{ background: item.swatch, boxShadow: "inset 0 0 0 1px #1c181426" }}
              />
              {shut ? <span className="absolute top-0 right-1 text-xs" aria-hidden>✨</span> : null}
              <span className="text-center text-xs leading-tight text-ink">{t(item.key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const VIVID_COLORS: { id: ColorId; key: MessageKey; swatch: string }[] = [
  { id: "fluo", key: "color.fluo", swatch: "#ff2d55" },
  { id: "neon", key: "color.neon", swatch: "#ff6a00" },
  { id: "soleil", key: "color.soleil", swatch: "#ffe14a" },
  { id: "menthe", key: "color.menthe", swatch: "#1ec98a" },
  { id: "elec", key: "color.elec", swatch: "#2f6bff" },
  { id: "flash", key: "color.flash", swatch: "#9b4dff" },
  { id: "bonbon", key: "color.bonbon", swatch: "#ff4fa3" },
  { id: "arcade", key: "color.arcade", swatch: "#39ff14" },
];

function ThemeRail() {
  const t = useT();
  const color = useBonMoment((state) => state.settings.color ?? "bordeaux");
  const pro = useBonMoment((state) => state.settings.plan === "pro");
  const setSettings = useBonMoment((state) => state.setSettings);
  const [query, setQuery] = useState("");
  const items = BUTTON_COLORS.filter((item) => matchesQuery(query, [t(item.key), item.id]));
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <SearchBar value={query} onChange={setQuery} placeholder={t("color.find")} />
      <ColorRail
        label={t("color.vivid")}
        value={color}
        items={VIVID_COLORS}
        locked={(id) => !pro && !FREE_THEMES.has(id)}
        onPick={(id) => {
          if (!pro && !FREE_THEMES.has(id)) {
            requestPlan();
            return;
          }
          playTick();
          setSettings({ color: id });
        }}
      />
      <ColorRail
        label={t("color.buttons")}
        value={color}
        items={items}
        locked={(id) => !pro && !FREE_THEMES.has(id)}
        onPick={(id) => {
          if (!pro && !FREE_THEMES.has(id)) {
            requestPlan();
            return;
          }
          playTick();
          setSettings({ color: id });
        }}
      />
    </div>
  );
}

function PaperPanel() {
  const t = useT();
  const paper = useBonMoment((state) => state.settings.paper ?? "creme");
  const setSettings = useBonMoment((state) => state.setSettings);
  const [paperQuery, setPaperQuery] = useState("");
  const papers = PAPER_COLORS.filter((item) => matchesQuery(paperQuery, [t(item.key), item.id]));
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("color.paper")}</p>
      </div>
      <SearchBar value={paperQuery} onChange={setPaperQuery} placeholder={t("color.find")} />
      <ColorRail label={t("color.paper")} value={paper} items={papers} onPick={(id) => setSettings({ paper: id })} />
    </div>
  );
}

function ShowSwitch({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} className="flex items-center justify-between gap-3 text-left">
      <span className="min-w-0 flex-1 text-sm font-medium text-ink">{label}</span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full", on ? "bg-wax" : "bg-line")}>
        <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax transition-transform", on ? "translate-x-5" : "translate-x-0")} />
      </span>
    </button>
  );
}

function ShowPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const hints = settings.hints !== false;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <p className="font-medium text-ink">{t("show.title")}</p>
      <ShowSwitch
        on={hints}
        label={t("show.hints")}
        onClick={() => {
          playTick();
          setSettings({ hints: !hints });
        }}
      />
      <ShowSwitch
        on={settings.startHidden !== true}
        label={t("show.start")}
        onClick={() => {
          playTick();
          const shown = settings.startHidden !== true;
          setSettings({ startHidden: shown });
        }}
      />
    </div>
  );
}

function FunPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const celebrate = useBonMoment((state) => state.celebrate);
  const scene = settings.wallpaperId ?? (settings.wallpaper === false ? "off" : "auto");
  const fun = settings.fun ?? "fete";
  const [pop, setPop] = useState<{ id: WallpaperId; n: number } | null>(null);
  return (
    <fieldset className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
      <legend className="font-medium text-ink">{t("fun.title")}</legend>
      <p className="text-sm text-muted">{t("fun.hint")}</p>
      <p className="text-sm font-medium text-ink">{t("fun.wallpaper")}</p>
      <div className="flex flex-wrap gap-2">
        {SCENES.map((item) => {
          const on = scene === item.id;
          const look = sceneLook(item.id);
          return (
            <Chip
              key={item.id}
              active={on}
              style={
                item.id === "off"
                  ? undefined
                  : { background: look.chip, color: "#1a1020", borderColor: on ? "#1a1020" : look.chip }
              }
              onClick={() => {
                playTick();
                setSettings({ wallpaperId: item.id, wallpaper: item.id !== "off" });
                const n = Date.now();
                setPop({ id: item.id, n });
                window.setTimeout(() => setPop((current) => (current?.n === n ? null : current)), 1200);
              }}
            >
              <span aria-hidden>{item.emoji}</span>
              {t(item.key)}
            </Chip>
          );
        })}
      </div>
      {pop ? <ScenePop key={pop.n} id={pop.id} /> : null}
      <p className="text-sm font-medium text-ink">{t("fun.level")}</p>
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((item) => (
          <Chip
            key={item.id}
            active={fun === item.id}
            onClick={() => {
              playTick();
              setSettings({ fun: item.id });
              if (item.id === "folie") celebrate();
            }}
          >
            {t(item.key)}
          </Chip>
        ))}
      </div>
      <p className="text-sm font-medium text-ink">{t(fun === "calme" ? "fun.now.calme" : fun === "folie" ? "fun.now.folie" : "fun.now.fete")}</p>
      <Button
        variant="primary"
        onClick={() => {
          playChime();
          celebrate();
        }}
      >
        {t("fun.try")}
      </Button>
    </fieldset>
  );
}

const WHEN: { id: AutoWhen; key: MessageKey }[] = [
  { id: "heure", key: "auto.heure" },
  { id: "maintenant", key: "auto.now" },
  { id: "manuel", key: "auto.manual" },
];

function AutoPanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const when = settings.autoWhen ?? (settings.autoSend === false ? "manuel" : "heure");
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
      <ol className="flex flex-col gap-4">
        <li className="flex gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-wax text-sm text-onwax">1</span>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="font-medium text-ink">{t("auto.step1")}</p>
            <div className="flex flex-wrap gap-2">
              {WHEN.map((item) => (
                <Chip
                  key={item.id}
                  active={when === item.id}
                  onClick={() => {
                    playTick();
                    setSettings({ autoWhen: item.id, autoSend: item.id !== "manuel" });
                  }}
                >
                  {t(item.key)}
                </Chip>
              ))}
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-wax text-sm text-onwax">2</span>
          <p className="pt-0.5 text-sm leading-relaxed text-ink">{t("auto.step2")}</p>
        </li>
        <li className="flex gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-wax text-sm text-onwax">3</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{t("auto.step3")}</p>
            <div className="mt-2">
              <GatewayFields />
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}

function noteFor(reason: GateReason): MessageKey {
  if (reason === "off") return "gate.off";
  if (reason === "denied") return "gate.denied";
  if (reason === "need-key") return "gate.need";
  if (reason === "bad" || reason === "bad-url") return "gate.bad";
  if (reason === "limit") return "gate.limit";
  return "gate.fail";
}

function GatewayFields() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const [note, setNote] = useState<MessageKey | null>(null);
  const on = settings.gateway === true;
  return (
    <div className="mt-2 flex flex-col gap-3 border-t border-line pt-3">
      <div>
        <p className="font-medium text-ink">{t("gate.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("gate.hint")}</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink">{t("gate.switch")}</p>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("gate.switch")}
          onClick={() => {
            playTick();
            setSettings({ gateway: !on });
            setNote(null);
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full", on ? "bg-wax" : "bg-line")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift", on ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>
      <Field label={t("gate.key")} hint={t("gate.keyHint")}>
        <input
          className={fieldClass}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={settings.gatewayKey ?? ""}
          onChange={(event) => setSettings({ gatewayKey: event.target.value })}
        />
      </Field>
      {(settings.gatewayKey ?? "").trim().length > 0 ? <p className="text-sm text-ink">{t("gate.saved")}</p> : null}
      <p className="text-sm text-muted">{t("auto.battery")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="quiet"
          onClick={() => {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            const key = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
            setSettings({ gatewayKey: key });
            setNote("gate.copied");
            void copyText(key).catch(() => setNote(null));
          }}
        >
          {t("gate.make")}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            const key = settings.gatewayKey ?? "";
            if (!key.trim()) {
              setNote("gate.need");
              return;
            }
            void copyText(key).then(
              () => setNote("gate.copied"),
              () => setNote("gate.fail"),
            );
          }}
        >
          {t("gate.copy")}
        </Button>
      </div>
      {on ? (
        <>
          <Field label={t("gate.url")} hint={t("gate.urlHint")}>
            <input
              className={fieldClass}
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://"
              value={settings.gatewayUrl ?? ""}
              onChange={(event) => setSettings({ gatewayUrl: event.target.value })}
            />
          </Field>
          <Button
            variant="quiet"
            onClick={() => {
              void askGateway({
                key: settings.gatewayKey ?? "",
                url: settings.gatewayUrl ?? "",
                ping: true,
              }).then((result) => setNote(result.ok ? "gate.ready" : noteFor(result.reason)));
            }}
          >
            {t("gate.check")}
          </Button>
        </>
      ) : null}
      {note ? <p className="text-sm text-muted">{t(note)}</p> : null}
    </div>
  );
}

function LegalPanel() {
  const t = useT();
  const eraseAll = useBonMoment((state) => state.eraseAll);
  const [ask, setAsk] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("effacer"),
  );
  return (
    <div className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="mt-1 text-sm text-muted">{t("legal.noAccount")}</p>
      </div>
      <a className="flex min-h-11 w-full items-center rounded-2xl border border-line bg-paper px-3 text-sm font-medium text-ink" href="/confidentialite/">
        {t("legal.privacy")}
      </a>
      <a className="flex min-h-11 w-full items-center rounded-2xl border border-line bg-paper px-3 text-sm font-medium text-ink" href="/confidentialite/#conditions">
        {t("legal.terms")}
      </a>
      <button
        type="button"
        onClick={() => setAsk(true)}
        className="inline-flex h-11 items-center rounded-full bg-[#8f2d2d] px-4 text-sm font-medium text-white"
      >
        {t("legal.deleteAccount")}
      </button>
      <a className="text-sm font-medium text-wax underline" href="/suppression/">
        {t("legal.delete")}
      </a>
      <p className="text-sm text-muted">{t("legal.reportHint")}</p>
      {ask && typeof document !== "undefined"
        ? createPortal(
            <div className="veil-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={() => setAsk(false)}>
              <div
                role="dialog"
                aria-modal="true"
                className="sheet-in w-full max-w-md rounded-3xl border border-line bg-surface p-5 shadow-lift"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="text-base leading-relaxed text-ink">{t("legal.sure")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center rounded-full bg-[#8f2d2d] px-4 text-sm font-medium text-white"
                    onClick={() => {
                      eraseAll();
                      if (typeof window !== "undefined") window.history.replaceState({}, "", "/");
                      setAsk(false);
                    }}
                  >
                    {t("legal.yes")}
                  </button>
                  <Button variant="ghost" onClick={() => setAsk(false)}>
                    {t("agenda.cancel")}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function VoicePanel() {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const schedules = useBonMoment((state) => state.schedules);
  const logs = useBonMoment((state) => state.logs);
  const draft = useBonMoment((state) => state.draft);
  const clearVoices = useBonMoment((state) => state.clearVoices);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const ids = [...new Set([...schedules, ...logs].map((item) => item.voice).filter((id): id is string => Boolean(id)))];
  const draftVoice = draft.voice;
  const draftLoose = draftVoice != null && !ids.includes(draftVoice);
  const keep = settings.keepVoices !== false;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("voices.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("voices.hint")}</p>
        <p className="mt-2 text-sm text-ink">
          {ids.length === 0 ? t("voices.none") : t(ids.length === 1 ? "voices.countOne" : "voices.count", { count: ids.length })}
        </p>
        <p className="mt-1 text-sm text-muted">{keep ? t("voices.kept") : t("voices.session")}</p>
        {draftLoose ? <p className="mt-1 text-sm text-muted">{t("voices.draft")}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("voices.keep")}</p>
          <p className="mt-1 text-sm text-muted">{t("voices.keepHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={keep}
          aria-label={t("voices.keep")}
          onClick={() => {
            playTick();
            setDone(false);
            setSettings({ keepVoices: !keep });
          }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", keep ? "bg-wax" : "bg-line")}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-onwax shadow-lift transition-transform",
              keep ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
      {ids.length > 0 ? (
        confirm ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{t("voices.clearAsk")}</span>
            <Button
              variant="primary"
              onClick={() => {
                playTick();
                clearVoices();
                setConfirm(false);
                setDone(true);
              }}
            >
              {t("voices.clear")}
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              {t("agenda.cancel")}
            </Button>
          </div>
        ) : (
          <Button variant="quiet" className="self-start" onClick={() => setConfirm(true)}>
            {t("voices.clear")}
          </Button>
        )
      ) : null}
      {done ? <p className="text-sm text-muted">{t("voices.done")}</p> : null}
    </div>
  );
}

function TempPanel() {
  const t = useT();
  const clearTemporary = useBonMoment((state) => state.clearTemporary);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("temp.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("temp.hint")}</p>
      </div>
      {confirm ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{t("temp.ask")}</span>
          <Button
            variant="primary"
            onClick={() => {
              playTick();
              clearTemporary();
              setConfirm(false);
              setDone(true);
            }}
          >
            {t("temp.clear")}
          </Button>
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            {t("agenda.cancel")}
          </Button>
        </div>
      ) : (
        <Button
          variant="quiet"
          className="self-start"
          onClick={() => {
            setDone(false);
            setConfirm(true);
          }}
        >
          {t("temp.clear")}
        </Button>
      )}
      {done ? <p className="text-sm text-muted">{t("temp.done")}</p> : null}
    </div>
  );
}
