import { useRef, useState, useSyncExternalStore } from "react";
import { clearCover, frameCover, peekCover, peekCoverSource, readCover, saveCover, saveCoverPair, subscribeCover } from "@/lib/bonmoment/cover";
import { playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { PhotoShape } from "@/lib/bonmoment/types";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button, Chip } from "./ui";
import { SaveButton } from "./save";

const FALLBACK = "/og.jpg";
const SHAPES: PhotoShape[] = ["free", "square", "landscape", "portrait"];

function useCover() {
  return useSyncExternalStore(subscribeCover, peekCover, () => null);
}

function frameClass(shape: PhotoShape) {
  if (shape === "square") return "aspect-square w-full object-cover";
  if (shape === "landscape") return "aspect-[4/3] w-full object-cover";
  if (shape === "portrait") return "aspect-[3/4] max-h-[70vh] w-full object-cover";
  return "max-h-[70vh] w-full object-contain";
}

export function CoverPanel() {
  const t = useT();
  const custom = useCover();
  const shape = useBonMoment((state) => state.settings.coverShape ?? "free");
  const hidden = useBonMoment((state) => state.settings.coverOff === true);
  const setSettings = useBonMoment((state) => state.setSettings);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const src = hidden ? "" : custom || FALLBACK;

  function closePreview() {
    playTick();
    setOpen(false);
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <legend className="font-medium text-ink">{t("cover.title")}</legend>
      <p className="text-sm text-muted">{t("cover.hint")}</p>
      <p className="text-sm font-medium text-ink">{t("cover.format")}</p>
      <div className="flex flex-wrap gap-2">
        {SHAPES.map((item) => (
          <Chip
            key={item}
            active={shape === item}
            onClick={() => {
              playTick();
              setSettings({ coverShape: item });
              const source = peekCoverSource();
              if (!source) return;
              void frameCover(source, item)
                .then((image) => saveCover(image))
                .catch(() => setError(t("cover.bad")));
            }}
          >
            {t(`photo.shape.${item}`)}
          </Chip>
        ))}
      </div>
      {src ? <img src={src} alt="" className={`rounded-2xl bg-paper ${frameClass(shape)}`} /> : <p className="text-sm text-muted">{t("cover.gone")}</p>}
      <input
        ref={input}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError(null);
          const next = useBonMoment.getState().settings.coverShape ?? "free";
          setSettings({ coverOff: false });
          void readCover(file, next)
            .then((pair) => saveCoverPair(pair.source, pair.framed))
            .catch(() => setError(t("cover.bad")));
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
          {t("cover.pick")}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            playTick();
            if (!src) return;
            setOpen(true);
          }}
        >
          {t("cover.see")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            playTick();
            setError(null);
            setOpen(false);
            setSettings({ coverOff: true });
            void clearCover();
          }}
        >
          {t("cover.delete")}
        </Button>
        <Button variant="ghost" onClick={closePreview}>
          {t("cover.back")}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-wax">
          {error}
        </p>
      ) : null}
      <SaveButton label={t("save.now")} />
      <p className="text-sm text-muted">{t("save.stay")}</p>
      {open && src ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper px-4 pt-6 pb-8">
          <img src={src} alt={t("cover.welcome")} className={`mx-auto max-w-lg rounded-3xl bg-paper ${frameClass(shape)}`} />
          <p className="mt-4 text-center font-serif text-2xl text-ink">{t("cover.welcome")}</p>
          <p className="mt-1 text-center text-sm text-muted">{t("brand.tagline")}</p>
          <Button variant="primary" className="mx-auto mt-6" onClick={closePreview}>
            {t("cover.back")}
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
