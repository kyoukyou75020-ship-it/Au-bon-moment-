import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import { clearOriginFilm, dropIntroFilm, introSrc, listIntroFilms, originFilm, pickedIntro, pickIntro, replaceOriginFilm, type IntroFilm } from "@/lib/bonmoment/intro-film";
import type { PhotoShape } from "@/lib/bonmoment/types";
import { useT } from "@/lib/bonmoment/use-i18n";
import { cn } from "@/lib/cn";
import { Button, Chip } from "./ui";
import { SaveButton } from "./save";

const INTRO_KEY = "bonmoment.intro";
const FOR_KEY = "bonmoment.intro.for";

function frameStyle(shape: PhotoShape, size: number): CSSProperties {
  if (shape === "square") return { width: `min(${size}%, ${size}dvh)`, aspectRatio: "1" };
  if (shape === "landscape") return { width: `${size}%`, maxHeight: "100%", aspectRatio: "4 / 3" };
  if (shape === "portrait") return { height: `${size}%`, maxWidth: "100%", aspectRatio: "3 / 4" };
  return { width: `${size}%`, height: `${size}%` };
}

export function introSeen() {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function introDue() {
  if (!introSeen()) return true;
  const pick = pickedIntro();
  if (!pick) return false;
  try {
    return localStorage.getItem(FOR_KEY) !== pick;
  } catch {
    return false;
  }
}

export function forgetIntro() {
  try {
    localStorage.removeItem(INTRO_KEY);
    localStorage.removeItem(FOR_KEY);
  } catch {
    /* the next opening can show it */
  }
}

export function Intro({ onDone, preview = false }: { onDone: () => void; preview?: boolean }) {
  const t = useT();
  const size = useBonMoment((state) => state.settings.introSize ?? 100);
  const shape = useBonMoment((state) => state.settings.introShape ?? "free");
  const fit = useBonMoment((state) => state.settings.introFit ?? "plein");
  const soundOn = useBonMoment((state) => state.settings.introSound !== false);
  const video = useRef<HTMLVideoElement>(null);
  const held = useRef("");
  const [quiet, setQuiet] = useState(false);
  const [src, setSrc] = useState("");

  function finish() {
    video.current?.pause();
    if (!preview) {
      try {
        localStorage.setItem(INTRO_KEY, "1");
        localStorage.setItem(FOR_KEY, pickedIntro());
      } catch {
        /* the next visit can show it again */
      }
    }
    onDone();
  }

  useEffect(() => {
    let dead = false;
    let blob = "";
    void introSrc()
      .then((next) => {
        if (dead) {
          if (next.startsWith("blob:")) URL.revokeObjectURL(next);
          return;
        }
        blob = next.startsWith("blob:") ? next : "";
        held.current = blob;
        setSrc(next);
      })
      .catch(() => {
        if (!dead) setSrc("/intro.mp4");
      });
    return () => {
      dead = true;
      if (held.current) {
        URL.revokeObjectURL(held.current);
        held.current = "";
      }
    };
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node || !src) return;
    if (!soundOn) {
      node.muted = true;
      void node.play().catch(() => undefined);
      return;
    }
    node.muted = false;
    void node.play().catch(() => {
      node.muted = true;
      setQuiet(true);
      void node.play().catch(() => undefined);
    });
  }, [src, soundOn]);

  function sound() {
    const node = video.current;
    if (!node) return;
    node.muted = false;
    setQuiet(false);
    void node.play().catch(() => undefined);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-ink">
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        {src ? (
          <div className="overflow-hidden" style={frameStyle(shape, size)}>
            <video
              key={src}
              ref={video}
              src={src}
              playsInline
              autoPlay
              className={cn("h-full w-full", fit === "entier" ? "object-contain" : "object-cover")}
              onEnded={finish}
            />
          </div>
        ) : null}
      </div>
      <button type="button" onClick={finish} className="absolute top-4 right-4 z-10 rounded-full bg-ink/45 px-4 py-2 text-sm text-white">
        {t("intro.skip")}
      </button>
      {quiet ? (
        <button type="button" onClick={sound} className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-sm text-ink">
          {t("intro.sound")}
        </button>
      ) : null}
    </div>,
    document.body,
  );
}

