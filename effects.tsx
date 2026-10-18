import type { BeautyMood } from "@/lib/bonmoment/proverbes";
import type { OccasionId, WallpaperId } from "@/lib/bonmoment/types";
import { Seal } from "./ui";

const SPARK: Partial<Record<OccasionId, string[]>> = {
  anniversaire: ["🎈", "🎂", "🎉", "🎁", "🥳", "🎊", "🧁", "💖"],
  noel: ["🎄", "❄️", "🎅", "🎁", "⭐", "🔔", "🕯️", "🦌"],
  "nouvel-an": ["🎆", "🥂", "🎇", "🎉", "🕛", "✨", "🍾", "💫"],
  "saint-valentin": ["💌", "❤️", "🌹", "💕", "💘", "💖", "😍", "🌸"],
  "fete-meres": ["🌸", "💐", "🌷", "🦋", "🌼", "💗", "🌺", "💖"],
  "fete-peres": ["☕", "🌟", "💛", "🎁", "🧢", "💙", "⚽", "✨"],
  merci: ["🙏", "🌻", "💛", "🧡", "🌼", "✨", "😊", "💫"],
  paques: ["🐣", "🌷", "🥚", "🌸", "✨", "🐰", "🌼", "💛"],
  halloween: ["🎃", "👻", "🦇", "🍬", "✨", "🕷️", "🌙", "🧡"],
  epiphanie: ["👑", "✨", "🌟", "🍰", "💛", "⭐", "🎁", "💫"],
  juillet: ["🇫🇷", "✨", "🎆", "🌟", "🎉", "💛", "🎇", "🎊"],
  toussaint: ["🕯️", "🌸", "✨", "🤍", "🌼", "🙏", "💛", "🌿"],
  "saint-nicolas": ["🍬", "🎁", "✨", "🧦", "🌟", "🍪", "💛", "🎉"],
  "grands-meres": ["🌷", "💐", "✨", "🌸", "💖", "🌼", "🫖", "💛"],
  "grands-peres": ["🧢", "📖", "✨", "☕", "💛", "🌟", "🪑", "🌻"],
  dodo: ["🌙", "⭐", "🧸", "✨", "💤", "🤍", "🌌", "💛"],
  bisou: ["😘", "💋", "💕", "✨", "🌸", "🤍", "💖", "🌷"],
  calin: ["🤗", "🧸", "💛", "✨", "🤍", "💕", "🌸", "🫶"],
  bravo: ["⭐", "🌟", "🎉", "✨", "🏅", "💛", "👏", "🌈"],
  soutien: ["💪", "🤍", "🤗", "✨", "🌟", "💛", "🫶", "🌈"],
  ecole: ["🎒", "✏️", "📚", "✨", "🍎", "🌟", "💛", "🖍️"],
  dent: ["🦷", "✨", "🐭", "🌟", "😊", "💛", "⭐", "🎀"],
  gouter: ["🍪", "🥛", "✨", "🍓", "💛", "🧁", "🌟", "🍯"],
  vacances: ["☀️", "🌊", "✨", "🐚", "🌻", "💛", "🎈", "🌈"],
  sport: ["⚽", "🌟", "✨", "🏅", "💛", "🎾", "⭐", "💪"],
  dessin: ["🎨", "🖍️", "✨", "🌈", "⭐", "💛", "🌸", "✏️"],
  histoire: ["📖", "🌙", "✨", "⭐", "🧸", "💛", "🌟", "🤍"],
  amis: ["💛", "🤝", "✨", "🌟", "🌻", "😊", "💫", "🤍"],
  prenom: ["📅", "✨", "🌸", "💛", "🌟", "💌", "⭐", "🤍"],
  naissance: ["👶", "🎀", "✨", "💛", "🌟", "🍼", "💖", "🎈"],
  mariage: ["💍", "💐", "✨", "🤍", "💖", "🥂", "🌸", "💛"],
  enterrement: ["🌸", "🕯️", "🤍", "🌼", "🌿", "🙏"],
  bapteme: ["💧", "🕊️", "✨", "🤍", "🌿", "💛"],
  communion: ["🕊️", "✨", "🤍", "📖", "🌸", "💛"],
  fiancailles: ["💞", "💍", "✨", "💖", "🌸", "🤍"],
  noces: ["🤍", "💍", "🥂", "🌸", "✨", "💖"],
  retraite: ["🌅", "☕", "✨", "🌿", "💛", "📖"],
  cremaillere: ["🏠", "🔑", "✨", "🌿", "💛", "🍵"],
  examen: ["🎓", "✏️", "✨", "📚", "🌟", "💛"],
  travail: ["💼", "✨", "🌟", "☕", "💛", "🌱"],
  retablissement: ["🌿", "🤍", "✨", "🍵", "💛", "🕊️"],
  demenagement: ["📦", "🔑", "🏠", "✨", "🌿", "💛"],
  rentree: ["📚", "✏️", "✨", "🍎", "🌟", "🎒", "💛", "🍂"],
  autre: ["✨", "🌟", "💛", "🎈", "⭐", "🌸", "💫", "🎊"],
};

