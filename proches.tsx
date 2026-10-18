import { useState } from "react";
import { firstName } from "@/lib/bonmoment/message";
import { useBonMoment } from "@/lib/bonmoment/store";
import { getLocale } from "@/lib/bonmoment/i18n";
import { formatBirthday } from "@/lib/bonmoment/time";
import { useT } from "@/lib/bonmoment/use-i18n";
import type { Contact, Relation } from "@/lib/bonmoment/types";
import { knownRelation } from "@/lib/bonmoment/seed";
import { RelationChips, RELATION_KEY } from "./composer";
import { ExampleToggle } from "./agenda";
import { Button, Field, fieldClass } from "./ui";
import { SearchBar, KinshipMarks, contactMatches } from "./search";
import { phoneBookReady, phoneLink, usePhoneHits } from "@/lib/bonmoment/directory";
import { relationOf } from "@/lib/bonmoment/query";
import { PhoneBookAsk, PhoneBookButton, PhoneImportButton } from "./book";

export function Proches() {
  const t = useT();
  const contacts = useBonMoment((state) => state.contacts);
  const schedules = useBonMoment((state) => state.schedules);
  const addContact = useBonMoment((state) => state.addContact);
  const updateContact = useBonMoment((state) => state.updateContact);
  const removeContact = useBonMoment((state) => state.removeContact);
  const beginNew = useBonMoment((state) => state.beginNew);
  const [open, setOpen] = useState(contacts.length === 0);
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [who, setWho] = useState<Relation | "">("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const book = usePhoneHits(query);
  const shown = contacts.filter((contact) => contactMatches(contact, query));
  const known = new Set(contacts.map((item) => item.name.trim().toLocaleLowerCase()));
  const directory = book.hits.filter((person) => !known.has(person.name.trim().toLocaleLowerCase()));

  function create() {
    if (name.trim().length < 2) {
      setError(t("composer.nameError"));
      return;
    }
    const parts = readBirthday(birthday);
    addContact({ name, phone: tel, email, ...parts, ...(who ? { relation: who } : {}), ...(nickname.trim() ? { nickname: nickname.trim() } : {}) });
    setName("");
    setTel("");
    setEmail("");
    setNickname("");
    setBirthday("");
    setWho("");
    setError(null);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl">{t("proches.title")}</h1>
          <p className="mt-2 text-base text-muted">{t("proches.lead")}</p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <Button variant="primary" className="self-start" onClick={() => setOpen((value) => !value)}>
            {open ? t("textes.close") : t("proches.add")}
          </Button>
          <PhoneBookButton
            onPick={(person) => {
              const existing = contacts.find((item) => item.name.trim().toLocaleLowerCase() === person.name.trim().toLocaleLowerCase());
              if (existing) {
                updateContact(existing.id, {
                  phone: person.phone || existing.phone,
                  email: person.email || existing.email,
                  ...(person.month && person.day ? { month: person.month, day: person.day } : {}),
                });
                setOpen(false);
                setError(null);
                return;
              }
              setOpen(true);
              setName(person.name);
              setTel(person.phone);
              setEmail(person.email);
              setBirthday(person.month && person.day ? toBirthdayInput(person.month, person.day) : "");
              setError(null);
            }}
          />
        </div>
        <ExampleToggle />
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <SearchBar value={query} onChange={setQuery} placeholder={t("proches.find")} />
          </div>
          <PhoneImportButton
            onImport={(people) => {
              let added = 0;
              const known = useBonMoment.getState().contacts;
              for (const person of people) {
                const existing = known.find((item) => item.name.trim().toLocaleLowerCase() === person.name.trim().toLocaleLowerCase());
                const day = person.month && person.day ? { month: person.month, day: person.day } : {};
                if (existing) {
                  updateContact(existing.id, {
                    phone: person.phone || existing.phone,
                    email: person.email || existing.email,
                    ...day,
                  });
                  continue;
                }
                addContact({ name: person.name, phone: person.phone, email: person.email, ...day });
                added += 1;
              }
              setOpen(false);
              setError(null);
              return added;
            }}
          />
        </div>
      </header>

      {open ? (
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-sm font-medium text-ink">{t("composer.for")}</p>
            <RelationChips value={who} onChange={setWho} />
          </div>
          <Field label={t("composer.fullName")}>
            <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Inès Bernard" />
          </Field>
          <Field label={t("proches.nickname")} hint={t("proches.nicknameHint")}>
            <input className={fieldClass} value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="ma femme" />
          </Field>
          <Field label={t("composer.phone")}>
            <input className={fieldClass} inputMode="tel" autoComplete="tel" value={tel} onChange={(event) => setTel(event.target.value)} placeholder="06 12 34 56 78" />
          </Field>
          <Field label={t("composer.email")}>
            <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ines@email.fr" />
          </Field>
          <Field label={t("proches.birthday")} hint={t("proches.birthdayHint")}>
            <input className={fieldClass} type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} />
          </Field>
          {error ? (
            <p role="alert" className="text-sm text-wax">
              {error}
            </p>
          ) : null}
          <Button variant="primary" className="self-start" onClick={create}>
            {t("composer.save")}
          </Button>
        </div>
      ) : null}

      {contacts.length === 0 && directory.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-surface px-5 py-6 text-base text-muted">
          {t("proches.empty")}
        </p>
      ) : query.trim() && shown.length === 0 && directory.length === 0 ? (
        <div>
          {book.loading ? <p className="text-base text-muted">{t("load.wait")}</p> : null}
          <KinshipMarks
            query={query}
            onMark={(id, role) => {
              const person = contacts.find((item) => item.id === id);
              updateContact(id, { relation: role, ...(person?.nickname?.trim() ? {} : { nickname: query.trim() }) });
              setQuery("");
            }}
          />
          {relationOf(query) && contacts.some((item) => item.relation !== relationOf(query)) ? null : (
            <p className="text-base text-muted">{t("search.none")}</p>
          )}
          {book.loading || phoneBookReady() ? null : <PhoneBookAsk />}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {directory.map((person) => (
            <li key={`${person.name}-${person.phone}`} className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-sm text-muted">{t("search.phone")}</p>
              <p className="truncate font-medium">{person.name}</p>
              <p className="truncate text-sm text-muted">{person.nickname || person.phone}</p>
              <Button
                variant="primary"
                className="mt-3"
                onClick={() => {
                  const link = phoneLink(person, query);
                  addContact({
                    name: person.name,
                    phone: person.phone,
                    email: person.email,
                    ...link,
                  });
                  setQuery("");
                }}
              >
                {t("proches.add")}
              </Button>
            </li>
          ))}
          {shown.map((contact) => {
            const count = schedules.filter((item) => item.contactId === contact.id && item.status !== "sent").length;
            const link = knownRelation(contact);
            return (
              <li key={contact.id} className="rounded-3xl border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-paper font-serif text-lg" aria-hidden>
                    {initials(contact.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{contact.name}</p>
                    <p className="truncate text-sm text-muted">
                      {link ? `${t(RELATION_KEY[link])} · ` : ""}
                      {contact.nickname?.trim() ? `${contact.nickname.trim()} · ` : ""}
                      {contact.phone.trim() || t("proches.needNumber")}
                      {contact.email.trim() ? ` · ${contact.email.trim()}` : ""}
                      {contact.month && contact.day ? ` · ${formatBirthday(contact.month, contact.day)}` : ""}
                      {count > 0 ? ` · ${t(count > 1 ? "proches.sendsOther" : "proches.sendsOne", { count })}` : ""}
                    </p>
                  </div>
                </div>
                {editing === contact.id ? (
                  <ContactEditor contact={contact} onClose={() => setEditing(null)} onSave={updateContact} />
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => beginNew({ contactId: contact.id })}>
                      {t("proches.schedule")}
                    </Button>
                    <Button variant="quiet" onClick={() => setEditing(contact.id)}>
                      {t("agenda.edit")}
                    </Button>
                    {pendingDelete === contact.id ? (
                      <>
                        <Button variant="primary" onClick={() => removeContact(contact.id)}>
                          {t("agenda.confirm")}
                        </Button>
                        <Button variant="ghost" onClick={() => setPendingDelete(null)}>
                          {t("agenda.cancel")}
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" onClick={() => setPendingDelete(contact.id)}>
                        {t("agenda.remove")}
                      </Button>
                    )}
                  </div>
                )}
                {pendingDelete === contact.id ? (
                  <p className="mt-3 text-sm text-muted">{t("proches.deleteNote", { name: firstName(contact.name) })}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ContactEditor({
  contact,
  onClose,
  onSave,
}: {
  contact: Contact;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Pick<Contact, "name" | "phone" | "email" | "month" | "day" | "relation" | "nickname">>) => void;
}) {
  const t = useT();
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone);
  const [email, setEmail] = useState(contact.email);
  const [who, setWho] = useState<Relation | "">(knownRelation(contact) ?? "");
  const [nick, setNick] = useState(contact.nickname ?? "");
  const [birthday, setBirthday] = useState(contact.month && contact.day ? toBirthdayInput(contact.month, contact.day) : "");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm font-medium text-ink">{t("composer.for")}</p>
        <RelationChips value={who} onChange={setWho} />
      </div>
      <Field label={t("proches.name")}>
        <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label={t("proches.nickname")} hint={t("proches.nicknameHint")}>
        <input className={fieldClass} value={nick} onChange={(event) => setNick(event.target.value)} placeholder="ma femme" />
      </Field>
      <Field label={t("composer.phone")}>
        <input className={fieldClass} inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </Field>
      <Field label={t("composer.email")}>
        <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field label={t("proches.birthday")} hint={t("proches.birthdayHint")}>
        <input className={fieldClass} type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-wax">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            if (name.trim().length < 2) {
              setError(t("proches.shortName"));
              return;
            }
            onSave(contact.id, {
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim(),
              nickname: nick.trim(),
              ...(who ? { relation: who } : {}),
              ...readBirthday(birthday),
            });
            onClose();
          }}
        >
          {t("composer.save")}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t("agenda.cancel")}
        </Button>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part.charAt(0).toLocaleUpperCase(getLocale())).join("");
  return letters || "·";
}

function toBirthdayInput(month: number, day: number): string {
  return `2000-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function readBirthday(value: string): { month?: number; day?: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { month: undefined, day: undefined };
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return { month: undefined, day: undefined };
  return { month, day };
}
