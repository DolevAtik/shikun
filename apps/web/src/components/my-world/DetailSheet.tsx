"use client";

import type { EmployeeProgress } from "@moch/contracts";
import { Button, cn, IllustratedAvatar, ProgressBar } from "@moch/ui";
import { ArrowLeft, BookOpen, CalendarDays, Check, GraduationCap, Lock, X as NotIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { AchievementIcon } from "./AchievementCard";
import { Numeric } from "./Numeric";
import { AVATAR_STAGES, formatXp, remainingFor, xpText } from "./progress";
import { Sheet } from "./Sheet";
import type { Detail } from "./types";
import { WORLD_COLOR } from "./world-tone";

interface DetailSheetProps {
  detail: Detail | null;
  progress: EmployeeProgress;
  onClose: () => void;
}

/** Every "tell me more" on the screen. None of them is decorative: each answers what, how far, and how. */
export function DetailSheet({ detail, progress, onClose }: DetailSheetProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const open = detail !== null && detail.kind !== "register";

  let title = "";
  let body: ReactNode = null;

  if (detail?.kind === "avatar") {
    title = t("avatar.title");
    body = <AvatarBody progress={progress} />;
  } else if (detail?.kind === "rules") {
    title = t("rules.title");
    body = <RulesBody progress={progress} />;
  } else if (detail?.kind === "achievement") {
    const achievement = progress.achievements.find((item) => item.id === detail.id);
    if (achievement) {
      title = t(`achievements.items.${achievement.id}.title`);
      body = <AchievementBody achievement={achievement} onNavigate={onClose} />;
    }
  } else if (detail?.kind === "unlock") {
    const unlock = progress.unlocks.find((item) => item.id === detail.id);
    if (unlock) {
      title = t(`unlocks.items.${unlock.id}.title`);
      body = <UnlockBody unlock={unlock} total={progress.level.total} />;
    }
  } else if (detail?.kind === "recognition") {
    const recognition = progress.recognitions.find((item) => item.id === detail.id);
    if (recognition) {
      title = locale === "en" ? recognition.badgeNameEn : recognition.badgeNameHe;
      body = <RecognitionBody recognition={recognition} />;
    }
  } else if (detail?.kind === "department" && progress.department) {
    title = t("department.title");
    body = <DepartmentBody department={progress.department} />;
  }

  return (
    <Sheet open={open && body !== null} title={title} onClose={onClose}>
      {body}
      <Button type="button" variant="secondary" className="mt-6 w-full" onClick={onClose}>
        {t("close")}
      </Button>
    </Sheet>
  );
}

function AvatarBody({ progress }: { progress: EmployeeProgress }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const level = progress.level.level;
  const unlockAt = new Map(progress.unlocks.map((unlock) => [unlock.level, unlock]));

  return (
    <div>
      <p className="text-sm text-content-muted">{t("avatar.body")}</p>
      <ol className="mt-4 grid grid-cols-2 gap-3">
        {AVATAR_STAGES.map((stage) => {
          const reached = level >= stage;
          const unlock = unlockAt.get(stage);
          const current = reached && AVATAR_STAGES.filter((item) => item <= level).at(-1) === stage;
          return (
            <li
              key={stage}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-3 text-center",
                current ? "border-brand bg-brand-soft" : "border-line",
              )}
            >
              <span className={cn("size-20 overflow-hidden rounded-full ring-2 ring-line", !reached && "opacity-45 grayscale")}>
                <IllustratedAvatar level={stage} />
              </span>
              <span className="text-sm font-semibold text-content">
                {stage === 1 ? t("avatar.stageBase") : t("avatar.stageLevel", { level: stage })}
              </span>
              {unlock ? <span className="text-xs text-content-muted">{t(`unlocks.items.${unlock.id}.title`)}</span> : null}
              <span className={cn("text-xs font-medium", reached ? "text-success" : "text-content-muted")}>
                {current ? (
                  t("avatar.current")
                ) : reached ? (
                  t("avatar.reached")
                ) : (
                  t("avatar.locked", { xp: xpText(Math.max(0, (unlock?.xpAt ?? 0) - progress.level.total), locale) })
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RulesBody({ progress }: { progress: EmployeeProgress }) {
  const t = useTranslations("myWorld");
  const icons = { read: BookOpen, training: GraduationCap, event: CalendarDays } as const;

  return (
    <div className="flex flex-col gap-5 text-sm">
      <section>
        <h3 className="mb-2 font-semibold text-content">{t("rules.earns")}</h3>
        <ul className="flex flex-col gap-2">
          {progress.rules.map((rule) => {
            const Icon = icons[rule.act];
            return (
              <li key={rule.act} className="flex items-center gap-3 rounded-lg bg-surface-tint px-3 py-2.5">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-brand" />
                <span className="flex-1 text-content">{t(`rules.${rule.act}`)}</span>
                <Numeric className="font-bold text-brand">+{rule.xp} XP</Numeric>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h3 className="mb-1 font-semibold text-content">{t("rules.notEarns")}</h3>
        <p className="flex items-start gap-2 text-content-muted">
          <NotIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t("rules.notList")}
        </p>
      </section>
      <section>
        <h3 className="mb-1 font-semibold text-content">{t("rules.why")}</h3>
        <p className="text-content-muted">{t("rules.whyBody")}</p>
        <p className="mt-2 text-content-muted">{t("rules.recognition")}</p>
      </section>
    </div>
  );
}

function AchievementBody({
  achievement,
  onNavigate,
}: {
  achievement: EmployeeProgress["achievements"][number];
  onNavigate: () => void;
}) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const unlocked = achievement.unlockedAt !== null;
  const remaining = remainingFor(achievement);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AchievementIcon id={achievement.id} unlocked={unlocked} size="lg" />
        <p className={cn("text-sm font-semibold", unlocked ? "text-success" : "text-content-muted")}>
          {unlocked ? t("achievements.unlockedOn", { date: formatDate(achievement.unlockedAt!, locale) }) : t("achievements.locked")}
        </p>
      </div>
      <section>
        <h3 className="mb-1 text-sm font-semibold text-content">{t("achievements.howTo")}</h3>
        <p className="text-sm text-content-muted">{t(`achievements.items.${achievement.id}.condition`)}</p>
      </section>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="text-content-muted">
            {unlocked
              ? t("achievements.unlocked")
              : achievement.id === "level5"
                ? t("achievements.remainingLevel", { count: remaining })
                : t("achievements.remaining", { count: remaining })}
          </span>
          <Numeric className="font-semibold text-content">
            {t("achievements.progress", { current: achievement.current, target: achievement.target })}
          </Numeric>
        </div>
        <ProgressBar
          label={t(`achievements.items.${achievement.id}.title`)}
          hideLabel
          hideValue
          value={achievement.current}
          max={achievement.target}
          valueText={t("achievements.progress", { current: achievement.current, target: achievement.target })}
        />
      </div>
      {achievement.world ? (
        <Link
          href={`/my-world/${achievement.world}`}
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold focus-visible:outline-none focus-visible:shadow-focus"
          style={{ color: WORLD_COLOR[achievement.world] }}
        >
          {t("achievements.relatedWorld", { world: t(`worlds.${achievement.world}.name`) })}
          <ArrowLeft aria-hidden="true" className="size-4 ltr:rotate-180" />
        </Link>
      ) : null}
    </div>
  );
}

function UnlockBody({ unlock, total }: { unlock: EmployeeProgress["unlocks"][number]; total: number }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const remaining = Math.max(0, unlock.xpAt - total);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className={cn("size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-line", !unlock.unlocked && "opacity-60")}>
          <IllustratedAvatar level={unlock.level} />
        </span>
        <div>
          <p className="text-sm font-semibold text-content">{t("unlocks.atLevel", { level: unlock.level })}</p>
          <p className="text-sm text-content-muted">{t(`unlocks.items.${unlock.id}.body`)}</p>
        </div>
      </div>
      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-content">{t("unlocks.howFar")}</h3>
        {unlock.unlocked ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
            <Check aria-hidden="true" className="size-4" />
            {t("unlocks.open")}
          </p>
        ) : (
          <>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-content-muted">{t("unlocks.remaining", { xp: xpText(remaining, locale) })}</span>
              <Numeric className="font-semibold text-content">
                {formatXp(total, locale)} / {formatXp(unlock.xpAt, locale)} XP
              </Numeric>
            </div>
            <ProgressBar
              label={t(`unlocks.items.${unlock.id}.title`)}
              hideLabel
              hideValue
              value={total}
              max={unlock.xpAt}
              valueText={`${formatXp(total, locale)} / ${formatXp(unlock.xpAt, locale)} XP`}
            />
            <p className="mt-3 text-sm text-content-muted">{t("unlocks.how")}</p>
          </>
        )}
      </section>
    </div>
  );
}

function RecognitionBody({ recognition }: { recognition: EmployeeProgress["recognitions"][number] }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <blockquote
        className="border-s-4 ps-4 text-base font-medium leading-relaxed text-content"
        style={{ borderColor: recognition.badgeColor }}
      >
        {recognition.reason}
      </blockquote>
      <p className="text-sm text-content-muted">
        {recognition.giverName ? t("recognition.from", { name: recognition.giverName }) : t("recognition.fromUnknown")}
        {recognition.giverTitle ? <> · {recognition.giverTitle}</> : null}
        <span aria-hidden="true"> · </span>
        {formatDate(recognition.awardedAt, locale)}
      </p>
      <p className="rounded-lg bg-surface-tint px-3 py-2.5 text-sm text-content-muted">{t("recognition.dialogNote")}</p>
    </div>
  );
}

function DepartmentBody({ department }: { department: NonNullable<EmployeeProgress["department"]> }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const name = locale === "en" ? department.nameEn : department.nameHe;
  const remaining = Math.max(0, department.target - department.earned);
  const perMember = department.members > 0 ? Math.round(department.target / department.members) : 0;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="font-semibold text-content">{name}</p>
        <p className="text-content-muted">
          {t("department.members", { count: department.members })} · {t("department.daysLeft", { count: department.daysLeft })}
        </p>
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-content-muted">
            {remaining === 0 ? (
              t("department.reached")
            ) : (
              t("department.remaining", { xp: xpText(remaining, locale) })
            )}
          </span>
          <Numeric className="font-semibold text-content">
            {t("department.ratio", { earned: formatXp(department.earned, locale), target: formatXp(department.target, locale) })}
          </Numeric>
        </div>
        <ProgressBar
          label={name}
          hideLabel
          hideValue
          value={department.earned}
          max={department.target}
          valueText={t("department.ratio", { earned: department.earned, target: department.target })}
        />
        <p className="mt-2 text-content-muted">{t("department.target", { xp: xpText(perMember, locale) })}</p>
      </div>
      <section>
        <h3 className="mb-2 font-semibold text-content">{t("department.breakdown")}</h3>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {(["reads", "trainings", "events"] as const).map((key) => (
            <div key={key} className="rounded-lg bg-surface-tint px-2 py-3">
              <dd className="text-lg font-bold text-content">
                <Numeric>{formatXp(department[key], locale)}</Numeric>
              </dd>
              <dt className="text-xs text-content-muted">{t(`department.${key}`)}</dt>
            </div>
          ))}
        </dl>
      </section>
      <p className="font-medium text-content">{t("department.mine", { xp: xpText(department.mine, locale) })}</p>
      <p className="inline-flex items-center gap-1.5 text-xs text-content-muted">
        <Lock aria-hidden="true" className="size-3.5" />
        {t("department.privacy")}
      </p>
    </div>
  );
}
