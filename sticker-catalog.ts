export type StickerLive = "beat" | "spark";

export type StickerItem = { emoji: string; words: string; live?: StickerLive };

export type StickerTab = "recent" | "cute" | "sweet" | "hearts" | "party" | "flags" | "halloween" | "ete" | "hiver" | "noel" | "lettres" | "signes";

export const STICKER_PACKS: { id: Exclude<StickerTab, "recent">; items: StickerItem[] }[] = [
  {
    id: "cute",
    items: [
      { emoji: "🐰", words: "lapin mignon animal" },
      { emoji: "🐱", words: "chat mignon animal" },
      { emoji: "🐶", words: "chien mignon animal" },
      { emoji: "🧸", words: "ourson nounours mignon" },
      { emoji: "🐼", words: "panda mignon animal" },
      { emoji: "🦊", words: "renard mignon animal" },
      { emoji: "🐧", words: "pingouin mignon hiver" },
      { emoji: "🐣", words: "poussin mignon" },
      { emoji: "🐨", words: "koala mignon" },
      { emoji: "🦄", words: "licorne magie mignon" },
      { emoji: "🌸", words: "fleur printemps mignon" },
      { emoji: "🦋", words: "papillon mignon" },
    ],
  },
  {
    id: "sweet",
    items: [
      { emoji: "🍓", words: "fraise gourmand fruit" },
      { emoji: "🧁", words: "cupcake gateau gourmand" },
      { emoji: "🍪", words: "cookie biscuit gourmand" },
      { emoji: "🍩", words: "donut gourmand" },
      { emoji: "🍭", words: "sucette bonbon gourmand" },
      { emoji: "🍫", words: "chocolat gourmand" },
      { emoji: "🎂", words: "gateau anniversaire fete" },
      { emoji: "🍦", words: "glace ete gourmand" },
      { emoji: "🍒", words: "cerise fruit gourmand" },
      { emoji: "🍯", words: "miel gourmand" },
    ],
  },
  {
    id: "hearts",
    items: [
      { emoji: "❤️", words: "coeur amour", live: "beat" },
      { emoji: "💖", words: "coeur amour brillant", live: "beat" },
      { emoji: "💗", words: "coeur amour", live: "beat" },
      { emoji: "💓", words: "coeur qui bat amour", live: "beat" },
      { emoji: "💕", words: "coeurs amour" },
      { emoji: "💝", words: "cadeau coeur amour" },
      { emoji: "💌", words: "lettre amour coeur" },
      { emoji: "🫶", words: "mains coeur amour" },
      { emoji: "🥰", words: "amour bisou sourire" },
      { emoji: "💐", words: "bouquet fleurs amour" },
    ],
  },
  {
    id: "party",
    items: [
      { emoji: "🎉", words: "fete anniversaire" },
      { emoji: "🎈", words: "ballon fete anniversaire" },
      { emoji: "🎁", words: "cadeau fete anniversaire" },
      { emoji: "🥳", words: "fete anniversaire" },
      { emoji: "🎊", words: "confettis fete" },
      { emoji: "✨", words: "etoile brillant magie", live: "spark" },
      { emoji: "⭐", words: "etoile", live: "spark" },
      { emoji: "🌟", words: "etoile brillante", live: "spark" },
      { emoji: "🎄", words: "noel sapin hiver fete" },
      { emoji: "🎃", words: "halloween citrouille" },
      { emoji: "❄️", words: "neige hiver flocon", live: "spark" },
      { emoji: "☀️", words: "soleil ete" },
    ],
  },
  {
    id: "flags",
    items: [
      { emoji: "🇫🇷", words: "france drapeau pays" },
      { emoji: "🇪🇸", words: "espagne drapeau pays" },
      { emoji: "🇮🇹", words: "italie drapeau pays" },
      { emoji: "🇩🇿", words: "algerie drapeau pays" },
      { emoji: "🇲🇦", words: "maroc drapeau pays" },
      { emoji: "🇹🇳", words: "tunisie drapeau pays" },
      { emoji: "🇵🇹", words: "portugal drapeau pays" },
      { emoji: "🇨🇦", words: "canada drapeau pays" },
      { emoji: "🇧🇪", words: "belgique drapeau pays" },
      { emoji: "🇨🇭", words: "suisse drapeau pays" },
      { emoji: "🇸🇳", words: "senegal drapeau pays" },
      { emoji: "🇩🇪", words: "allemagne drapeau pays" },
      { emoji: "🇬🇧", words: "angleterre royaume uni drapeau pays" },
      { emoji: "🇺🇸", words: "etats unis amerique drapeau pays" },
      { emoji: "🇧🇷", words: "bresil drapeau pays" },
      { emoji: "🇯🇵", words: "japon drapeau pays" },
      { emoji: "🇹🇷", words: "turquie drapeau pays" },
      { emoji: "🇱🇧", words: "liban drapeau pays" },
      { emoji: "🇲🇽", words: "mexique drapeau pays" },
      { emoji: "🇬🇷", words: "grece drapeau pays" },
      { emoji: "🇳🇱", words: "pays bas hollande drapeau" },
      { emoji: "🇵🇱", words: "pologne drapeau pays" },
      { emoji: "🇮🇪", words: "irlande drapeau pays" },
      { emoji: "🇦🇺", words: "australie drapeau pays" },
      { emoji: "🇮🇳", words: "inde drapeau pays" },
      { emoji: "🇨🇳", words: "chine drapeau pays" },
      { emoji: "🇰🇷", words: "coree drapeau pays" },
      { emoji: "🇷🇺", words: "russie drapeau pays" },
      { emoji: "🇺🇦", words: "ukraine drapeau pays" },
      { emoji: "🇪🇬", words: "egypte drapeau pays" },
      { emoji: "🇳🇬", words: "nigeria drapeau pays" },
      { emoji: "🇿🇦", words: "afrique du sud drapeau pays" },
      { emoji: "🇦🇷", words: "argentine drapeau pays" },
      { emoji: "🇸🇪", words: "suede drapeau pays" },
      { emoji: "🇳🇴", words: "norvege drapeau pays" },
      { emoji: "🇩🇰", words: "danemark drapeau pays" },
      { emoji: "🇦🇹", words: "autriche drapeau pays" },
      { emoji: "🇷🇴", words: "roumanie drapeau pays" },
      { emoji: "🇮🇱", words: "israel drapeau pays" },
      { emoji: "🇦🇪", words: "emirats drapeau pays" },
      { emoji: "🇸🇦", words: "arabie drapeau pays" },
      { emoji: "🇨🇲", words: "cameroun drapeau pays" },
      { emoji: "🇨🇮", words: "cote ivoire drapeau pays" },
      { emoji: "🇲🇱", words: "mali drapeau pays" },
      { emoji: "🇭🇹", words: "haiti drapeau pays" },
      { emoji: "🇲🇬", words: "madagascar drapeau pays" },
      { emoji: "🇱🇺", words: "luxembourg drapeau pays" },
      { emoji: "🇮🇩", words: "indonesie drapeau pays" },
      { emoji: "🇻🇳", words: "vietnam drapeau pays" },
      { emoji: "🇹🇭", words: "thailande drapeau pays" },
      { emoji: "🇳🇿", words: "nouvelle zelande drapeau pays" },
    ],
  },
  {
    id: "halloween",
    items: [
      { emoji: "🎃", words: "halloween citrouille" },
      { emoji: "👻", words: "halloween fantome" },
      { emoji: "💀", words: "halloween crane" },
      { emoji: "🦇", words: "halloween chauve souris" },
      { emoji: "🧙‍♀️", words: "halloween sorciere" },
      { emoji: "🧙‍♂️", words: "halloween sorcier" },
      { emoji: "😈", words: "halloween diable" },
      { emoji: "🕷️", words: "halloween araignee" },
      { emoji: "🕸️", words: "halloween toile" },
      { emoji: "🧛", words: "halloween vampire" },
      { emoji: "🧟", words: "halloween zombie" },
      { emoji: "🕯️", words: "halloween bougie" },
      { emoji: "🪦", words: "halloween tombe" },
      { emoji: "🐈‍⬛", words: "halloween chat noir" },
      { emoji: "🦉", words: "halloween hibou" },
      { emoji: "🔮", words: "halloween boule magie" },
    ],
  },
  {
    id: "ete",
    items: [
      { emoji: "☀️", words: "soleil ete" },
      { emoji: "🏖️", words: "plage ete" },
      { emoji: "🌊", words: "mer vague ete" },
      { emoji: "🍉", words: "pasteque ete" },
      { emoji: "🍦", words: "glace ete" },
      { emoji: "🌴", words: "palmier ete" },
      { emoji: "🕶️", words: "lunettes ete" },
      { emoji: "🏄", words: "surf ete" },
      { emoji: "🐚", words: "coquillage ete" },
      { emoji: "🍹", words: "cocktail ete" },
      { emoji: "🌺", words: "fleur ete" },
      { emoji: "🦩", words: "flamant rose ete" },
      { emoji: "⛱️", words: "parasol ete" },
      { emoji: "🚤", words: "bateau ete" },
    ],
  },
  {
    id: "hiver",
    items: [
      { emoji: "❄️", words: "flocon neige hiver", live: "spark" },
      { emoji: "⛄", words: "bonhomme neige hiver" },
      { emoji: "☃️", words: "neige hiver" },
      { emoji: "🧣", words: "echarpe hiver" },
      { emoji: "🧤", words: "gants hiver" },
      { emoji: "🎿", words: "ski hiver" },
      { emoji: "🧊", words: "glace hiver" },
      { emoji: "🎄", words: "sapin noel hiver fete" },
      { emoji: "🧥", words: "manteau hiver" },
      { emoji: "🔥", words: "feu chaud hiver" },
      { emoji: "🦌", words: "cerf hiver noel" },
      { emoji: "🍵", words: "the chaud hiver" },
    ],
  },
  {
    id: "noel",
    items: [
      { emoji: "🎄", words: "noel sapin" },
      { emoji: "🎅", words: "noel pere noel" },
      { emoji: "🤶", words: "noel mere noel" },
      { emoji: "🎁", words: "noel cadeau" },
      { emoji: "⭐", words: "noel etoile", live: "spark" },
      { emoji: "❄️", words: "noel flocon neige", live: "spark" },
      { emoji: "⛄", words: "noel bonhomme neige" },
      { emoji: "🦌", words: "noel renne" },
      { emoji: "🔔", words: "noel cloche" },
      { emoji: "🕯️", words: "noel bougie" },
      { emoji: "🧦", words: "noel chaussette" },
      { emoji: "🍪", words: "noel biscuit" },
      { emoji: "🥛", words: "noel lait" },
      { emoji: "🎀", words: "noel noeud" },
      { emoji: "✨", words: "noel magie", live: "spark" },
      { emoji: "🕊️", words: "noel paix" },
      { emoji: "🧑‍🎄", words: "noel lutin" },
      { emoji: "☃️", words: "noel neige" },
      { emoji: "🎶", words: "noel chanson" },
    ],
  },
  {
    id: "lettres",
    items: [
      { emoji: "✉️", words: "lettre enveloppe courrier" },
      { emoji: "💌", words: "lettre amour coeur" },
      { emoji: "📮", words: "boite aux lettres courrier" },
      { emoji: "📝", words: "lettre note ecriture" },
      { emoji: "✏️", words: "crayon lettre" },
      { emoji: "✒️", words: "plume lettre" },
      { emoji: "📜", words: "parchemin lettre" },
      { emoji: "🏷️", words: "etiquette lettre" },
      { emoji: "🔤", words: "lettres alphabet" },
      { emoji: "🔠", words: "lettres majuscules" },
      { emoji: "🔡", words: "lettres minuscules" },
      { emoji: "💯", words: "cent lettres" },
    ],
  },
  {
    id: "signes",
    items: [
      { emoji: "🛑", words: "stop panneau" },
      { emoji: "⛔", words: "stop interdit" },
      { emoji: "🚧", words: "travaux panneau" },
      { emoji: "🚦", words: "feu stop" },
      { emoji: "🚨", words: "gyrophare stop" },
      { emoji: "🚚", words: "camion depanneuse" },
      { emoji: "🚛", words: "camion depanneuse" },
      { emoji: "🪝", words: "crochet depanneuse" },
      { emoji: "🚗", words: "voiture" },
      { emoji: "🚓", words: "police" },
      { emoji: "🚑", words: "ambulance" },
      { emoji: "🛟", words: "bouee secours" },
      { emoji: "🪄", words: "baguette magie original" },
      { emoji: "🪩", words: "boule disco original" },
      { emoji: "🪐", words: "planete original" },
      { emoji: "👑", words: "couronne original" },
      { emoji: "💎", words: "diamant original" },
      { emoji: "🧿", words: "oeil original" },
      { emoji: "🪆", words: "poupee russe original" },
      { emoji: "🪁", words: "cerf volant original" },
    ],
  },
];

const RECENT_KEY = "bonmoment.stickerRecent";

export function stickerMotion(emoji: string): string {
  const live = STICKER_PACKS.flatMap((pack) => pack.items).find((item) => item.emoji === emoji)?.live;
  if (live === "beat") return "sticker-beat";
  if (live === "spark") return "sticker-spark";
  return "";
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function searchStickers(query: string): StickerItem[] {
  const needle = fold(query.trim());
  if (!needle) return [];
  const seen = new Set<string>();
  const found: StickerItem[] = [];
  for (const pack of STICKER_PACKS) {
    for (const item of pack.items) {
      if (seen.has(item.emoji)) continue;
      if (fold(`${item.words} ${item.emoji}`).includes(needle)) {
        seen.add(item.emoji);
        found.push(item);
      }
    }
  }
  return found;
}

export function recentStickers(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function rememberSticker(emoji: string) {
  const next = [emoji, ...recentStickers().filter((item) => item !== emoji)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
