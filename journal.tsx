import { channelLabel, occasionLabel } from "@/lib/bonmoment/occasions";
import { useBonMoment } from "@/lib/bonmoment/store";
import { formatWhen } from "@/lib/bonmoment/time";
import { useT } from "@/lib/bonmoment/use-i18n";
import { playTick } from "@/lib/bonmoment/sound";
import { announce } from "./notifications";
import { Button } from "./ui";
import { CopyMessage } from "./copy";
import { RemovePhotoButton } from "./ui";
import { RemoveVideoButton, VideoFrame } from "./clip";
import { DownloadFile, DownloadVideo } from "./fetch";
import { VoiceLine } from "./voice";

export function Journal() {
  const t = useT();
  const logs = useBonMoment((state) => state.logs);
  const clearLogImage = useBonMoment((state) => state.clearLogImage);
  const clearLogVideo = useBonMoment((state) => state.clearLogVideo);
  const clearLogVoice = useBonMoment((state) => state.clearLogVoice);
  const markGot = useBonMoment((state) => state.markGot);
  const tellGot = useBonMoment((state) => state.settings.tellGot === true);
  const now = new Date();
  const monthLogs = logs.filter((log) => {
    const sent = new Date(log.sentAt);
    return sent.getFullYear() === now.getFullYear() && sent.getMonth() === now.getMonth();
  });
  const birthdays = monthLogs.filter((log) => log.occasion === "anniversaire").length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl md:text-4xl">{t("journal.title")}</h1>
        <p className="mt-2 text-base text-muted">{t("journal.lead")}</p>
      </header>
      <div className="rounded-3xl border border-line bg-surface p-4">
        <p className="text-base font-medium text-ink">
          {monthLogs.length === 0 ? t("journal.monthNone") : t("journal.month", { count: monthLogs.length })}
        </p>
        {birthdays > 0 ? <p className="mt-1 text-sm text-muted">{t("journal.monthBirth", { count: birthdays })}</p> : null}
      </div>
      {logs.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-surface px-5 py-6 text-base text-muted">
          {t("journal.empty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {logs.map((log) => (
            <li key={log.id} className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-sm text-muted">{formatWhen(log.sentAt)}</p>
              <h2 className="mt-1 text-2xl">{log.contactName}</h2>
              {log.fileName ? <p className="mt-1 text-sm font-medium text-ink">{log.fileName}</p> : null}
              <p className="mt-1 text-sm text-muted">
                {occasionLabel(log.occasion)} · {channelLabel(log.channel)}
              </p>
              {log.image ? (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <img src={log.image} alt="" className="max-h-48 w-full rounded-2xl object-cover" />
                  <div className="flex flex-wrap gap-2">
                    <RemovePhotoButton onRemove={() => clearLogImage(log.id)} />
                    <DownloadFile href={log.image} name="bonmoment.jpg" label={t("photo.download")} />
                  </div>
                </div>
              ) : null}
              {log.video ? (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <VideoFrame id={log.video} tall />
                  <div className="flex flex-wrap gap-2">
                    <RemoveVideoButton onRemove={() => clearLogVideo(log.id)} />
                    <DownloadVideo id={log.video} />
                  </div>
                </div>
              ) : null}
              {log.voice ? <VoiceLine id={log.voice} style={log.voiceStyle} onRemove={() => clearLogVoice(log.id)} /> : null}
              <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">{log.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <CopyMessage text={log.body} />
                {tellGot && !log.gotAt ? (
                  <Button
                    variant="quiet"
                    onClick={() => {
                      playTick();
                      markGot(log.id);
                      announce("got", log.contactName);
                    }}
                  >
                    {t("tell.mark")}
                  </Button>
                ) : null}
                {log.gotAt ? <p className="text-sm text-muted">{t("notify.got", { name: log.contactName })}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
