import { useEffect, useRef, useState } from "react";
import type { FunLevel, OccasionId, TabId, WallpaperId } from "@/lib/bonmoment/types";
import { Confetti } from "./confetti";

export type SceneId =
  | "anniversaire"
  | "noel"
  | "nouvel-an"
  | "saint-valentin"
  | "fete-meres"
  | "fete-peres"
  | "merci"
  | "autre"
  | "coeurs"
  | "jardin"
  | "aurore"
  | "foret"
  | "soleil"
  | "lavande"
  | "mer"
  | "neige"
  | "etoiles"
  | "paillettes"
  | "bonbons"
  | "chatons"
  | "arc"
  | "papillons"
  | "ballons"
  | "lune"
  | "fraises"
  | "neon"
  | "hologramme"
  | "cyber"
  | "laser";

function paint(stops: [string, string, string, string]): string {
  const [a, b, c, d] = stops;
  return `linear-gradient(155deg, ${a} 0%, ${b} 32%, ${c} 68%, ${d} 100%)`;
}

const SCENES: Record<SceneId, { wash: string; night: string; emojis: string[] }> = {
  anniversaire: {
    wash: paint(["#ff2d78", "#ffe600", "#ff6a00", "#ff4fd8"]),
    night: paint(["#7a1038", "#4a1840", "#6a2808", "#5a1040"]),
    emojis: ["🎈", "🎂", "🎉", "🎁", "✨", "🎊", "🧁", "💖", "🥳", "🎀", "🌟", "🍰"],
  },
  noel: {
    wash: paint(["#e10600", "#00c853", "#ffe600", "#ff2d78"]),
    night: paint(["#5a0818", "#063820", "#4a3008", "#4a0828"]),
    emojis: ["🎄", "❄️", "⭐", "🎁", "🎅", "🔔", "🕯️", "🧦", "✨", "🍬", "🌟", "🦌"],
  },
  "nouvel-an": {
    wash: paint(["#7a1cff", "#ff2bd6", "#ffe600", "#00e5ff"]),
    night: paint(["#2a0860", "#5a0848", "#4a3008", "#083048"]),
    emojis: ["🎆", "🥂", "✨", "🎇", "🎉", "🕛", "💫", "🎊", "🌟", "🍾", "🪩", "💛"],
  },
  "saint-valentin": {
    wash: paint(["#ff1744", "#ff4d8d", "#ff80ab", "#ff2d55"]),
    night: paint(["#6c0828", "#4a0820", "#5a1030", "#2a0818"]),
    emojis: ["💌", "❤️", "🌹", "💕", "✨", "💘", "🌸", "💖", "😍", "🎀"],
  },
  "fete-meres": {
    wash: paint(["#ff2e93", "#ff66cc", "#ffe600", "#ff8a00"]),
    night: paint(["#5a0840", "#3a0848", "#4a2808", "#4a0830"]),
    emojis: ["🌸", "💐", "🌷", "💖", "✨", "🦋", "🌼", "💗", "🌺", "🎁"],
  },
  "fete-peres": {
    wash: paint(["#1a6bff", "#00e5ff", "#ffe600", "#ff6a00"]),
    night: paint(["#082848", "#3a2808", "#083048", "#2a1808"]),
    emojis: ["☕", "🌟", "🎁", "💛", "✨", "🌿", "🎉", "🧢", "⚽", "💙"],
  },
  merci: {
    wash: paint(["#ff8a00", "#ffe600", "#ff3d00", "#ffcc00"]),
    night: paint(["#4a2808", "#5a1808", "#3a2808", "#2a1408"]),
    emojis: ["🙏", "💛", "✨", "🌻", "🌟", "😊", "🎁", "💫", "🧡", "🌼"],
  },
  autre: {
    wash: paint(["#7c4dff", "#00e5ff", "#ffe600", "#ff2bd6"]),
    night: paint(["#1a0848", "#083040", "#3a2808", "#3a0848"]),
    emojis: ["✨", "💫", "🌟", "💛", "🎈", "🎉", "💖", "🌸", "⭐", "🎊"],
  },
  coeurs: {
    wash: paint(["#ff1744", "#ff4081", "#ff80ab", "#ff2d78"]),
    night: paint(["#6a0828", "#3a0818", "#4a0828", "#2a0818"]),
    emojis: ["💕", "❤️", "💖", "💘", "💌", "🌸", "💗", "😍", "🌹", "✨", "💓", "🎀"],
  },
  mer: {
    wash: paint(["#0091ff", "#00e5ff", "#ffe600", "#0066ff"]),
    night: paint(["#082848", "#083858", "#2a2808", "#082040"]),
    emojis: ["🌊", "🐚", "🐠", "⛵", "☀️", "🐬", "💙", "🦀", "✨", "🏖️", "🫧", "⭐"],
  },
  etoiles: {
    wash: paint(["#651fff", "#00e5ff", "#ffe600", "#d500f9"]),
    night: paint(["#140840", "#082848", "#2a2808", "#280848"]),
    emojis: ["✨", "🌟", "⭐", "🌙", "💫", "🪐", "☄️", "💜", "🌠", "✦", "💛", "🌌"],
  },
  jardin: {
    wash: paint(["#00c853", "#ff2d78", "#ffe600", "#64dd17"]),
    night: paint(["#083820", "#4a0830", "#2a2808", "#082818"]),
    emojis: ["🌷", "🌿", "🌸", "🦋", "🌼", "🍃", "🌺", "🍀", "💐", "🌻"],
  },
  aurore: {
    wash: paint(["#ff6d00", "#ff2d78", "#ffe600", "#ff9100"]),
    night: paint(["#4a1808", "#4a0830", "#3a2808", "#3a1008"]),
    emojis: ["🌅", "🌸", "✨", "🕊️", "💛", "☁️", "🌷", "☀️", "💗", "🌙"],
  },
  foret: {
    wash: paint(["#00c853", "#64dd17", "#c6ff00", "#00e676"]),
    night: paint(["#083018", "#083820", "#1c2808", "#082010"]),
    emojis: ["🌲", "🍃", "🍄", "🦌", "🌿", "✨", "🦉", "🍀", "🌰", "💚"],
  },
  soleil: {
    wash: paint(["#ffe600", "#ff9100", "#ffea00", "#ff6d00"]),
    night: paint(["#3a2808", "#4a2008", "#2a2408", "#3a1808"]),
    emojis: ["☀️", "🌻", "🌞", "✨", "🍋", "🌼", "💛", "🧡", "🔆", "🐝"],
  },
  lavande: {
    wash: paint(["#aa00ff", "#e040fb", "#ff80ff", "#7c4dff"]),
    night: paint(["#280848", "#3a0844", "#1c0830", "#320848"]),
    emojis: ["💜", "🌸", "✨", "🪻", "💐", "🦋", "🌙", "💕", "🕊️", "⭐"],
  },
  neige: {
    wash: paint(["#00b0ff", "#ffffff", "#7c4dff", "#80d8ff"]),
    night: paint(["#082034", "#101c40", "#180838", "#081828"]),
    emojis: ["❄️", "🤍", "✨", "⛄", "🌨️", "⭐", "🕊️", "💙", "🌙", "🧊"],
  },
  paillettes: {
    wash: paint(["#ff2bd6", "#00f0ff", "#ffe600", "#d500f9"]),
    night: paint(["#4a0848", "#083040", "#3a2808", "#300848"]),
    emojis: ["✨", "💖", "⭐", "🌟", "💫", "🎀", "🩷", "✦", "💛", "🎉", "🪩", "🌸"],
  },
  bonbons: {
    wash: paint(["#ff2d78", "#00e5ff", "#ffe600", "#ff6d00"]),
    night: paint(["#4a0830", "#083040", "#3a2808", "#400828"]),
    emojis: ["🍬", "🍭", "🧁", "🍩", "🎀", "💖", "✨", "🍓", "🎂", "🌟", "🎈", "💛"],
  },
  chatons: {
    wash: paint(["#ff4081", "#ffe600", "#ff8a00", "#ff80ab"]),
    night: paint(["#3a0820", "#3a2808", "#083028", "#2a0818"]),
    emojis: ["🐱", "🎀", "🐾", "💖", "✨", "🌷", "💛", "☁️", "🐣", "🌸", "💕", "🌟"],
  },
  arc: {
    wash: paint(["#ff1744", "#ffe600", "#00e676", "#2979ff"]),
    night: paint(["#4a0818", "#3a2808", "#083020", "#082048"]),
    emojis: ["🌈", "✨", "☁️", "💛", "💖", "⭐", "🦋", "🌟", "🎀", "💫", "🦄", "🎉"],
  },
  papillons: {
    wash: paint(["#e040fb", "#00e5ff", "#ff2d78", "#ffe600"]),
    night: paint(["#280848", "#3a0830", "#083028", "#200848"]),
    emojis: ["🦋", "🌸", "🌷", "✨", "💜", "🌼", "💗", "🍃", "⭐", "💐"],
  },
  ballons: {
    wash: paint(["#ff1744", "#ffe600", "#00b0ff", "#ff6d00"]),
    night: paint(["#4a0828", "#3a2808", "#082048", "#400828"]),
    emojis: ["🎈", "🎀", "🎉", "💛", "🎊", "✨", "💖", "🥳", "🌟", "🎁"],
  },
  lune: {
    wash: paint(["#311b92", "#7c4dff", "#00e5ff", "#ffe600"]),
    night: paint(["#0c0828", "#140840", "#081828", "#080818"]),
    emojis: ["🌙", "⭐", "✨", "💫", "☁️", "💛", "🌌", "🕊️", "💜", "🌟"],
  },
  fraises: {
    wash: paint(["#ff1744", "#ff4081", "#ffe600", "#ff6d00"]),
    night: paint(["#4a0818", "#3a1008", "#400818", "#2a0810"]),
    emojis: ["🍓", "🌸", "🎀", "💖", "🧁", "✨", "🌷", "💗", "🍰", "🌟"],
  },
  neon: {
    wash: paint(["#12081c", "#ff2bd6", "#39ff14", "#00f0ff"]),
    night: paint(["#07040f", "#3a0840", "#083028", "#041820"]),
    emojis: ["🌃", "💠", "⚡", "🤖", "💜", "✨", "🛰️", "💫", "🔮", "🌟"],
  },
  hologramme: {
    wash: paint(["#041428", "#00f0ff", "#7a6cff", "#ff2bd6"]),
    night: paint(["#020810", "#043040", "#1a0848", "#280828"]),
    emojis: ["💠", "🔷", "✨", "🌐", "💫", "🔮", "🛰️", "💜", "⚡", "🌟"],
  },
  cyber: {
    wash: paint(["#07040f", "#39ff14", "#00f0ff", "#ff2bd6"]),
    night: paint(["#030208", "#083018", "#042028", "#280828"]),
    emojis: ["🤖", "🕹️", "💚", "⚡", "🌃", "💠", "✨", "🛸", "🔮", "💫"],
  },
  laser: {
    wash: paint(["#1a0828", "#ff2d55", "#00f0ff", "#ffe14a"]),
    night: paint(["#100418", "#400818", "#042830", "#2a2008"]),
    emojis: ["⚡", "🔴", "💠", "✨", "🌟", "💜", "🛰️", "💫", "🔮", "🌃"],
  },
};

