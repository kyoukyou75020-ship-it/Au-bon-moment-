import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Search } from "lucide-react";
import { OCCASIONS, occasionLabel } from "@/lib/bonmoment/occasions";
import { useBonMoment } from "@/lib/bonmoment/store";
import type { MessageKey } from "@/lib/bonmoment/i18n";
import type { WriteForm } from "@/lib/bonmoment/ideas";
import { useT } from "@/lib/bonmoment/use-i18n";
import { contactMatches, matchesQuery, relationOf } from "@/lib/bonmoment/query";
import { phoneBookReady, phoneLink, usePhoneHits } from "@/lib/bonmoment/directory";
import type { Relation } from "@/lib/bonmoment/types";
import { fieldClass } from "./ui";
import { PhoneBookAsk } from "./book";

export { matchesQuery, contactMatches };

let fold = "";
let stamp = 0;
let formPick: WriteForm | null = null;
const ears = new Set<() => void>();

export function jumpTo(id: string) {
  fold = id;
  stamp += 1;
  ears.forEach((hear) => hear());
}

export function peekFold() {
  return fold;
}

export function useJumpTick() {
  return useSyncExternalStore(
    (hear) => {
      ears.add(hear);
      return () => ears.delete(hear);
    },
    () => stamp,
    () => 0,
  );
}

export function stageForm(next: WriteForm) {
  formPick = next;
}

export function takeWriteForm(): WriteForm | null {
  const next = formPick;
  formPick = null;
  return next;
}

const SETTINGS: { fold: string; title: MessageKey; words: string }[] = [
  { fold: "look", title: "color.title", words: "couleur couleurs bouton theme bordeaux crayon arc-en-ciel 3d relief volume" },
  { fold: "look", title: "intro.film", words: "video presentation intro accueil halloween noel ete changer" },
  { fold: "fond", title: "color.paper", words: "fond fond d'ecran papier arriere-plan intensite" },
  { fold: "place", title: "place.title", words: "icone icones rubrique rubriques deplacer ordre place barre" },
  { fold: "easy", title: "settings.dark", words: "mode nuit sombre dark" },
  { fold: "easy", title: "settings.sound", words: "son sons" },
  { fold: "auto", title: "tell.title", words: "prevenir notification mail sms reseaux recu envoye alerte" },
  { fold: "easy", title: "unsent.title", words: "rappel non envoye en retard relance message pas parti" },
  { fold: "cloud", title: "net.title", words: "internet reseau en ligne wifi idee voix copie" },
  { fold: "album", title: "album.title", words: "photo photos memoire album galerie image" },
  { fold: "stick", title: "stick.on", words: "stickers animations neige coeurs etoiles taille pays" },
  { fold: "shapes", title: "shape.title", words: "forme bouton coeur etoile fleur" },
  { fold: "voice", title: "settings.voice", words: "voix langue haut-parleur traduire" },
  { fold: "ia", title: "tone.title", words: "ia ton signature chaleureux poetique" },
  { fold: "plan", title: "plan.pro", words: "mode magique pro prix 1,99 envoi automatique" },
  { fold: "early", title: "settings.group.early", words: "avant-premiere nouveautes exclusif vip pro" },
  { fold: "docs", title: "docs.fold", words: "pdf document gmail outlook yahoo imap smtp mail automatisation" },
  { fold: "privacy", title: "settings.group.privacy", words: "vie privee discret photos videos voix confidentialite politique conditions effacer compte" },
  { fold: "security", title: "settings.group.security", words: "code pin verrouillage empreinte digitale securite sauvegarde branchement internet whatsapp mail play" },
  { fold: "share", title: "settings.group.share", words: "partage don capture acces lien direct messages ecrire favoris" },
  { fold: "donate", title: "donate.helpTitle", words: "don paypal lydia crypto bitcoin ethereum facturation play billing" },
  { fold: "updates", title: "update.section", words: "mise a jour play store version pro bug signalement probleme" },
];

