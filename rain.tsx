import { useEffect, useRef, useState } from "react";
import { resolveScene, sceneEmojis } from "./wallpaper";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { Settings, StickerFamily } from "@/lib/bonmoment/types";

export const STICKER_THEMES: { id: StickerFamily; emojis: string[] }[] = [
  { id: "coeurs", emojis: ["❤️", "💕", "💖", "💗", "💘", "💝"] },
  { id: "etoiles", emojis: ["⭐", "✨", "🌟", "💫", "✴️", "⚡️"] },
  { id: "bonbons", emojis: ["🍬", "🍭", "🍫", "🍪", "🧁", "🍩"] },
  { id: "animaux", emojis: ["🐰", "🐱", "🐶", "🐻", "🐥", "🐼"] },
  { id: "halloween", emojis: ["🎃", "👻", "💀", "🦇", "🧙‍♀️", "😈", "🧛", "🧟", "👽", "🤡"] },
  { id: "mix", emojis: ["🌈", "🎈", "🎉", "🌸", "🦋", "🌙", "❄️", "🔥", "🎵", "💎", "🦄", "🍓", "🛑", "🚀", "👑"] },
  { id: "pays", emojis: ["🇫🇷", "🇧🇪", "🇨🇭", "🇨🇦", "🇲🇦", "🇩🇿", "🇹🇳", "🇸🇳", "🇵🇹", "🇪🇸", "🇮🇹", "🇩🇪", "🇬🇧", "🇺🇸", "🇧🇷", "🇯🇵", "🇨🇳", "🇮🇳", "🇹🇷", "🇱🇧"] },
];

const FAMILIES: Record<StickerFamily, string[]> = {
  coeurs: STICKER_THEMES[0].emojis,
  etoiles: STICKER_THEMES[1].emojis,
  bonbons: STICKER_THEMES[2].emojis,
  animaux: STICKER_THEMES[3].emojis,
  halloween: STICKER_THEMES[4].emojis,
  mix: STICKER_THEMES[5].emojis,
  pays: STICKER_THEMES[6].emojis,
};

export const STICKER_CHOICES = STICKER_THEMES.flatMap((theme) => theme.emojis);

export function stickerBits(settings: Settings, sceneBits: string[] = []): string[] {
  const picks = (settings.stickerPicks ?? []).filter(Boolean).slice(0, 5);
  if (picks.length > 0) return picks;
  const chosen = settings.stickerFamilies;
  if (chosen && chosen.length > 0 && chosen.length < 4) {
    const bits = chosen.flatMap((id) => FAMILIES[id] ?? []);
    if (bits.length > 0) return bits;
  }
  if (sceneBits.length > 0) return sceneBits;
  const families = chosen ?? (["coeurs", "etoiles", "bonbons", "animaux"] as StickerFamily[]);
  const bits = families.flatMap((id) => FAMILIES[id] ?? []);
  return bits.length > 0 ? bits : FAMILIES.coeurs;
}

export function StickerRain() {
  const settings = useBonMoment((state) => state.settings);
  const tab = useBonMoment((state) => state.tab);
  const confetti = useBonMoment((state) => state.confetti);
  const on = settings.stickersOn !== false;
  const when = settings.stickerWhen ?? "fond";
  const [show, setShow] = useState(false);
  const [awake, setAwake] = useState(true);
  const opened = useRef(false);
  const seen = useRef(confetti);
  const occasion = useBonMoment((state) => state.draft.occasion);
  const wallpaperId = settings.wallpaperId ?? (settings.wallpaper === false ? "off" : "auto");
  const scene = resolveScene(wallpaperId, occasion, tab);

  useEffect(() => {
    const sync = () => {
      const hidden = document.visibilityState !== "visible";
      setAwake(!hidden);
      document.documentElement.classList.toggle("fx-paused", hidden || !on);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [on]);

  useEffect(() => {
    if (!on) {
      setShow(false);
      return;
    }
    if (when === "fond" || (settings.stickerPicks ?? []).filter(Boolean).length > 0) {
      setShow(true);
      return;
    }
    if (when === "ouverture") {
      if (opened.current) return;
      opened.current = true;
      setShow(true);
      const timer = window.setTimeout(() => setShow(false), 5200);
      return () => window.clearTimeout(timer);
    }
    setShow(false);
  }, [on, when, tab, scene, settings.stickerPicks]);

  useEffect(() => {
    if (confetti === seen.current) return;
    seen.current = confetti;
    if (!on || when !== "envoi" || confetti === 0) return;
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), 4200);
    return () => window.clearTimeout(timer);
  }, [confetti, on, when]);

  if (!show || !awake) return null;
  const bits = stickerBits(settings, scene ? sceneEmojis(scene) : []);
  const picked = (settings.stickerPicks ?? []).filter(Boolean).slice(0, 5);
  const density = settings.stickerDensity ?? "leger";
  const floor = picked.length > 0 ? picked.length : 5;
  const dur = (settings.stickerSpeed ?? "lent") === "vite" ? 4.6 : 12;
  const way = settings.stickerWay ?? "bas";
  const motion = way === "haut" ? "rain-up" : way === "flot" ? "rain-float" : "rain-down";
  const chosen = picked.length > 0 ? picked : bits;
  const season =
    settings.color === "halloween" ? ["🎃", "🦇", "👻"] : settings.color === "hiver" ? ["❄️", "☃️", "✨"] : settings.color === "ete" ? ["☀️", "🌊", "🐚"] : [];
  const flakes = season.length > 0 ? [...season, ...chosen] : chosen;
  const count = Math.min(5, density === "folie" ? 8 : density === "moyen" ? 6 : Math.max(4, Math.min(floor, 5)));
  const size = (settings.stickerSize ?? "moyen") === "petit" ? 16 : (settings.stickerSize ?? "moyen") === "grand" ? 44 : 28;
  return (
    <div className="pointer-events-none fixed inset-0 z-[12] overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, index) => {
        const slot = index % Math.max(1, flakes.length);
        const left = 3 + ((index * 37 + 11) % 91);
        const scale = [0.55, 0.78, 1, 1.28, 1.62][index % 5];
        const gust = (index % 2 === 0 ? 1 : -1) * (32 + (index % 4) * 16);
        const spin = (index % 2 === 0 ? 1 : -1) * (36 + (index % 5) * 22);
        return (
        <span
          key={`${flakes[slot]}-${index}`}
          className={`rain-bit absolute ${motion}`}
          style={{
            left: `${left}%`,
            top: way === "flot" ? `${8 + ((index * 17) % 72)}%` : undefined,
            fontSize: `${Math.round(size * scale)}px`,
            ["--dur" as string]: `${dur + (index % 5) * 1.6}s`,
            ["--delay" as string]: `-${((index * 1.9) % dur).toFixed(2)}s`,
            ["--drift" as string]: `${((index * 17) % 48) - 24}px`,
            ["--gust" as string]: `${gust}px`,
            ["--spin" as string]: `${spin}deg`,
          }}
        >
          {flakes[slot]}
        </span>
        );
      })}
    </div>
  );
}
