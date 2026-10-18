import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { loadClip, peekPoster } from "@/lib/bonmoment/video";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button } from "./ui";

function useClip(id: string): { url: string | null; poster: string } {
  const [url, setUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState(() => peekPoster(id));

  useEffect(() => {
    let dead = false;
    let objectUrl = "";
    setPoster(peekPoster(id));
    setUrl(null);
    void loadClip(id).then((clip) => {
      if (dead || !clip) return;
      objectUrl = URL.createObjectURL(clip.blob);
      setUrl(objectUrl);
      setPoster(clip.poster);
    });
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return { url, poster };
}

export function VideoFrame({ id, tall = false }: { id: string; tall?: boolean }) {
  const t = useT();
  const { url, poster } = useClip(id);
  if (!url) {
    return poster ? (
      <img src={poster} alt="" className={`w-full rounded-2xl object-cover ${tall ? "h-40" : "h-24"}`} />
    ) : (
      <div className={`flex w-full items-center justify-center rounded-2xl bg-paper text-sm text-muted ${tall ? "h-40" : "h-24"}`}>
        {t("video.wait")}
      </div>
    );
  }
  return (
    <video
      src={url}
      poster={poster || undefined}
      controls
      playsInline
      preload="metadata"
      className={`w-full rounded-2xl bg-paper object-cover ${tall ? "max-h-64" : "h-36"}`}
    />
  );
}

export function RemoveVideoButton({ onRemove }: { onRemove: () => void }) {
  const t = useT();
  return (
    <Button variant="quiet" onClick={onRemove}>
      <Trash2 className="size-4" aria-hidden />
      {t("video.remove")}
    </Button>
  );
}

export function VideoExtra({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const t = useT();
  return (
    <div className="mb-4">
      <VideoFrame id={id} tall />
      {onRemove ? (
        <div className="mt-2">
          <RemoveVideoButton onRemove={onRemove} />
        </div>
      ) : null}
      <p className="mt-2 text-sm text-muted">{t("video.hint")}</p>
    </div>
  );
}
