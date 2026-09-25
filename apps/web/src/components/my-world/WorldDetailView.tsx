"use client";

import type { Mission, WorldActivity, WorldDetail } from "@moch/contracts";
import { Button, ProgressBar, SectionHeader } from "@moch/ui";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { clientFetch } from "@/lib/client-api";
import { formatDate, formatDateTime } from "@/lib/format";
import { WORLD_ICONS } from "./JourneyCard";
import { MissionCard } from "./MissionCard";
import { Numeric } from "./Numeric";
import { formatXp, milestoneProgress, ratioText, xpText } from "./progress";
import { RegisterSheet } from "./RegisterSheet";
import { WORLD_BAR, WORLD_COLOR, worldTint, worldWash } from "./world-tone";

const ACT_ICONS = { read: BookOpen, training: GraduationCap, event: CalendarDays } as const;

/** One world in full: what counts, what I did, and what is open right now. */
export function WorldDetailView({ detail }: { detail: WorldDetail }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const router = useRouter();
  const [registering, setRegistering] = useState<Mission | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { world } = detail;
  const Icon = WORLD_ICONS[world.id];
  const name = t(`worlds.${world.id}.name`);
  const band = milestoneProgress(world.acts, world.milestone);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/my-world"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-brand focus-visible:outline-none focus-visible:shadow-focus"
      >
        <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
        {t("world.back")}
      </Link>

      <header className="rounded-xl p-5 shadow-md sm:p-6" style={{ backgroundColor: worldWash(world.id) }}>
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl" style={worldTint(world.id)}>
            <Icon className="size-7" />
          </span>
          <div className="min-w-0">
            <p dir="ltr" className="text-xs font-bold tracking-[0.14em] rtl:text-end" style={{ color: WORLD_COLOR[world.id] }}>
              {t(`worlds.${world.id}.code`)}
            </p>
            <h1 className="text-2xl font-bold text-content">{name}</h1>
            <p className="mt-1 text-sm text-content-muted">{t(`worlds.${world.id}.description`)}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface/80 px-3 py-2.5">
            <dt className="text-xs text-content-muted">{t("world.xpInWorld")}</dt>
            <dd className="text-lg font-bold text-content">
              <Numeric>{formatXp(world.xp, locale)}</Numeric>
            </dd>
          </div>
          <div className="rounded-lg bg-surface/80 px-3 py-2.5">
            <dt className="text-xs text-content-muted">{t("world.acts")}</dt>
            <dd className="text-lg font-bold text-content">
              <Numeric>{formatXp(world.acts, locale)}</Numeric>
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <p className="mb-1.5 text-sm text-content">{t("journey.milestone", { ratio: ratioText(band.done, band.target, locale) })}</p>
          <ProgressBar
            label={name}
            hideLabel
            hideValue
            value={band.done}
            max={band.target}
            valueText={t("journey.milestone", { ratio: ratioText(band.done, band.target, locale) })}
            indicatorClassName={WORLD_BAR[world.id]}
          />
        </div>
        <section className="mt-5">
          <h2 className="text-sm font-semibold text-content">{t("world.whatCounts")}</h2>
          <p className="mt-1 text-sm text-content-muted">{t(`worlds.${world.id}.counts`)}</p>
        </section>
      </header>

      <section>
        <SectionHeader title={t("world.opportunities")} titleClassName="text-lg" />
        <div role="status" aria-live="polite">
          {notice ? (
            <p className="mb-3 flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm font-semibold text-success">
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
              {notice}
            </p>
          ) : null}
        </div>
        {detail.opportunities.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {detail.opportunities.map((mission) => (
              <li key={mission.id}>
                <MissionCard mission={mission} onRegister={setRegistering} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-sm">
            <p className="text-sm text-content-muted">{t("world.opportunitiesEmpty")}</p>
            <Link
              href="/feed"
              className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-content hover:bg-surface-tint focus-visible:outline-none focus-visible:shadow-focus"
            >
              {t("world.opportunitiesCta")}
            </Link>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t("world.history")} titleClassName="text-lg" />
        {detail.history.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-5 py-6 text-center text-sm text-content-muted shadow-sm">
            {t("world.historyEmpty")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface shadow-sm">
            {detail.history.map((activity) => (
              <HistoryRow key={activity.contentItemId} activity={activity} onCancelled={() => router.refresh()} />
            ))}
          </ul>
        )}
      </section>

      <RegisterSheet
        mission={registering}
        onClose={() => setRegistering(null)}
        onRegistered={(_, mission) => {
          setRegistering(null);
          setNotice(t("missions.registeredNotice", { title: mission.title, xp: xpText(mission.xp, locale, true) }));
          router.refresh();
        }}
      />
    </div>
  );
}

function HistoryRow({ activity, onCancelled }: { activity: WorldActivity; onCancelled: () => void }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const Icon = ACT_ICONS[activity.act];

  const cancel = async () => {
    setPending(true);
    setFailed(false);
    try {
      await clientFetch(`/me/registrations/${activity.contentItemId}`, { method: "DELETE" });
      onCancelled();
    } catch {
      setFailed(true);
      setPending(false);
    }
  };

  const title =
    activity.act === "read" ? (
      <Link href={`/feed/${activity.contentItemId}`} className="font-medium text-content underline-offset-4 hover:underline">
        {activity.title}
      </Link>
    ) : (
      <span className="font-medium text-content">{activity.title}</span>
    );

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-content-muted" />
      <div className="min-w-0 flex-1 text-sm">
        {title}
        <p className="text-xs text-content-muted">
          {t(`act.${activity.act}`)}
          <span aria-hidden="true"> · </span>
          {activity.act === "read"
            ? t("world.readOn", { date: formatDate(activity.at, locale) })
            : t("world.registeredOn", { date: formatDate(activity.at, locale) })}
          {activity.startsAt ? (
            <>
              <span aria-hidden="true"> · </span>
              {t("world.startsOn", { date: formatDateTime(activity.startsAt, locale) })}
            </>
          ) : null}
        </p>
        {failed ? (
          <p role="alert" className="mt-1 text-xs font-medium text-danger">
            {t("world.cancelError")}
          </p>
        ) : null}
      </div>
      <Numeric className="text-sm font-bold text-brand">+{formatXp(activity.xp, locale)} XP</Numeric>
      {activity.cancellable ? (
        <Button type="button" variant="ghost" size="md" isLoading={pending} onClick={cancel} title={t("world.cancelHint")}>
          {pending ? t("world.cancelling") : t("world.cancel")}
        </Button>
      ) : null}
    </li>
  );
}
