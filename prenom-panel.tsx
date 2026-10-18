import { useState } from "react";
import { NAME_MONTHS, findNameDays } from "@/lib/bonmoment/prenoms";
import { firstName } from "@/lib/bonmoment/message";
import { useBonMoment } from "@/lib/bonmoment/store";
import { nextDateInput } from "@/lib/bonmoment/time";
import { useT } from "@/lib/bonmoment/use-i18n";
import { playTick } from "@/lib/bonmoment/sound";

const LINE = "Bonne fête {prenom}. Aujourd'hui, on fête ton prénom. Je pense à toi.";

export function PrenomPanel() {
  const t = useT();
  const draft = useBonMoment((state) => state.draft);
  const contacts = useBonMoment((state) => state.contacts);
  const templates = useBonMoment((state) => state.templates);
  const setDraft = useBonMoment((state) => state.setDraft);
  const person = contacts.find((item) => item.id === draft.contactId);
  const [query, setQuery] = useState(() => (person ? firstName(person.name) : ""));
  const hits = findNameDays(query);

  return (
    <details className="rounded-3xl border border-line bg-surface px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-ink">{t("prenom.title")}</summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm text-muted">{t("prenom.hint")}</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 rounded-2xl border border-line bg-paper px-3 text-ink"
          autoComplete="off"
          aria-label={t("prenom.title")}
        />
        {query.trim().length >= 2 && hits.length === 0 ? <p className="text-sm text-muted">{t("prenom.empty")}</p> : null}
        <ul className="flex flex-col gap-2">
          {hits.map((hit) => (
            <li key={`${hit.name}-${hit.month}-${hit.day}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-3 py-2 text-left"
                onClick={() => {
                  playTick();
                  const ready = templates.find((item) => item.occasion === "prenom");
                  const currentIsTemplate = templates.some((item) => item.body === draft.body);
                  const fill = !draft.body.trim() || currentIsTemplate;
                  setDraft({
                    ...draft,
                    occasion: "prenom",
                    repeat: "yearly",
                    date: nextDateInput(hit.month, hit.day),
                    ...(fill ? { templateId: ready?.id ?? null, body: ready?.body ?? LINE } : {}),
                  });
                }}
              >
                <span className="font-medium text-ink">{hit.name}</span>
                <span className="text-sm text-muted">
                  {hit.day} {NAME_MONTHS[hit.month - 1]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