const SLOTS = [
  { left: 1, top: 6, size: 34, delay: 0, duration: 6.4 },
  { left: 0, top: 28, size: 22, delay: 0.8, duration: 7.2 },
  { left: 2, top: 52, size: 28, delay: 0.3, duration: 6 },
  { left: 4, top: 76, size: 24, delay: 1.2, duration: 7.6 },
  { left: 88, top: 4, size: 32, delay: 0.5, duration: 5.8 },
  { left: 94, top: 26, size: 22, delay: 1.4, duration: 8 },
  { left: 86, top: 50, size: 28, delay: 0.2, duration: 6.8 },
  { left: 92, top: 74, size: 34, delay: 1, duration: 5.4 },
  { left: 14, top: 12, size: 20, delay: 0.4, duration: 5.2 },
  { left: 22, top: 84, size: 22, delay: 1.1, duration: 6.2 },
  { left: 40, top: 4, size: 24, delay: 0.2, duration: 5.4 },
  { left: 56, top: 90, size: 20, delay: 0.9, duration: 6.6 },
  { left: 70, top: 14, size: 22, delay: 0.6, duration: 5 },
  { left: 34, top: 92, size: 18, delay: 1.3, duration: 6 },
  { left: 62, top: 8, size: 18, delay: 0.1, duration: 5.2 },
  { left: 8, top: 40, size: 18, delay: 0.7, duration: 6.8 },
  { left: 78, top: 40, size: 20, delay: 1.5, duration: 5.6 },
  { left: 48, top: 78, size: 16, delay: 0.35, duration: 7 },
];

