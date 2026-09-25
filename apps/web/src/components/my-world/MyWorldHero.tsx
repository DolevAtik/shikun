"use client";

import type { EmployeeProgress, Mission } from "@moch/contracts";
import { ChevronLeft, CircleHelp, Lock, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SkylineStrip } from "@/components/CityBackdrop";
import { AvatarProgress } from "./AvatarProgress";
import { tierForLevel, xpText } from "./progress";
import type { MyWorldProfile, OpenDetail } from "./types";
import { FirstSteps, WeeklyCard } from "./WeeklyCard";
import { XpProgress } from "./XpProgress";

interface MyWorldHeroProps {
  profile: MyWorldProfile;
  progress: EmployeeProgress;
  gain: number | null;
  sinceLastVisit: number | null;
  onOpen: OpenDetail;
  onRegister: (mission: Mission) => void;
}

/** Who I am, where I am, and what the next thing to open is. */
export function MyWorldHero({ profile, progress, gain, sinceLastVisit, onOpen, onRegister }: MyWorldHeroProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const { level } = progress;
  const nextUnlock = progress.unlocks.find((unlock) => !unlock.unlocked) ?? null;
  const near = progress.achievements.find((item) => item.unlockedAt === null && item.target - item.current === 1 && item.id !== "level5");
  const firstSteps = progress.stats.acts === 0;

  return (
    <section
      aria-labelledby="my-world-greeting"
      className="relative overflow-hidden rounded-xl border border-line bg-surface px-5 pt-7 shadow-lg motion-safe:animate-fade-up sm:px-8 sm:pt-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--sky-glow),transparent_58%)]"
      />
      <div className="relative z-10 grid grid-cols-1 justify-items-center gap-4 text-center md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:justify-items-stretch md:gap-x-8 md:text-start">
        <div className="md:col-start-2 md:row-start-1 md:self-end">
          {near ? (
            <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              <Sparkles aria-hidden="true" className="size-4" />
              {t("nearAchievement", { title: t(`achievements.items.${near.id}.title`) })}
            </p>
          ) : null}
          <h1 id="my-world-greeting" className="text-3xl font-bold tracking-tight text-content">
            {t("greeting", { name: profile.firstName })}
            <span aria-hidden="true"> 👋</span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-brand">
            {t("tierLine", { tier: t(`tier.${tierForLevel(level.level)}`), level: level.level })}
          </p>
          {profile.title ? <p className="text-sm text-content-muted">{profile.title}</p> : null}
        </div>

        <div className="md:col-start-1 md:row-span-2 md:row-start-1 md:justify-self-center">
          <AvatarProgress level={level.level} current={level.current} next={level.next} onOpen={() => onOpen({ kind: "avatar" })} />
        </div>

        <div className="w-full max-w-md md:col-start-2 md:row-start-2 md:max-w-none md:self-start">
          {firstSteps ? <FirstSteps progress={progress} onRegister={onRegister} onOpen={onOpen} /> : <WeeklyCard weekly={progress.weekly} />}
          <XpProgress level={level} gain={gain} />
          {sinceLastVisit ? <p className="mt-1 text-sm font-semibold text-success">{t("sinceLastVisit", { xp: xpText(sinceLastVisit, locale, true) })}</p> : null}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {nextUnlock ? (
              <button
                type="button"
                onClick={() => onOpen({ kind: "unlock", id: nextUnlock.id })}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface/90 px-3.5 text-sm text-content shadow-sm hover:bg-surface-tint focus-visible:outline-none focus-visible:shadow-focus"
              >
                <Lock aria-hidden="true" className="size-3.5 shrink-0 text-content-muted" />
                {t("nextUnlockChip", { level: nextUnlock.level, title: t(`unlocks.items.${nextUnlock.id}.title`) })}
                <ChevronLeft aria-hidden="true" className="size-4 text-content-muted ltr:rotate-180" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOpen({ kind: "rules" })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-brand hover:bg-brand-soft focus-visible:outline-none focus-visible:shadow-focus"
            >
              <CircleHelp aria-hidden="true" className="size-4" />
              {t("howXp")}
            </button>
          </div>
        </div>
      </div>
      <SkylineStrip className="mt-4 h-10" />
    </section>
  );
}
