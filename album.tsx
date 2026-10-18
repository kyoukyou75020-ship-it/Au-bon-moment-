import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { addShots, loadAlbum, peekAlbum, removeShot, subscribeAlbum } from "@/lib/bonmoment/album";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button } from "./ui";

export function AlbumPanel() {
  const t = useT();
  const shots = useSyncExternalStore(subscribeAlbum, peekAlbum, peekAlbum);
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<"full" | "bad" | null>(null);

  useEffect(() => {
    void loadAlbum();
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{t("album.lead")}</p>
      <p className="text-sm text-ink">{t("album.count", { n: shots.length })}</p>
      <input
        ref={file}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          const list = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (list.length === 0) return;
          void addShots(list).then((result) => setNote(result === "ok" ? null : result));
        }}
      />
      <Button variant="primary" className="self-start" onClick={() => file.current?.click()}>
        {t("album.add")}
      </Button>
      {note === "full" ? <p className="text-sm text-wax">{t("album.full")}</p> : null}
      {note === "bad" ? <p className="text-sm text-wax">{t("album.bad")}</p> : null}
      {shots.length === 0 ? <p className="text-sm text-muted">{t("album.empty")}</p> : null}
      {shots.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {shots.map((shot) => (
            <li key={shot.id} className="relative">
              <img src={shot.data} alt={shot.name} className="aspect-square w-full rounded-2xl object-cover" />
              <button
                type="button"
                aria-label={t("album.remove")}
                onClick={() => void removeShot(shot.id)}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-paper/90 text-sm text-ink"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
