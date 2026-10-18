import { useState } from "react";
import { Contact } from "lucide-react";
import { askPhoneBook, pickFromPhone, pickManyFromPhone, type PhonePerson } from "@/lib/bonmoment/directory";
import { playChime, playTick } from "@/lib/bonmoment/sound";
import { useT } from "@/lib/bonmoment/use-i18n";
import { Button } from "./ui";

export function PhoneBookButton({ onPick }: { onPick: (person: PhonePerson) => void }) {
  const t = useT();
  const [note, setNote] = useState<"hint" | "bad">("hint");

  async function pick() {
    playTick();
    const person = await pickFromPhone();
    if (!person || person.name.length < 2) {
      setNote("bad");
      return;
    }
    playChime();
    setNote("hint");
    onPick(person);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="quiet" title={t("book.hint")} onClick={() => void pick()}>
        <Contact className="size-4" aria-hidden />
        {t("book.button")}
      </Button>
      {note === "bad" ? <p className="text-sm text-muted">{t("book.bad")}</p> : null}
    </div>
  );
}

export function PhoneBookAsk() {
  const t = useT();
  const [bad, setBad] = useState(false);
  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      <Button
        variant="quiet"
        onClick={() => {
          setBad(false);
          void askPhoneBook().then((ok) => setBad(!ok));
        }}
      >
        <Contact className="size-4" aria-hidden />
        {t("search.askBook")}
      </Button>
      <p className="text-sm text-muted">{bad ? t("book.bad") : t("search.phoneOff")}</p>
    </div>
  );
}

export function PhoneImportButton({ onImport }: { onImport: (people: PhonePerson[]) => number }) {
  const t = useT();
  const [note, setNote] = useState<"hint" | "bad" | "none" | number>("hint");

  async function run() {
    playTick();
    const people = await pickManyFromPhone();
    if (!people) {
      setNote("bad");
      return;
    }
    if (people.length === 0) {
      setNote("none");
      return;
    }
    playChime();
    setNote(onImport(people));
  }

  const line =
    note === "bad" ? t("book.bad") : note === "none" || note === 0 ? t("book.none") : typeof note === "number" ? t(note === 1 ? "book.importedOne" : "book.imported", { count: note }) : "";

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="quiet" title={t("book.importHint")} onClick={() => void run()}>
        <Contact className="size-4" aria-hidden />
        {t("book.import")}
      </Button>
      {line ? <p className="text-sm text-muted">{line}</p> : null}
    </div>
  );
}
