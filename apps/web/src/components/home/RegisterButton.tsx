"use client";

import { type Mission, XP_PER_ACT } from "@moch/contracts";
import { Button } from "@moch/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RegisterSheet } from "@/components/my-world/RegisterSheet";
import { useRouter } from "@/i18n/routing";

interface RegisterButtonProps {
  act: "event" | "training";
  contentItemId: string;
  title: string;
  startsAt: string;
  /** An event's location or "ONLINE"; a training's format. */
  place: string | null;
  seatsLeft: number | null;
}

/**
 * The same registration My World uses, opened from Home. After it lands, Home
 * re-renders from the server so the card shows "registered" from the source.
 */
export function RegisterButton({ act, contentItemId, title, startsAt, place, seatsLeft }: RegisterButtonProps) {
  const t = useTranslations("home");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const mission: Mission = {
    id: `${act}:${contentItemId}`,
    act,
    world: act === "training" ? "develop" : "participate",
    contentItemId,
    title,
    xp: XP_PER_ACT[act],
    minutes: null,
    startsAt,
    place,
    seatsLeft,
  };

  return (
    <>
      <Button type="button" variant="secondary" size="md" onClick={() => setOpen(true)} disabled={seatsLeft === 0}>
        {t("register")}
      </Button>
      <RegisterSheet
        mission={open ? mission : null}
        onClose={() => setOpen(false)}
        onRegistered={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