export function IntroPanel() {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [films, setFilms] = useState<IntroFilm[]>([]);
  const [origin, setOrigin] = useState<IntroFilm | null>(null);
  const [picked, setPicked] = useState("");
  const [error, setError] = useState<"bad" | "big" | null>(null);
  const [open, setOpen] = useState(false);
  const videoOff = useBonMoment((state) => state.settings.introOff === true);

  async function reload() {
    setFilms(await listIntroFilms());
    setOrigin(await originFilm());
    setPicked(pickedIntro());
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <section ref={panel} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("intro.film")}</p>
        <p className="mt-1 text-sm text-muted">{videoOff ? t("intro.gone") : t("intro.filmHint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${!videoOff && !picked ? "border-ink" : "border-line"}`}>
          <button
            type="button"
            onClick={() => {
              playTick();
              useBonMoment.getState().setSettings({ introOff: false });
              pickIntro("");
              setPicked("");
            }}
            className="min-w-0 flex-1 truncate text-left text-sm text-ink"
          >
            {origin?.name ?? t("intro.default")}
          </button>
          {origin ? (
            <button
              type="button"
              className="text-sm text-muted"
              onClick={() => {
                playTick();
                void clearOriginFilm().then(reload);
              }}
            >
              {t("intro.restore")}
            </button>
          ) : null}
        </div>
        {films.map((film) => (
          <div key={film.id} className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${!videoOff && picked === film.id ? "border-ink" : "border-line"}`}>
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-sm text-ink"
              onClick={() => {
                playTick();
                useBonMoment.getState().setSettings({ introOff: false });
                pickIntro(film.id);
                setPicked(film.id);
              }}
            >
              {film.name}
            </button>
            <button
              type="button"
              className="text-sm text-muted"
              onClick={() => {
                playTick();
                void dropIntroFilm(film.id).then(reload);
              }}
            >
              {t("intro.remove")}
            </button>
          </div>
        ))}
      </div>
      <input
        ref={input}
        className="hidden"
        type="file"
        accept="video/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError(null);
          void replaceOriginFilm(file)
            .then(() => {
              useBonMoment.getState().setSettings({ introOff: false });
              return reload();
            })
            .catch((reason: unknown) => setError(reason instanceof Error && reason.message === "big" ? "big" : "bad"));
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            playTick();
            input.current?.click();
          }}
        >
          {t("intro.change")}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            playTick();
            setOpen(true);
          }}
        >
          {t("intro.replay")}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            playTick();
            useBonMoment.getState().setSettings({ introOff: true });
            pickIntro("");
            setPicked("");
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          {t("intro.removeVideo")}
        </Button>
      </div>
      {error ? <p className="text-sm text-wax">{t(error === "big" ? "intro.big" : "intro.bad")}</p> : null}
      <IntroFit />
      <SaveButton
        label={t("save.now")}
        onSaved={() => {
          forgetIntro();
        }}
      />
      <p className="text-sm text-muted">{t("save.stay")}</p>
      {open ? (
        <Intro
          preview
          onDone={() => {
            setOpen(false);
            requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "center" }));
          }}
        />
      ) : null}
    </section>
  );
}

const SHAPES: PhotoShape[] = ["free", "square", "landscape", "portrait"];

function IntroFit() {
  const t = useT();
  const size = useBonMoment((state) => state.settings.introSize ?? 100);
  const shape = useBonMoment((state) => state.settings.introShape ?? "free");
  const fit = useBonMoment((state) => state.settings.introFit ?? "plein");
  const soundOn = useBonMoment((state) => state.settings.introSound !== false);
  const every = useBonMoment((state) => state.settings.introEvery === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2 text-sm text-ink">
        {t("intro.size")}
        <input
          type="range"
          min={40}
          max={100}
          value={size}
          onChange={(event) => setSettings({ introSize: Number(event.target.value) })}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {SHAPES.map((item) => (
          <Chip
            key={item}
            active={shape === item}
            onClick={() => {
              playTick();
              setSettings({ introShape: item });
            }}
          >
            {t(`photo.shape.${item}`)}
          </Chip>
        ))}
      </div>
      <p className="text-sm font-medium text-ink">{t("intro.fit")}</p>
      <div className="flex flex-wrap gap-2">
        {(["plein", "entier"] as const).map((item) => (
          <Chip
            key={item}
            active={fit === item}
            onClick={() => {
              playTick();
              setSettings({ introFit: item });
            }}
          >
            {t(item === "plein" ? "intro.full" : "intro.whole")}
          </Chip>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" checked={soundOn} onChange={(event) => setSettings({ introSound: event.target.checked })} />
        {t("intro.soundOn")}
      </label>
      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" checked={every} onChange={(event) => setSettings({ introEvery: event.target.checked })} />
        {t("intro.every")}
      </label>
    </div>
  );
}
