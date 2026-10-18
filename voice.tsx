import { useEffect, useRef, useState } from "react";
import { Download, Mic, Square, Trash2, Volume2 } from "lucide-react";
import { downloadBlob } from "@/lib/bonmoment/media";
import type { VoiceStyle } from "@/lib/bonmoment/types";
import { loadVoice, playVoice, recordVoice, speakOnline, speakText, stopVoice, VOICE_STYLES } from "@/lib/bonmoment/voice";
import { useT } from "@/lib/bonmoment/use-i18n";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import { Button, Chip } from "./ui";

const STYLE_KEY: Record<VoiceStyle, MessageKey> = {
  plain: "voice.style.plain",
  bear: "voice.style.bear",
  quick: "voice.style.quick",
  robot: "voice.style.robot",
  mouse: "voice.style.mouse",
  soft: "voice.style.soft",
  vive: "voice.style.vive",
  grave: "voice.style.grave",
  tendre: "voice.style.tendre",
  rieuse: "voice.style.rieuse",
  conte: "voice.style.conte",
  calme: "voice.style.calme",
};

export function VoiceCard({
  id,
  style,
  text,
  onStyle,
  onSaved,
  onRemove,
}: {
  id?: string;
  style: VoiceStyle;
  text: string;
  onStyle: (style: VoiceStyle) => void;
  onSaved: (id: string) => void;
  onRemove?: () => void;
}) {
  const t = useT();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [take, setTake] = useState<{ stop: () => Promise<string>; cancel: () => void } | null>(null);
  const takeRef = useRef(take);
  takeRef.current = take;

  useEffect(() => {
    return () => {
      takeRef.current?.cancel();
      stopVoice();
    };
  }, []);

  async function record() {
    setError(null);
    try {
      const next = await recordVoice();
      setTake(next);
      setRecording(true);
    } catch {
      setError(t("voice.need"));
    }
  }

  async function finish() {
    if (!take) return;
    setBusy(true);
    try {
      const saved = await take.stop();
      setTake(null);
      setRecording(false);
      onSaved(saved);
    } catch {
      setError(t("voice.bad"));
      setRecording(false);
      setTake(null);
    } finally {
      setBusy(false);
    }
  }

  async function listen() {
    setError(null);
    try {
      if (id) await playVoice(id, style);
      else {
        const server = useBonMoment.getState().settings.gatewayUrl ?? "";
        const online = await speakOnline(text, style, server);
        if (!online) speakText(text, style, useBonMoment.getState().settings.speakLang ?? "fr");
      }
    } catch {
      setError(t("voice.bad"));
    }
  }

  async function download() {
    if (!id) return;
    const clip = await loadVoice(id);
    if (!clip) {
      setError(t("voice.bad"));
      return;
    }
    const ext = clip.mime.includes("mp4") ? "m4a" : "webm";
    downloadBlob(clip.blob, `bonmoment.${ext}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">{t("voice.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("voice.hint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {VOICE_STYLES.map((item) => (
          <Chip key={item} active={style === item} onClick={() => onStyle(item)}>
            {t(STYLE_KEY[item])}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {recording ? (
          <Button variant="primary" disabled={busy} onClick={() => void finish()}>
            <Square className="size-4" aria-hidden />
            {t("voice.stop")}
          </Button>
        ) : (
          <Button variant="quiet" onClick={() => void record()}>
            <Mic className="size-4" aria-hidden />
            {t("voice.record")}
          </Button>
        )}
        <Button variant="quiet" onClick={() => void listen()}>
          <Volume2 className="size-4" aria-hidden />
          {id ? t("voice.listen") : t("voice.speak")}
        </Button>
        {id ? (
          <Button variant="quiet" onClick={() => void download()}>
            <Download className="size-4" aria-hidden />
            {t("voice.download")}
          </Button>
        ) : null}
        {id && onRemove ? (
          <Button variant="quiet" onClick={onRemove}>
            <Trash2 className="size-4" aria-hidden />
            {t("voice.remove")}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-wax">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function VoiceLine({
  id,
  style = "plain",
  onRemove,
}: {
  id: string;
  style?: VoiceStyle;
  onRemove?: () => void;
}) {
  const t = useT();
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="quiet" onClick={() => void playVoice(id, style)}>
        <Volume2 className="size-4" aria-hidden />
        {t("voice.listen")}
      </Button>
      <Button
        variant="quiet"
        onClick={() =>
          void loadVoice(id).then((clip) => {
            if (!clip) return;
            downloadBlob(clip.blob, "bonmoment.webm");
          })
        }
      >
        <Download className="size-4" aria-hidden />
        {t("voice.download")}
      </Button>
      {onRemove ? (
        <Button variant="quiet" onClick={onRemove}>
          <Trash2 className="size-4" aria-hidden />
          {t("voice.remove")}
        </Button>
      ) : null}
    </div>
  );
}
