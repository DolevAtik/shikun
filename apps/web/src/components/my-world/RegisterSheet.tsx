"use client";

import type { EmployeeProgress, Mission } from "@moch/contracts";
import { Button } from "@moch/ui";
import { CalendarDays, MapPin, MonitorSmartphone, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { xpText } from "./progress";
import { Sheet } from "./Sheet";

interface RegisterSheetProps {
  mission: Mission | null;
  onClose: () => void;
  /** Called with the progress the API computed after the registration. */
  onRegistered: (progress: EmployeeProgress, mission: Mission) => void;
}

/** A real registration: POST /me/registrations, then the new progress comes back. */
export function RegisterSheet({ mission, onClose, onRegistered }: RegisterSheetProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setPending(false);
  }, [mission?.id]);

  const submit = async () => {
    if (!mission) return;
    setPending(true);
    setError(null);
    try {
      const progress = await clientFetch<EmployeeProgress>("/me/registrations", {
        method: "POST",
        body: JSON.stringify({ contentItemId: mission.contentItemId }),
      });
      onRegistered(progress, mission);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  };

  const isTraining = mission?.act === "training";
  const place =
    mission?.place == null
      ? null
      : mission.place === "ONLINE"
        ? t("register.online")
        : isTraining
          ? t(`trainingFormat.${mission.place}` as never)
          : mission.place;

  return (
    <Sheet open={mission !== null} title={mission ? mission.title : t("register.title")} onClose={onClose}>
      {mission ? (
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2.5 text-sm">
            {mission.startsAt ? (
              <Row icon={CalendarDays} label={t("register.when")} value={formatDateTime(mission.startsAt, locale)} />
            ) : null}
            {place ? (
              <Row
                icon={isTraining || mission.place === "ONLINE" ? MonitorSmartphone : MapPin}
                label={isTraining ? t("register.format") : t("register.where")}
                value={place}
              />
            ) : null}
            {mission.seatsLeft !== null ? (
              <Row icon={Users} label={t("register.seatsLabel")} value={t("register.seats", { count: mission.seatsLeft })} />
            ) : null}
          </dl>

          <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-sm font-medium text-brand">
            {t("register.reward", { xp: xpText(mission.xp, locale), world: t(`worlds.${mission.world}.name`) })}
          </p>
          <p className="text-xs text-content-muted">{t("register.cancelNote")}</p>

          {error ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {t("register.error", { message: error })}
            </p>
          ) : null}

          <Button type="button" size="lg" onClick={submit} isLoading={pending} className="w-full">
            {pending ? t("register.registering") : error ? t("register.retry") : t("register.confirm")}
          </Button>
          <p className="sr-only" aria-live="polite">
            {pending ? t("register.registering") : ""}
          </p>
        </div>
      ) : null}
    </Sheet>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-content-muted" />
      <dt className="sr-only">{label}</dt>
      <dd className="text-content">{value}</dd>
    </div>
  );
}