const FORMS: { id: WriteForm; title: MessageKey; words: string }[] = [
  { id: "sms", title: "idea.form.sms", words: "message texto" },
  { id: "lettre", title: "idea.form.lettre", words: "lettre" },
  { id: "proverbe", title: "idea.form.proverbe", words: "proverbe citation" },
  { id: "poeme", title: "idea.form.poeme", words: "poeme poesie" },
  { id: "voeux", title: "idea.form.voeux", words: "voeux souhait" },
];

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const t = useT();
  const box = useRef<HTMLInputElement>(null);
  const label = placeholder ?? t("search.placeholder");
  return (
    <div className="relative">
      <input
        ref={box}
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={`${fieldClass} pr-12`}
      />
      <button
        type="button"
        className="search-loupe absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-xl text-ink"
        aria-label={t("search.loupe")}
        onClick={() => box.current?.focus()}
      >
        <Search className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function HomeSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT();
  const contacts = useBonMoment((state) => state.contacts);
  const templates = useBonMoment((state) => state.templates);
  const schedules = useBonMoment((state) => state.schedules);
  const fests = useBonMoment((state) => state.fests ?? []);
  const beginNew = useBonMoment((state) => state.beginNew);
  const addContact = useBonMoment((state) => state.addContact);
  const updateContact = useBonMoment((state) => state.updateContact);
  const beginEdit = useBonMoment((state) => state.beginEdit);
  const setTab = useBonMoment((state) => state.setTab);
  const needle = value.trim();
  const open = needle.length > 0;
  const phone = usePhoneHits(needle);
  const role = relationOf(needle);

  const people = contacts.filter((person) => contactMatches(person, needle)).slice(0, 6);
  const known = new Set(contacts.map((person) => person.name.trim().toLocaleLowerCase()));
  const directory = phone.hits.filter((person) => !known.has(person.name.trim().toLocaleLowerCase())).slice(0, 6);
  const markable = role ? contacts.filter((person) => person.relation !== role).slice(0, 6) : [];
  const settings = SETTINGS.filter((item) => matchesQuery(needle, [t(item.title), item.words])).slice(0, 4);
  const occasions = OCCASIONS.filter((item) => matchesQuery(needle, [occasionLabel(item.id), item.id])).slice(0, 4);
  const mine = fests.filter((item) => matchesQuery(needle, [item.title, item.name, item.mood])).slice(0, 4);
  const forms = FORMS.filter((item) => matchesQuery(needle, [t(item.title), item.words])).slice(0, 3);
  const models = templates.filter((item) => matchesQuery(needle, [item.title, item.body, occasionLabel(item.occasion)])).slice(0, 3);
  const letters = schedules
    .filter((item) => matchesQuery(needle, [item.body, occasionLabel(item.occasion)]))
    .slice(0, 3);
  const actions = (
    [
      { key: "nav.write" as MessageKey, go: () => beginNew() },
      { key: "calendar.open" as MessageKey, go: () => setTab("calendrier") },
      { key: "nav.people" as MessageKey, go: () => setTab("proches") },
      { key: "nav.journal" as MessageKey, go: () => setTab("journal") },
      { key: "nav.settings" as MessageKey, go: () => setTab("reglages") },
    ] as const
  ).filter((item) => matchesQuery(needle, [t(item.key)]));

  const empty =
    people.length + directory.length + markable.length + settings.length + occasions.length + mine.length + forms.length + models.length + letters.length + actions.length === 0;

  function choose(go: () => void) {
    onChange("");
    go();
  }

  return (
    <div className="relative">
      <SearchBar value={value} onChange={onChange} />
      {open ? (
        <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-surface shadow-lift">
          {phone.loading ? <p className="px-3 py-3 text-sm text-muted">{t("load.wait")}</p> : null}
          {empty && !phone.loading ? (
            <div className="px-3 py-3">
              <p className="text-sm text-muted">{t("search.none")}</p>
              {phoneBookReady() ? null : <PhoneBookAsk />}
            </div>
          ) : null}
          {people.length > 0 ? (
            <Group title={t("search.contacts")}>
              {people.map((person) => (
                <Row
                  key={person.id}
                  label={person.name}
                  hint={t("nav.write")}
                  onPick={() => choose(() => beginNew({ contactId: person.id }))}
                />
              ))}
            </Group>
          ) : null}
          {directory.length > 0 ? (
            <Group title={t("search.phone")}>
              {directory.map((person) => (
                <Row
                  key={`${person.name}-${person.phone}`}
                  label={person.name}
                  hint={person.nickname || person.phone || t("search.phone")}
                  onPick={() =>
                    choose(() => {
                      const link = phoneLink(person, needle);
                      const id = addContact({
                        name: person.name,
                        phone: person.phone,
                        email: person.email,
                        ...link,
                      });
                      beginNew({ contactId: id });
                    })
                  }
                />
              ))}
            </Group>
          ) : null}
          {markable.length > 0 && people.length === 0 ? (
            <div>
              <KinshipMarks
                query={needle}
                onMark={(id, next) => {
                  const person = contacts.find((item) => item.id === id);
                  updateContact(id, { relation: next, ...(person?.nickname?.trim() ? {} : { nickname: needle }) });
                  choose(() => beginNew({ contactId: id }));
                }}
              />
              {directory.length === 0 && !phoneBookReady() && !phone.loading ? (
                <div className="px-3 pb-3">
                  <PhoneBookAsk />
                </div>
              ) : null}
            </div>
          ) : null}
          {settings.length > 0 ? (
            <Group title={t("search.settings")}>
              {settings.map((item) => (
                <Row
                  key={item.title}
                  label={t(item.title)}
                  hint={t("nav.settings")}
                  onPick={() =>
                    choose(() => {
                      jumpTo(item.fold);
                      setTab("reglages");
                    })
                  }
                />
              ))}
            </Group>
          ) : null}
          {occasions.length + mine.length + forms.length + models.length + letters.length > 0 ? (
            <Group title={t("search.messages")}>
              {mine.map((item) => (
                <Row
                  key={item.id}
                  label={`${item.emoji} ${item.title}`}
                  hint={t("nav.write")}
                  onPick={() => choose(() => beginNew({ occasion: "autre", festId: item.id, body: item.line }))}
                />
              ))}
              {occasions.map((item) => (
                <Row
                  key={item.id}
                  label={`${item.emoji} ${occasionLabel(item.id)}`}
                  hint={t("nav.write")}
                  onPick={() => choose(() => beginNew({ occasion: item.id }))}
                />
              ))}
              {forms.map((item) => (
                <Row
                  key={item.id}
                  label={t(item.title)}
                  hint={t("nav.write")}
                  onPick={() =>
                    choose(() => {
                      stageForm(item.id);
                      beginNew();
                    })
                  }
                />
              ))}
              {models.map((item) => (
                <Row
                  key={item.id}
                  label={item.title}
                  hint={occasionLabel(item.occasion)}
                  onPick={() => choose(() => beginNew({ occasion: item.occasion, templateId: item.id, body: item.body }))}
                />
              ))}
              {letters.map((item) => (
                <Row
                  key={item.id}
                  label={occasionLabel(item.occasion)}
                  hint={item.body.replace(/\s+/g, " ").slice(0, 42)}
                  onPick={() => choose(() => beginEdit(item.id))}
                />
              ))}
            </Group>
          ) : null}
          {actions.length > 0 ? (
            <Group title={t("search.actions")}>
              {actions.map((item) => (
                <Row key={item.key} label={t(item.key)} onPick={() => choose(item.go)} />
              ))}
            </Group>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function KinshipMarks({ query, onMark }: { query: string; onMark: (id: string, role: Relation) => void }) {
  const t = useT();
  const contacts = useBonMoment((state) => state.contacts);
  const role = relationOf(query);
  if (!role) return null;
  const pending = contacts.filter((person) => person.relation !== role).slice(0, 6);
  if (pending.length === 0) return null;
  const label = t(`relation.${role}` as MessageKey);
  return (
    <section className="border-t border-line first:border-t-0">
      <p className="px-3 pt-2 text-xs font-medium tracking-wide text-brass uppercase">{t("search.mark", { role: label })}</p>
      <div className="py-1">
        {pending.map((person) => (
          <button
            key={person.id}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onMark(person.id, role)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
          >
            <span className="min-w-0 truncate text-sm font-medium text-ink">{person.name}</span>
            <span className="shrink-0 text-xs text-muted">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line first:border-t-0">
      <p className="px-3 pt-2 text-xs font-medium tracking-wide text-brass uppercase">{title}</p>
      <div className="py-1">{children}</div>
    </section>
  );
}

function Row({ label, hint, onPick }: { label: string; hint?: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
    >
      <span className="min-w-0 truncate text-sm font-medium text-ink">{label}</span>
      {hint ? <span className="shrink-0 text-xs text-muted">{hint}</span> : null}
    </button>
  );
}

export function useOpenFold(id: string) {
  const tick = useJumpTick();
  const ref = useRef<HTMLDivElement>(null);
  const wanted = id.length > 0 && peekFold() === id;
  useEffect(() => {
    if (!wanted) return;
    const timer = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
    return () => window.clearTimeout(timer);
  }, [tick, wanted]);
  return { ref, tick, wanted };
}
