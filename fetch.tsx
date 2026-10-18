import { useState } from "react";
import { Download, Link2, Sparkles } from "lucide-react";
import { downloadBlob, downloadHref, fileFromUrl } from "@/lib/bonmoment/media";
import { loadClip } from "@/lib/bonmoment/video";
import { allowsNet, appUrl } from "@/lib/bonmoment/remote";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { OccasionId } from "@/lib/bonmoment/types";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button, fieldClass } from "./ui";

export function DownloadFile({ href, name, label }: { href: string; name: string; label: string }) {
  return (
    <Button variant="quiet" onClick={() => downloadHref(href, name)}>
      <Download className="size-4" aria-hidden />
      {label}
    </Button>
  );
}

export function DownloadVideo({ id }: { id: string }) {
  const t = useT();
  return (
    <Button
      variant="quiet"
      onClick={() =>
        void loadClip(id).then((clip) => {
          if (!clip) return;
          const ext = clip.mime.includes("webm") ? "webm" : "mp4";
          downloadBlob(clip.blob, `bonmoment.${ext}`);
        })
      }
    >
      <Download className="size-4" aria-hidden />
      {t("video.download")}
    </Button>
  );
}

export function WebFetch({
  kind,
  onFile,
}: {
  kind: "image" | "video";
  onFile: (file: File) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button variant="quiet" onClick={() => setOpen(true)}>
        <Link2 className="size-4" aria-hidden />
        {t("web.add")}
      </Button>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <input
        className={fieldClass}
        inputMode="url"
        placeholder="https://"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
      />
      <p className="text-sm text-muted">{t("web.hint")}</p>
      {error ? (
        <p role="alert" className="text-sm text-wax">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={busy || !url.trim()}
          onClick={() => {
            setBusy(true);
            setError(null);
            void fileFromUrl(url, kind)
              .then((file) => {
                onFile(file);
                setOpen(false);
                setUrl("");
              })
              .catch(() => setError(t("web.bad")))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? t("load.wait") : t("web.go")}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          {t("agenda.cancel")}
        </Button>
      </div>
    </div>
  );
}

function fileFrom64(image: string, mime: string): File {
  const bin = atob(image);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  const type = mime.startsWith("image/") ? mime : "image/png";
  return new File([bytes], "dessin.png", { type });
}

export function AiPicture({ occasion, onFile }: { occasion: OccasionId; onFile: (file: File) => void }) {
  const t = useT();
  const server = useBonMoment((state) => state.settings.gatewayUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function draw() {
    setBusy(true);
    setNote(null);
    const url = appUrl(server, "/api/picture");
    if (!url || !allowsNet()) {
      setNote(t("photo.aiOff"));
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ occasion }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; image?: string; mime?: string; reason?: string } | null;
      if (!data?.ok || !data.image) {
        setNote(t(data?.reason === "credit" ? "photo.aiCredit" : data?.reason === "limit" ? "photo.aiLimit" : "photo.aiFail"));
        return;
      }
      onFile(fileFrom64(data.image, data.mime ?? "image/png"));
    } catch {
      setNote(t("photo.aiFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex min-w-0 flex-col gap-1">
      <Button variant="quiet" disabled={busy} onClick={() => void draw()}>
        <Sparkles className="size-4" aria-hidden />
        {busy ? t("photo.aiWait") : t("photo.ai")}
      </Button>
      {note ? <span className="text-sm text-ink">{note}</span> : null}
    </span>
  );
}
