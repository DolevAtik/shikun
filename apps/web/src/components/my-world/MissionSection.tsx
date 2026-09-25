"use client";

import type { Mission } from "@moch/contracts";
import { SectionHeader } from "@moch/ui";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MissionCard } from "./MissionCard";
import { NextMission } from "./NextMission";
import { xpText } from "./progress";

export interface RegisteredNotice {
  title: string;
  xp: number;
  world: Mission["world"];
}

interface MissionSectionProps {
  missions: Mission[];
  notice: RegisteredNotice | null;
  onRegister: (mission: Mission) => void;
}

export function MissionSection({ missions, notice, onRegister }: MissionSectionProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const [next, ...rest] = missions;

  return (
    <section id="missions" className="scroll-mt-20">
      <SectionHeader title={t("missions.title")} titleClassName="text-lg" />
      <div role="status" aria-live="polite">
        {notice ? (
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-success-soft px-4 py-3 text-sm font-semibold text-success">
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
            <span className="flex-1">{t("missions.registeredNotice", { title: notice.title, xp: xpText(notice.xp, locale, true) })}</span>
            <Link href={`/my-world/${notice.world}`} className="inline-flex min-h-11 items-center gap-1 underline-offset-4 hover:underline">
              {t("missions.viewInWorld", { world: t(`worlds.${notice.world}.name`) })}
              <ArrowLeft aria-hidden="true" className="size-4 ltr:rotate-180" />
            </Link>
          </p>
        ) : null}
      </div>
      {next ? (
        <div className="flex flex-col gap-4">
          <NextMission mission={next} onRegister={onRegister} />
          {rest.length > 0 ? (
            <div>
              <h3 className="mb-2 px-1 text-sm font-semibold text-content-muted">{t("missions.more")}</h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {rest.map((mission) => (
                  <li key={mission.id}>
                    <MissionCard mission={mission} onRegister={onRegister} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-sm">
          <span aria-hidden="true" className="mb-1 grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
            <Sparkles className="size-5" />
          </span>
          <p className="text-lg font-semibold text-content">{t("missions.emptyTitle")}</p>
          <p className="max-w-sm text-sm text-content-muted">{t("missions.emptyBody")}</p>
          <Link
            href="/feed"
            className="mt-3 inline-flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-content-onbrand shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:shadow-focus"
          >
            {t("missions.emptyCta")}
          </Link>
        </div>
      )}
    </section>
  );
}
