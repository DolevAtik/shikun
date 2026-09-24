"use client";

import { IllustratedAvatar } from "@moch/ui";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { AvatarCard } from "./AvatarCard";
import { FirstWeek } from "./FirstWeek";
import { Numeric } from "./Numeric";
import { WeeklyCard } from "./WeeklyCard";
import { XpProgress } from "./XpProgress";
import type { EmployeeGamification, Unlock, WeeklyCard as WeeklyCardModel, WorldChange, XpProgress as XpModel } from "./types";

interface MyWorldHeroProps {
  profile: EmployeeGamification["profile"];
  xp: XpModel;
  gain: number | null;
  nextUnlock: Unlock | null;
  change: WorldChange | null;
  weekly: WeeklyCardModel | null;
  firstWeek: boolean;
  readDone: boolean;
  nextAvatarLevel: number | null;
}

export function MyWorldHero({
  profile,
  xp,
  gain,
  nextUnlock,
  change,
  weekly,
  firstWeek,
  readDone,
  nextAvatarLevel,
}: MyWorldHeroProps) {
  const t = useTranslations("myWorld");
  const meta = [profile.title, profile.departmentName].filter(Boolean).join(" · ");

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-surface px-5 py-7 shadow-lg motion-safe:animate-fade-up sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--sky-glow),transparent_58%)]"
      />
      <div className="relative grid grid-cols-1 justify-items-center gap-4 text-center md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:justify-items-stretch md:gap-x-8 md:text-start">
        <div className="md:col-start-2 md:row-start-1 md:self-end">
          {change ? <p className="mb-2 text-sm font-semibold text-brand">{t(`change.${change}`)}</p> : null}
          <h1 className="text-3xl font-bold tracking-tight text-content">
            {t("greeting", { name: profile.firstName })}
            <span aria-hidden="true"> 👋</span>
          </h1>
          {meta ? <p className="mt-1 text-sm text-content-muted">{meta}</p> : null}
        </div>

        <div className="relative md:col-start-1 md:row-span-2 md:row-start-1 md:justify-self-center">
          <AvatarCard level={xp.level} current={xp.current} next={xp.next} levelLabel={t("levelLabel")} />
          {nextAvatarLevel !== null ? (
            <span className="absolute bottom-1 start-0 size-14 overflow-hidden rounded-full opacity-70 ring-2 ring-line">
              <IllustratedAvatar level={nextAvatarLevel} />
              <span className="sr-only">{t("previewLabel")}</span>
            </span>
          ) : null}
        </div>

        <div className="w-full max-w-md md:col-start-2 md:row-start-2 md:max-w-none md:self-start">
          <p className="text-sm font-bold tracking-wide text-brand">
            {t("levelLabel")} <Numeric className="text-xl">{xp.level}</Numeric>
          </p>
          <p className="text-sm text-content-muted">{t(`journeyLine.${xp.tier}`)}</p>
          {firstWeek ? <FirstWeek readDone={readDone} /> : weekly ? <WeeklyCard card={weekly} /> : null}
          <XpProgress xp={xp} gain={gain} />
          {nextUnlock ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-sm text-content shadow-sm">
              <Lock aria-hidden="true" className="size-3.5 shrink-0 text-content-muted" />
              <span>
                {t("levelLabel")} <Numeric>{nextUnlock.level}</Numeric>
                <span aria-hidden="true">: </span>
                {nextUnlock.title}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