const WASH: Partial<Record<OccasionId, string>> = {
  anniversaire: "rgb(255 120 170 / 0.55)",
  noel: "rgb(90 190 130 / 0.5)",
  "nouvel-an": "rgb(180 120 255 / 0.5)",
  "saint-valentin": "rgb(255 80 120 / 0.5)",
  "fete-meres": "rgb(255 150 200 / 0.5)",
  "fete-peres": "rgb(120 170 255 / 0.48)",
  merci: "rgb(255 190 80 / 0.5)",
  paques: "rgb(255 214 120 / 0.5)",
  halloween: "rgb(255 140 40 / 0.48)",
  epiphanie: "rgb(255 214 90 / 0.5)",
  juillet: "rgb(120 170 255 / 0.45)",
  toussaint: "rgb(255 220 160 / 0.42)",
  "saint-nicolas": "rgb(255 120 120 / 0.42)",
  "grands-meres": "rgb(255 170 200 / 0.48)",
  "grands-peres": "rgb(186 206 236 / 0.45)",
  dodo: "rgb(150 150 210 / 0.4)",
  bisou: "rgb(255 160 190 / 0.48)",
  calin: "rgb(255 186 160 / 0.48)",
  bravo: "rgb(255 214 90 / 0.5)",
  soutien: "rgb(255 196 140 / 0.48)",
  ecole: "rgb(160 196 255 / 0.45)",
  dent: "rgb(255 220 180 / 0.48)",
  gouter: "rgb(255 186 140 / 0.48)",
  vacances: "rgb(255 214 120 / 0.5)",
  sport: "rgb(140 210 160 / 0.45)",
  dessin: "rgb(200 170 255 / 0.45)",
  histoire: "rgb(170 160 220 / 0.42)",
  amis: "rgb(255 214 120 / 0.48)",
  prenom: "rgb(255 196 160 / 0.48)",
  naissance: "rgb(255 196 160 / 0.5)",
  mariage: "rgb(255 210 220 / 0.5)",
  enterrement: "rgb(230 214 196 / 0.4)",
  bapteme: "rgb(186 214 236 / 0.48)",
  communion: "rgb(230 220 190 / 0.45)",
  fiancailles: "rgb(255 170 196 / 0.48)",
  noces: "rgb(255 214 214 / 0.48)",
  retraite: "rgb(255 196 140 / 0.45)",
  cremaillere: "rgb(214 196 160 / 0.45)",
  examen: "rgb(186 206 255 / 0.45)",
  travail: "rgb(180 210 190 / 0.45)",
  retablissement: "rgb(190 220 190 / 0.45)",
  demenagement: "rgb(210 196 170 / 0.45)",
  rentree: "rgb(255 196 90 / 0.45)",
  autre: "rgb(180 160 255 / 0.42)",
};

function sparkOf(id: OccasionId): string[] {
  return SPARK[id] ?? SPARK.autre ?? ["✨"];
}

function washOf(id: OccasionId): string {
  return WASH[id] ?? WASH.autre ?? "rgb(180 160 255 / 0.42)";
}

