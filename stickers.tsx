import { useEffect, useRef, useState, type ReactNode } from "react";
import { playSticker } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import type { StickerDensity, StickerSize, StickerSpeed } from "@/lib/bonmoment/types";
import {
  STICKER_PACKS,
  rememberSticker,
  recentStickers,
  searchStickers,
  stickerMotion,
  type StickerItem,
  type StickerTab,
} from "./sticker-catalog";
import { SearchBar } from "./search";
import { cn } from "@/lib/cn";
import { Chip } from "./ui";

const TABS: { id: StickerTab; key: MessageKey }[] = [
  { id: "recent", key: "sticker.recent" },
  { id: "hearts", key: "sticker.hearts" },
  { id: "cute", key: "sticker.cute" },
  { id: "sweet", key: "sticker.sweet" },
  { id: "party", key: "sticker.party" },
  { id: "halloween", key: "stick.halloween" },
  { id: "ete", key: "sticker.ete" },
  { id: "hiver", key: "sticker.hiver" },
  { id: "noel", key: "sticker.noel" },
  { id: "lettres", key: "sticker.lettres" },
  { id: "signes", key: "sticker.signes" },
  { id: "flags", key: "sticker.flags" },
];

type Burst = { id: number; emoji: string; x: number; y: number };

function itemsFor(tab: StickerTab, query: string): StickerItem[] {
  const found = searchStickers(query);
  if (query.trim()) return found;
  if (tab === "recent") return recentStickers().map((emoji) => ({ emoji, words: "" }));
  return STICKER_PACKS.find((pack) => pack.id === tab)?.items ?? [];
}


const POPULAR_STICKERS = ["❤️", "💖", "🎉", "🎂", "🐰", "🌸", "⭐", "🎁", "🇫🇷", "🎃"];

const EMOJI_PACKS: { id: string; key: MessageKey; items: string[] }[] = [
  { id: "smile", key: "emoji.smile", items: ["😀", "😁", "😂", "😊", "😍", "😘", "🥰", "😭", "😡", "😴", "🤔", "😎"] },
  { id: "hands", key: "emoji.hands", items: ["👍", "👏", "🙏", "🫶", "💪", "👋", "✌️", "🤞", "🤗", "💋"] },
  { id: "party", key: "emoji.party", items: ["🎂", "🎉", "🎈", "🎁", "💐", "🥂", "🎄", "🥳", "🎊", "🕯️"] },
  { id: "nature", key: "emoji.nature", items: ["🌸", "🌈", "☀️", "🌙", "⭐", "🍀", "❄️", "🔥", "🌊", "🦋"] },
  { id: "flags", key: "sticker.flags", items: ["🇫🇷", "🇪🇸", "🇮🇹", "🇩🇿", "🇲🇦", "🇹🇳", "🇵🇹", "🇨🇦", "🇧🇪", "🇨🇭", "🇺🇸", "🇬🇧"] },
];

const POPULAR_EMOJI = ["😊", "❤️", "🎉", "🎂", "😘", "👍", "🙏", "🌹", "✨", "🥰"];

function MoreButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  const t = useT();
  return (
    <button type="button" aria-expanded={open} onClick={onClick} className="self-start text-sm font-medium text-wax">
      {open ? t("composer.seeLess") : t("composer.seeMore")} {open ? "▴" : "▾"}
    </button>
  );
}

function Unfold({ open, children }: { open: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = 0;
  }, [open]);
  if (!open) return null;
  return (
    <div ref={ref} className="sticker-unfold flex min-w-0 flex-col gap-3 overflow-y-auto rounded-3xl border border-line bg-paper p-2">
      {children}
    </div>
  );
}

