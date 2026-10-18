import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { lookOf, SEASON, marksForMonth, type DayMark } from "@/lib/bonmoment/calendar";
import { occasionLabel, defaultRepeat } from "@/lib/bonmoment/occasions";
import { playOccasion, playPage, playSparkle, playTick } from "@/lib/bonmoment/sound";
import { useBonMoment } from "@/lib/bonmoment/store";
import { monthTitle, toDateInput, weekdayInitials } from "@/lib/bonmoment/time";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button } from "./ui";
import { Confetti } from "./confetti";

export function CalendarView() {
  const t = useT();
  const clockSynced = useBonMoment((state) => state.clockSynced);
  const contacts = useBonMoment((state) => state.contacts);
  const schedules = useBonMoment((state) => state.schedules);
  const templates = useBonMoment((state) => state.templates);
  const beginNew = useBonMoment((state) => state.beginNew);
  const beginEdit = useBonMoment((state) => state.beginEdit);
  const setTab = useBonMoment((state) => state.setTab);
  const [cursor, setCursor] = useState<{ year: number; month: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [party, setParty] = useState(0);
  const [slide, setSlide] = useState<"next" | "prev">("next");
  const today = clockSynced ? new Date() : null;
  const year = cursor?.year ?? today?.getFullYear() ?? 2026;
  const month = cursor?.month ?? (today ? today.getMonth() + 1 : 10);
  const marks = clockSynced ? marksForMonth(year, month, contacts, schedules) : new Map<number, DayMark[]>();
  const firstPad = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();
  const cells = [...Array.from({ length: firstPad }, () => null), ...Array.from({ length: count }, (_, index) => index + 1)];
  const selected = picked && marks.get(picked) ? marks.get(picked)! : [];
  const season = SEASON[month - 1] ?? "✨";

  useEffect(() => {
    if (!clockSynced || opened) return;
    setPicked(new Date().getDate());
    setOpened(true);
    setParty(1);
  }, [clockSynced, opened]);

  function shift(by: number) {
    playTick();
    setSlide(by > 0 ? "next" : "prev");
    const next = new Date(year, month - 1 + by, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() + 1 });
    setPicked(null);
    setParty((value) => value + 1);
  }

  function choose(day: number) {
    setPicked(day);
    setParty((value) => value + 1);
    const first = marks.get(day)?.[0];
    if (first) {
      playOccasion(first.occasion);
      playSparkle();
      return;
    }
    playTick();
  }

  function write(day: number, mark?: DayMark) {
    if (mark?.scheduleId) {
      beginEdit(mark.scheduleId);
      return;
    }
    const occasion = mark?.occasion ?? "autre";
    const template = templates.find((item) => item.occasion === occasion);
    beginNew({
      occasion,
      contactId: mark?.contactId ?? "",
      date: toDateInput(new Date(year, month - 1, day)),
      templateId: template?.id ?? null,
      body: template?.body ?? "",
      repeat: defaultRepeat(occasion),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl leading-none" aria-hidden>
            <span className="garland-emoji">{season}</span>
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl">{t("calendar.title")}</h1>
          <p className="mt-2 text-base text-muted">{t("calendar.lead")}</p>
        </div>
        <Button
          variant="quiet"
          onClick={() => {
            playPage();
            setTab("agenda");
          }}
        >
          {t("calendar.back")}
        </Button>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-4 shadow-lift">
        <span className="garland-emoji pointer-events-none absolute top-3 left-6 text-2xl opacity-70" aria-hidden>
          {season}
        </span>
        <span className="garland-emoji pointer-events-none absolute top-8 right-8 text-xl opacity-60" style={{ ["--delay" as string]: "0.4s" }} aria-hidden>
          ✨
        </span>
        <Confetti />
        {party ? <Confetti key={party} burst local /> : null}
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="inline-flex size-11 items-center justify-center rounded-full border border-line" onClick={() => shift(-1)} aria-label="-">
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <p className="font-serif text-2xl capitalize text-ink" suppressHydrationWarning>
              {clockSynced ? monthTitle(year, month) : "—"}
            </p>
            {today && (today.getMonth() + 1 !== month || today.getFullYear() !== year) ? (
              <button
                type="button"
                className="mt-1 text-sm text-wax"
                onClick={() => {
                  playTick();
                  setCursor(null);
                  setPicked(today.getDate());
                }}
              >
                {t("calendar.today")}
              </button>
            ) : null}
          </div>
          <button type="button" className="inline-flex size-11 items-center justify-center rounded-full border border-line" onClick={() => shift(1)} aria-label="+">
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {weekdayInitials().map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

        <div key={`${year}-${month}`} className={`${slide === "prev" ? "month-prev" : "month-next"} mt-2 grid grid-cols-7 gap-1`}>
          {cells.map((day, index) => {
            if (!day) return <span key={`pad-${index}`} />;
            const items = marks.get(day) ?? [];
            const isToday = today?.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
            const active = picked === day;
            const tint = items[0] ? lookOf(items[0].occasion).tint : undefined;
            return (
              <button
                key={day}
                type="button"
                onClick={() => choose(day)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border text-sm ${
                  active ? "day-hit" : items.length ? "day-party" : ""
                } ${active ? "border-ink" : isToday ? "border-wax" : "border-transparent"}`}
                style={{ background: tint ? `color-mix(in srgb, ${tint} 55%, white)` : "transparent" }}
              >
                <span className={`tabular-nums ${isToday ? "font-semibold text-wax" : "text-ink"}`}>{day}</span>
                <span className="mt-0.5 flex h-4 gap-0.5 text-xs leading-none" aria-hidden>
                  {items.slice(0, 2).map((item) => (
                    <span key={item.key} className={item.sent ? "opacity-40" : ""}>
                      {lookOf(item.occasion).emoji}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {picked ? (
        <section className="rise flex flex-col gap-3">
          <h2 className="font-serif text-2xl">
            {picked} {clockSynced ? monthTitle(year, month).split(" ")[0] : ""}
          </h2>
          {selected.length === 0 ? <p className="text-sm text-muted">{t("calendar.empty")}</p> : null}
          {selected.map((mark) => (
            <button
              key={mark.key}
              type="button"
              onClick={() => write(picked, mark)}
              className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-4 py-3 text-left"
            >
              <span className="text-2xl" aria-hidden>
                {lookOf(mark.occasion).emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-ink">{mark.title || occasionLabel(mark.occasion)}</span>
                <span className="block text-sm text-muted">{occasionLabel(mark.occasion)}</span>
              </span>
            </button>
          ))}
          <Button variant="primary" className="self-start" onClick={() => write(picked)}>
            {t("calendar.write")}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
