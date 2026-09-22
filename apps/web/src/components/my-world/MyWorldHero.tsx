"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";
import { Link } from "@/i18n/routing";
import { AvatarCard } from "./AvatarCard";
import { usePrefersReducedMotion } from "./motion";
import { XpProgress } from "./XpProgress";
import type { EmployeeGamification, XpProgress as XpModel } from "./types";

interface MyWorldHeroProps {
  profile: EmployeeGamification["profile"];
  xp: XpModel;
  gain: number | null;
  hasOpenMission: boolean;
}

export function MyWorldHero({ profile, xp, gain, hasOpenMission }: MyWorldHeroProps) {
  const t = useTranslations("myWorld");
  const reduced = usePrefersReducedMotion();
  const meta = [profile.title, profile.departmentName].filter(Boolean).join(" · ");

  const onNext = (event: MouseEvent<HTMLAnchorElement>) => {
    const section = document.getElementById("missions");
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    section.querySelector<HTMLElement>("button, a")?.focus();
  };

  const actionClass =
    "mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand hover:underline";

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-md motion-safe:animate-fade-up sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--brand-blue-soft),transparent_58%)]"
      />
      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-7 sm:text-start">
        <AvatarCard level={xp.level} current={xp.current} next={xp.next} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-[1.75rem]">
            {t("greeting", { name: profile.firstName })}
            <span aria-hidden="true"> 👋</span>
          </h1>
          {meta ? <p className="mt-1 text-sm text-content-muted">{meta}</p> : null}
          <p className="mt-3 text-lg font-bold text-content">
            {t("levelLabel")} <span className="numeric">{xp.level}</span>
          </p>
          <p className="text-sm text-content-muted">{t(`journeyLine.${xp.tier}`)}</p>
          <XpProgress xp={xp} gain={gain} />
          {hasOpenMission ? (
            <a href="#missions" onClick={onNext} className={actionClass}>
              {t("nextMission")}
              <ArrowLeft aria-hidden="true" className="size-4 ltr:rotate-180" />
            </a>
          ) : (
            <Link href="/" className={actionClass}>
              {t("explore")}
              <ArrowLeft aria-hidden="true" className="size-4 ltr:rotate-180" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
