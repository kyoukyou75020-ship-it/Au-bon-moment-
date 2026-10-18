import { Heart } from "lucide-react";
import { openOutside } from "@/lib/bonmoment/message";
import { useBonMoment } from "@/lib/bonmoment/store";
import { playTick } from "@/lib/bonmoment/sound";
import { useT } from "@/lib/bonmoment/use-i18n";
import { shopLink } from "./share";
import { Button } from "./ui";

export const PAYPAL_CREATE = "https://www.paypal.com/paypalme/";

export function paypalLink(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const named = trimmed.replace(/^@/, "");
  if (/^[A-Za-z0-9._-]{2,50}$/.test(named)) return `https://www.paypal.me/${named}`;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const link = shopLink(withProtocol);
  if (!link) return "";
  const host = new URL(link).hostname;
  if (host !== "paypal.me" && host !== "www.paypal.me" && host !== "paypal.com" && host !== "www.paypal.com") return "";
  return link;
}

export function giftLink(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return shopLink(withProtocol);
}

export function paypalGift(value: string | undefined, euros?: number): string {
  const base = paypalLink(value);
  if (!base) return "";
  if (!euros || euros <= 0) return base;
  const url = new URL(base);
  if (url.hostname !== "paypal.me" && url.hostname !== "www.paypal.me") return base;
  const name = url.pathname.split("/").filter(Boolean)[0];
  if (!name) return base;
  url.pathname = `/${name}/${euros}EUR`;
  return url.toString();
}

export function DonateButton() {
  const t = useT();
  const donateUrl = useBonMoment((state) => state.settings.donateUrl);
  const setTab = useBonMoment((state) => state.setTab);
  const link = paypalLink(donateUrl);

  function give() {
    playTick();
    if (!link) {
      setTab("reglages");
      return;
    }
    openOutside(link);
  }

  return (
    <Button variant="quiet" kind="amour" onClick={give}>
      <Heart className="size-4" aria-hidden />
      {t("donate.button")}
    </Button>
  );
}
