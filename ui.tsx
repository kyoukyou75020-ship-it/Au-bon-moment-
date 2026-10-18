import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { finishMessage } from "@/lib/bonmoment/message";
import { useT } from "@/lib/bonmoment/use-i18n";

type Variant = "primary" | "quiet" | "ghost";

export function Button({
  variant = "quiet",
  kind,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; kind?: "action" | "amour" | "valider" }) {
  return (
    <button
      type={type}
      className={cn(
        "btn relative inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "btn-primary bg-wax text-onwax hover:brightness-110",
        variant === "quiet" && "border border-line bg-surface text-ink hover:border-ink",
        variant === "ghost" && "bg-transparent px-3 text-ink hover:bg-surface",
        kind === "amour" && "btn-love",
        className,
      )}
      {...props}
    />
  );
}

export const fieldClass =
  "h-11 w-full min-w-0 rounded-2xl border border-line bg-surface px-3 text-base text-ink outline-none transition-colors duration-150 focus:border-wax";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="hint text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function RemovePhotoButton({ onRemove }: { onRemove: () => void }) {
  const t = useT();
  return (
    <Button variant="quiet" onClick={onRemove}>
      <Trash2 className="size-4" aria-hidden />
      {t("photo.remove")}
    </Button>
  );
}

export function Seal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-brass bg-wax font-serif text-lg leading-none text-onwax",
        className,
      )}
      aria-hidden
    >
      B
    </span>
  );
}

export function Letter({
  name,
  body,
  image,
  onRemoveImage,
  extra,
  footer,
  signature = "",
}: {
  name: string;
  body: string;
  image?: string;
  onRemoveImage?: () => void;
  extra?: ReactNode;
  footer?: string;
  signature?: string;
}) {
  const t = useT();
  const rendered = body.trim() ? finishMessage(body, name, signature) : "";
  return (
    <article className="letter-sheen rounded-3xl border border-line bg-surface px-5 py-6 shadow-lift">
      <Seal className="mb-5" />
      {image ? (
        <>
          <img src={image} alt="" className="mb-3 max-h-64 w-full rounded-2xl object-cover" />
          {onRemoveImage ? (
            <div className="mb-3">
              <RemovePhotoButton onRemove={onRemoveImage} />
            </div>
          ) : null}
          <p className="mb-4 text-sm text-muted">{t("photo.hint")}</p>
        </>
      ) : null}
      {extra}
      {rendered ? (
        <p className="[overflow-wrap:anywhere] whitespace-pre-wrap text-base leading-relaxed text-ink">{rendered}</p>
      ) : (
        <p className="text-base leading-relaxed text-muted">{t("composer.letterEmpty")}</p>
      )}
      {footer ? <p className="mt-6 border-t border-line pt-4 text-sm text-muted">{footer}</p> : null}
    </article>
  );
}

export function Chip({
  active,
  className,
  type = "button",
  onMouseDown,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={active}
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown?.(event);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
        const focused = document.activeElement;
        if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) focused.blur();
      }}
      className={cn(
        "btn relative inline-flex h-11 touch-manipulation items-center gap-2 rounded-full border px-3 text-sm",
        active ? "border-wax bg-wax text-onwax" : "border-line bg-surface text-ink hover:border-ink",
        className,
      )}
      {...props}
    />
  );
}