export function SparkBurst({ x, y, occasion, big = false }: { x: number; y: number; occasion: OccasionId; big?: boolean }) {
  const bits = sparkOf(occasion);
  const reach = big ? 118 : 46;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {bits.map((emoji, index) => {
        const angle = (Math.PI * 2 * index) / bits.length;
        return (
          <span
            key={`${emoji}-${index}`}
            className={big ? "spark-bit absolute text-4xl" : "spark-bit spark-bit-mini absolute text-xl"}
            style={{
              left: x,
              top: y,
              ["--x" as string]: `${Math.round(Math.cos(angle) * reach)}px`,
              ["--y" as string]: `${Math.round(Math.sin(angle) * reach * 0.85)}px`,
            }}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}

export function FestFlash({ occasion }: { occasion: OccasionId }) {
  const bits = sparkOf(occasion);
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      <div className="fest-wash absolute inset-0" style={{ background: washOf(occasion) }} />
      {bits.map((emoji, index) => (
        <span
          key={`${occasion}-${emoji}-${index}`}
          className="fest-drop absolute text-5xl"
          style={{
            left: `${8 + index * 11}%`,
            animationDelay: `${index * 0.06}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

export function ThemeFlash({ mood, x, y }: { mood: BeautyMood; x: number; y: number }) {
  const look = THEME[mood];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      <div className="fest-wash absolute inset-0" style={{ background: look.wash }} />
      {look.bits.map((emoji, index) => {
        const angle = (Math.PI * 2 * index) / look.bits.length - Math.PI / 2;
        const reach = 70 + (index % 2) * 28;
        return (
          <span
            key={`${mood}-${emoji}-${index}`}
            className="theme-fly absolute text-4xl"
            style={{
              left: x,
              top: y,
              animationDelay: `${index * 30}ms`,
              ["--x" as string]: `${Math.round(Math.cos(angle) * reach)}px`,
              ["--y" as string]: `${Math.round(Math.sin(angle) * reach)}px`,
            }}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}

const THEME: Record<BeautyMood, { bits: string[]; wash: string }> = {
  humour: { bits: ["😄", "🤭", "😂", "😜", "😆", "✨"], wash: "rgb(255 214 80 / 0.5)" },
  joyeux: { bits: ["🌟", "🎉", "☀️", "💛", "🎊", "😁"], wash: "rgb(255 176 50 / 0.5)" },
  tendre: { bits: ["🌸", "💗", "🧸", "🌷", "🥰", "✨"], wash: "rgb(255 166 196 / 0.5)" },
  amour: { bits: ["💕", "❤️", "💌", "💘", "🌹", "💖"], wash: "rgb(255 96 140 / 0.48)" },
  famille: { bits: ["🏡", "💛", "🫶", "🌼", "✨", "☀️"], wash: "rgb(255 196 120 / 0.48)" },
  courage: { bits: ["💪", "🌟", "🦁", "⭐", "🔥", "✨"], wash: "rgb(255 140 60 / 0.46)" },
  colere: { bits: ["💨", "⚡", "😤", "🔥", "💛", "✨"], wash: "rgb(255 110 70 / 0.42)" },
  content: { bits: ["☕", "🤍", "😊", "🌿", "✨", "☀️"], wash: "rgb(176 210 150 / 0.5)" },
};

export function SealDrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-hidden>
      <Seal className="seal-drop size-28 border-4 text-5xl" />
    </div>
  );
}

const SCENE_POP: Record<WallpaperId, { wash: string; chip: string; bits: string[] }> = {
  auto: { wash: "rgb(255 45 120 / 0.62)", chip: "#ff2d78", bits: ["🎈", "✨", "🎀", "🌟", "💖", "🎉"] },
  anniversaire: { wash: "rgb(255 45 120 / 0.66)", chip: "#ff2d78", bits: ["🎂", "🎈", "🎁", "🎉", "🥳", "🧁"] },
  noel: { wash: "rgb(0 200 83 / 0.66)", chip: "#00c853", bits: ["🎄", "❄️", "🎁", "⭐", "🎅", "🔔"] },
  "nouvel-an": { wash: "rgb(213 0 249 / 0.62)", chip: "#d500f9", bits: ["🎆", "🥂", "✨", "🎇", "🎉", "💫"] },
  coeurs: { wash: "rgb(255 23 68 / 0.62)", chip: "#ff1744", bits: ["💕", "❤️", "💖", "💌", "🌹", "💘"] },
  jardin: { wash: "rgb(0 230 118 / 0.62)", chip: "#00e676", bits: ["🌷", "🌸", "🦋", "🌼", "🍃", "💐"] },
  aurore: { wash: "rgb(255 109 0 / 0.64)", chip: "#ff6d00", bits: ["🌅", "🌸", "✨", "☁️", "💛", "🌷"] },
  foret: { wash: "rgb(0 200 83 / 0.62)", chip: "#00c853", bits: ["🌲", "🍃", "🍄", "🦌", "🍀", "✨"] },
  soleil: { wash: "rgb(255 230 0 / 0.7)", chip: "#ffe600", bits: ["☀️", "🌻", "🌞", "🌼", "🍋", "✨"] },
  lavande: { wash: "rgb(213 0 249 / 0.6)", chip: "#d500f9", bits: ["💜", "🌸", "🪻", "🦋", "✨", "💐"] },
  mer: { wash: "rgb(0 176 255 / 0.64)", chip: "#00b0ff", bits: ["🌊", "🐚", "🐠", "⛵", "🐬", "✨"] },
  neige: { wash: "rgb(0 176 255 / 0.55)", chip: "#00b0ff", bits: ["❄️", "⛄", "✨", "🤍", "🌨️", "⭐"] },
  etoiles: { wash: "rgb(124 77 255 / 0.62)", chip: "#7c4dff", bits: ["✨", "🌟", "⭐", "🌙", "💫", "🪐"] },
  paillettes: { wash: "rgb(255 43 214 / 0.64)", chip: "#ff2bd6", bits: ["💖", "✨", "🌟", "🎀", "💫", "🩷"] },
  bonbons: { wash: "rgb(255 45 120 / 0.64)", chip: "#ff2d78", bits: ["🍬", "🍭", "🧁", "🍩", "✨", "🎀"] },
  chatons: { wash: "rgb(255 64 129 / 0.62)", chip: "#ff4081", bits: ["🐱", "🐾", "🎀", "💗", "✨", "😽"] },
  arc: { wash: "rgb(255 230 0 / 0.62)", chip: "#ffe600", bits: ["🌈", "✨", "☁️", "💛", "💜", "💚"] },
  papillons: { wash: "rgb(224 64 251 / 0.6)", chip: "#e040fb", bits: ["🦋", "🌸", "✨", "🌷", "💫", "🌼"] },
  ballons: { wash: "rgb(255 23 68 / 0.6)", chip: "#ff1744", bits: ["🎈", "🎉", "🎊", "🎀", "✨", "💛"] },
  lune: { wash: "rgb(124 77 255 / 0.62)", chip: "#7c4dff", bits: ["🌙", "✨", "⭐", "💫", "🌌", "💜"] },
  fraises: { wash: "rgb(255 23 68 / 0.62)", chip: "#ff1744", bits: ["🍓", "🌸", "✨", "💖", "🍰", "🌷"] },
  neon: { wash: "rgb(255 43 214 / 0.55)", chip: "#ff2bd6", bits: ["🌃", "💠", "⚡", "🤖", "✨", "💜"] },
  hologramme: { wash: "rgb(0 240 255 / 0.5)", chip: "#00f0ff", bits: ["💠", "🔷", "✨", "🌐", "💫", "🔮"] },
  cyber: { wash: "rgb(57 255 20 / 0.45)", chip: "#39ff14", bits: ["🤖", "🕹️", "💚", "⚡", "🌃", "💠"] },
  laser: { wash: "rgb(255 45 85 / 0.5)", chip: "#ff2d55", bits: ["⚡", "🔴", "💠", "✨", "🌟", "💜"] },
  off: { wash: "rgb(255 255 255 / 0.35)", chip: "#efe8e2", bits: ["✨", "🤍"] },
};

export function sceneLook(id: WallpaperId) {
  return SCENE_POP[id];
}

export function ScenePop({ id }: { id: WallpaperId }) {
  const look = SCENE_POP[id];
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      <div className="fest-wash absolute inset-0" style={{ background: look.wash }} />
      {look.bits.map((emoji, index) => (
        <span
          key={`${id}-${emoji}-${index}`}
          className="fest-drop absolute text-4xl"
          style={{ left: `${6 + index * 15}%`, animationDelay: `${index * 0.05}s` }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