const SPARKS = Array.from({ length: 48 }, (_, index) => ({
  left: (index * 17) % 100,
  top: (index * 23) % 96,
  delay: (index % 10) * 0.14,
  duration: 0.85 + (index % 5) * 0.18,
  size: 12 + (index % 5) * 4,
  glyph: ["✨", "✦", "⭐", "💫", "💖"][index % 5],
}));

function useDark() {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const FEST_SCENE: Partial<Record<OccasionId, SceneId>> = {
  anniversaire: "anniversaire",
  noel: "noel",
  "nouvel-an": "nouvel-an",
  "saint-valentin": "saint-valentin",
  "fete-meres": "fete-meres",
  "fete-peres": "fete-peres",
  paques: "jardin",
  halloween: "bonbons",
  epiphanie: "noel",
  juillet: "soleil",
  toussaint: "foret",
  "saint-nicolas": "noel",
  "grands-meres": "fete-meres",
  "grands-peres": "soleil",
  dodo: "lune",
  bisou: "coeurs",
  calin: "coeurs",
  bravo: "etoiles",
  soutien: "aurore",
  ecole: "etoiles",
  dent: "bonbons",
  gouter: "fraises",
  vacances: "soleil",
  sport: "ballons",
  dessin: "arc",
  histoire: "lune",
  amis: "jardin",
  prenom: "lavande",
  naissance: "anniversaire",
  mariage: "coeurs",
  enterrement: "foret",
  bapteme: "aurore",
  communion: "lavande",
  fiancailles: "coeurs",
  noces: "coeurs",
  retraite: "soleil",
  cremaillere: "jardin",
  examen: "etoiles",
  travail: "soleil",
  retablissement: "jardin",
  demenagement: "aurore",
  rentree: "etoiles",
  merci: "merci",
  autre: "autre",
};

export function sceneEmojis(scene: SceneId): string[] {
  return SCENES[scene].emojis;
}

export function resolveScene(id: WallpaperId, occasion: OccasionId, tab: TabId): SceneId | null {
  if (id === "off") return null;
  if (id !== "auto") return id;
  if (tab === "composer") return FEST_SCENE[occasion] ?? "autre";
  const month = new Date().getMonth();
  if (month === 11) return "noel";
  if (month === 0) return "nouvel-an";
  if (month === 1) return "coeurs";
  if (month >= 5 && month <= 8) return "mer";
  return "etoiles";
}

type WashLayer = { id: number; scene: SceneId; night: boolean };

export function Wallpaper({ scene, fun, glow = 60, emojis, emojiScale = 1 }: { scene: SceneId; fun: FunLevel; glow?: number; emojis?: string[]; emojiScale?: number }) {
  const dark = useDark();
  const [layers, setLayers] = useState<WashLayer[]>([{ id: 0, scene, night: false }]);
  const [fx, setFx] = useState(0);
  const seq = useRef(0);
  const latest = useRef(0);
  const skip = useRef(true);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      setLayers([{ id: 0, scene, night: dark }]);
      return;
    }
    const id = ++seq.current;
    latest.current = id;
    setLayers((prev) => [...prev.slice(-1), { id, scene, night: dark }]);
    setFx(id);
    const timer = window.setTimeout(() => {
      if (latest.current !== id) return;
      setLayers((prev) => prev.filter((layer) => layer.id === id));
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [scene, dark, fun]);

  const data = SCENES[scene];
  const marks = emojis && emojis.length > 0 ? emojis : data.emojis;
  const lively = fun !== "calme";
  const wild = fun === "folie";
  const scale = Math.min(1, Math.max(0, glow / 100));
  const slots = (wild ? SLOTS.slice(0, 8) : lively ? SLOTS.slice(0, 5) : SLOTS.slice(0, 2)).slice(0, Math.round((wild ? 8 : lively ? 5 : 2) * scale));
  const sparks = (wild ? SPARKS.slice(0, 6) : lively ? SPARKS.slice(0, 4) : []).slice(0, Math.round((wild ? 6 : lively ? 4 : 0) * scale));
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${wild ? "folie" : ""} ${lively ? "fete-on" : ""}`}
      style={{ opacity: 0.2 + scale * 0.8 }}
      aria-hidden
    >
      <div className="scene-stage absolute inset-0">
        {layers.map((layer, index) => {
          const paint = SCENES[layer.scene];
          const incoming = index === layers.length - 1 && layers.length > 1;
          return (
            <div
              key={layer.id}
              className={`scene-wash absolute inset-0 ${incoming ? "scene-wash-in" : ""}`}
              style={{
                background: layer.night ? paint.night : paint.wash,
                ["--ox" as string]: `${18 + ((layer.id * 37) % 64)}%`,
                ["--oy" as string]: `${16 + ((layer.id * 19) % 48)}%`,
              }}
            />
          );
        })}
      </div>
      {fx > 0 ? <div key={fx} className="scene-sweep absolute inset-y-0 left-0 w-2/3" /> : null}
      <div key={scene} className="absolute inset-0">
        {slots.map((slot, index) => (
          <span
            key={`${scene}-${index}`}
            className="emoji-arrive absolute"
            style={{
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              ["--arrive" as string]: `${index * 0.035}s`,
            }}
          >
            <span
              className="wallpaper-emoji block"
              style={{
                fontSize: (wild ? slot.size : lively ? Math.max(16, slot.size - 4) : Math.max(14, slot.size - 8)) * emojiScale,
                ["--delay" as string]: `${slot.delay}s`,
                ["--dur" as string]: `${wild ? slot.duration * 0.62 : slot.duration}s`,
              }}
            >
              {marks[index % marks.length]}
            </span>
          </span>
        ))}
      </div>
      <div key={`spark-${scene}`} className="absolute inset-0">
        {sparks.map((spark, index) => (
          <span
            key={`spark-${index}`}
            className="glitter-bit absolute z-[12]"
            style={{
              left: `${spark.left}%`,
              top: `${spark.top}%`,
              fontSize: wild ? spark.size : Math.max(10, spark.size - 2),
              ["--delay" as string]: `${spark.delay}s`,
              ["--dur" as string]: `${spark.duration}s`,
            }}
          >
            {spark.glyph}
          </span>
        ))}
      </div>
      {wild ? <Confetti /> : null}
    </div>
  );
}

export function Garland({ occasion }: { occasion: OccasionId }) {
  const scene = FEST_SCENE[occasion] ?? "autre";
  const emojis = SCENES[scene].emojis.slice(0, 8);
  return (
    <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1" aria-hidden>
      {emojis.map((emoji, index) => (
        <span key={`${occasion}-${emoji}-${index}`} className="garland-emoji text-2xl" style={{ animationDelay: `${index * 0.12}s` }}>
          {emoji}
        </span>
      ))}
    </p>
  );
}