function EmojiButton({ emoji, onPick }: { emoji: string; onPick: (emoji: string, event: React.MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      onClick={(event) => onPick(emoji, event)}
      className="inline-flex size-12 items-center justify-center rounded-2xl border border-line bg-surface text-2xl"
    >
      <span className={stickerMotion(emoji)}>{emoji}</span>
    </button>
  );
}

export function EmojiBar({ onPick }: { onPick: (emoji: string, event: React.MouseEvent<HTMLButtonElement>) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pack, setPack] = useState(EMOJI_PACKS[0].id);
  const items = EMOJI_PACKS.find((item) => item.id === pack)?.items ?? [];
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-ink">{t("composer.emojis")}</legend>
      <div className="flex flex-wrap gap-2">
        {POPULAR_EMOJI.map((emoji) => (
          <EmojiButton key={emoji} emoji={emoji} onPick={onPick} />
        ))}
      </div>
      {open ? (
        <Unfold open>
          <div className="flex flex-wrap gap-2">
            {EMOJI_PACKS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={pack === item.id}
                onClick={() => setPack(item.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  pack === item.id ? "border-ink bg-wax text-onwax" : "border-line bg-surface text-ink",
                )}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {items.map((emoji) => (
              <EmojiButton key={`${pack}-${emoji}`} emoji={emoji} onPick={onPick} />
            ))}
          </div>
        </Unfold>
      ) : null}
      <MoreButton open={open} onClick={() => setOpen((value) => !value)} />
    </fieldset>
  );
}

export function StickerPickButton({ picked, onPick }: { picked: string[]; onPick: (emoji: string) => void }) {
  const t = useT();
  const settings = useBonMoment((state) => state.settings);
  const setSettings = useBonMoment((state) => state.setSettings);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<StickerTab>("hearts");
  const [query, setQuery] = useState("");
  const items = itemsFor(tab, query);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {POPULAR_STICKERS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-pressed={picked.includes(emoji)}
            onClick={() => onPick(emoji)}
            className={cn(
              "inline-flex size-12 items-center justify-center rounded-2xl border text-2xl",
              picked.includes(emoji) ? "border-ink bg-wax" : "border-line bg-paper",
            )}
          >
            <span className={stickerMotion(emoji)}>{emoji}</span>
          </button>
        ))}
      </div>
      <Unfold open={open}>
        <SearchBar value={query} onChange={setQuery} placeholder={t("sticker.find")} />
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={!query.trim() && tab === item.id}
              onClick={() => {
                setTab(item.id);
                setQuery("");
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                !query.trim() && tab === item.id ? "border-ink bg-wax text-onwax" : "border-line bg-surface text-ink",
              )}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
        {items.length === 0 ? <p className="text-sm text-muted">{t("sticker.empty")}</p> : null}
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item.emoji}
                type="button"
                aria-pressed={picked.includes(item.emoji)}
                onClick={() => onPick(item.emoji)}
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-2xl border text-2xl",
                  picked.includes(item.emoji) ? "border-ink bg-wax" : "border-line bg-surface",
                )}
              >
                <span className={stickerMotion(item.emoji)}>{item.emoji}</span>
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-ink">{t("stick.size")}</p>
          <div className="flex flex-wrap gap-2">
            {(["petit", "moyen", "grand"] as StickerSize[]).map((id) => (
              <Chip key={id} active={(settings.stickerSize ?? "moyen") === id} onClick={() => setSettings({ stickerSize: id })}>
                {t(id === "petit" ? "stick.small" : id === "moyen" ? "stick.medium" : "stick.big")}
              </Chip>
            ))}
          </div>
          <p className="text-sm font-medium text-ink">{t("stick.density")}</p>
          <div className="flex flex-wrap gap-2">
            {(["leger", "moyen", "folie"] as StickerDensity[]).map((id) => (
              <Chip key={id} active={(settings.stickerDensity ?? "leger") === id} onClick={() => setSettings({ stickerDensity: id })}>
                {t(id === "leger" ? "stick.light" : id === "moyen" ? "stick.mid" : "stick.wild")}
              </Chip>
            ))}
          </div>
          <p className="text-sm font-medium text-ink">{t("stick.speed")}</p>
          <div className="flex flex-wrap gap-2">
            {(["lent", "vite"] as StickerSpeed[]).map((id) => (
              <Chip key={id} active={(settings.stickerSpeed ?? "lent") === id} onClick={() => setSettings({ stickerSpeed: id })}>
                {t(id === "lent" ? "stick.slow" : "stick.fast")}
              </Chip>
            ))}
          </div>
        </Unfold>
      <MoreButton open={open} onClick={() => setOpen((value) => !value)} />
    </div>
  );
}

export function StickerBar() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<StickerTab>("hearts");
  const [query, setQuery] = useState("");
  const [burst, setBurst] = useState<Burst | null>(null);
  const items = itemsFor(tab, query);

  function place(emoji: string, event: React.MouseEvent<HTMLButtonElement>) {
    playSticker();
    rememberSticker(emoji);
    const latest = useBonMoment.getState().draft;
    const body = latest.body.trimEnd();
    useBonMoment.getState().setDraft({ ...latest, templateId: null, body: body ? `${body} ${emoji}` : emoji });
    const rect = event.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setBurst({ id, emoji, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    window.setTimeout(() => setBurst((current) => (current?.id === id ? null : current)), 700);
  }

  return (
    <>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">{t("composer.stickers")}</legend>
        <div className="flex flex-wrap gap-2">
          {POPULAR_STICKERS.map((emoji) => (
            <EmojiButton key={emoji} emoji={emoji} onPick={place} />
          ))}
        </div>
        <Unfold open={open}>
          <SearchBar value={query} onChange={setQuery} placeholder={t("sticker.find")} />
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={!query.trim() && tab === item.id}
                onClick={() => {
                  setTab(item.id);
                  setQuery("");
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  !query.trim() && tab === item.id ? "border-ink bg-wax text-onwax" : "border-line bg-surface text-ink",
                )}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
          {items.length === 0 ? <p className="px-1 text-sm text-muted">{t("sticker.empty")}</p> : null}
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <EmojiButton key={item.emoji} emoji={item.emoji} onPick={place} />
            ))}
          </div>
        </Unfold>
        <MoreButton open={open} onClick={() => setOpen((value) => !value)} />
      </fieldset>
      <EmojiBar onPick={place} />
      {burst ? <StickerBurst key={burst.id} burst={burst} /> : null}
    </>
  );
}

function StickerBurst({ burst }: { burst: Burst }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
        const reach = 42 + index * 10;
        return (
          <span
            key={index}
            className="sticker-fly absolute text-3xl"
            style={{
              left: burst.x,
              top: burst.y,
              animationDelay: `${index * 20}ms`,
              ["--x" as string]: `${Math.round(Math.cos(angle) * reach)}px`,
              ["--y" as string]: `${Math.round(Math.sin(angle) * reach - 18)}px`,
            }}
          >
            {burst.emoji}
          </span>
        );
      })}
    </div>
  );
}
