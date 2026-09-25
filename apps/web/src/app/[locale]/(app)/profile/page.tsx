import type { CurrentUser, EmployeeProgress } from "@moch/contracts";
import { Avatar, Card, Chip, IllustratedAvatar, ProgressBar, SectionHeader } from "@moch/ui";
import { Award, Building2, ChevronLeft, Mail, MapPin, Medal, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProfileActions } from "@/components/ProfileActions";
import { Link } from "@/i18n/routing";
import { serverFetchOrLogin } from "@/lib/api";
import { xpText } from "@/components/my-world/progress";
import { formatDate } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "עובד/ת",
  MANAGER: "מנהל/ת",
  DISTRICT_MANAGER: "מנהל/ת מחוז",
  CONTENT_EDITOR: "עורך/ת תוכן",
  HR: "משאבי אנוש",
  EXECUTIVE: "הנהלה בכירה",
  ADMIN: "מנהל/ת מערכת",
};

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("nav");
  const tSettings = await getTranslations("settings");
  const tProfile = await getTranslations("profile");
  const tWorld = await getTranslations("myWorld");
  const [user, progress] = await Promise.all([
    serverFetchOrLogin<CurrentUser>("/auth/me", locale),
    serverFetchOrLogin<EmployeeProgress>("/me/progress", locale),
  ]);
  const unlocked = progress.achievements.filter((achievement) => achievement.unlockedAt !== null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 pt-6">
      <h1 className="sr-only">{t("profile")}</h1>

      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <Avatar name={user.fullName} initials={user.initials} src={user.avatarUrl} size="lg" className="size-20 text-xl" />
        <div>
          <p className="text-lg font-bold text-content">{user.fullName}</p>
          {user.title ? <p className="text-sm text-content-muted">{user.title}</p> : null}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {user.roles.map((role) => (
            <Chip key={role} className="bg-brand-soft text-brand">
              {ROLE_LABELS[role] ?? role}
            </Chip>
          ))}
        </div>
      </Card>

      <section>
        <SectionHeader title={tProfile("progressTitle")} />
        <Link
          href="/my-world"
          className="block rounded-lg focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={`${tProfile("openWorld")} · ${tProfile("levelXp", { level: progress.level.level, xp: xpText(progress.level.total, locale) })}`}
        >
          <Card interactive className="flex items-center gap-4 p-4">
            <span className="size-14 shrink-0 overflow-hidden rounded-full bg-brand-soft ring-2 ring-line">
              <IllustratedAvatar level={progress.level.level} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-content">
                {tProfile("levelXp", { level: progress.level.level, xp: xpText(progress.level.total, locale) })}
              </span>
              <ProgressBar
                className="mt-2"
                label={tWorld("xpLabel")}
                hideLabel
                hideValue
                value={progress.level.current}
                max={progress.level.next}
                valueText={`${progress.level.current} / ${progress.level.next} XP`}
              />
            </span>
            <ChevronLeft aria-hidden="true" className="size-4 shrink-0 text-content-muted ltr:rotate-180" />
          </Card>
        </Link>
      </section>

      <section>
        <SectionHeader title="פרטים" />
        <Card className="divide-y divide-line">
          <Row Icon={Mail} label="דוא״ל" value={user.email} />
          {user.phone ? <Row Icon={Phone} label="טלפון" value={user.phone} /> : null}
          {user.department ? (
            <Row Icon={Building2} label="יחידה" value={user.department.nameHe} />
          ) : null}
          {user.district ? (
            <Row Icon={MapPin} label="מחוז" value={user.district.nameHe} color={user.district.color} />
          ) : (
            <Row Icon={MapPin} label="מחוז" value="מטה" />
          )}
        </Card>
      </section>

      <section>
        <SectionHeader title={tSettings("title")} />
        <ProfileActions />
      </section>

      {user.startedAt ? (
        <p className="px-1 text-xs text-content-muted">
          במשרד מאז {formatDate(user.startedAt, locale)}
        </p>
      ) : null}

      <section>
        <SectionHeader title={tProfile("achievements")} />
        {unlocked.length === 0 ? (
          <p className="px-1 text-sm text-content-muted">{tProfile("achievementsEmpty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {unlocked.map((achievement) => (
              <li key={achievement.id}>
                <Chip className="gap-1.5 bg-warning-soft text-content">
                  <Award aria-hidden="true" className="size-3.5 text-accent-amber" />
                  {tWorld(`achievements.items.${achievement.id}.title`)}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader title={tProfile("recognition")} />
        {progress.recognitions.length === 0 ? (
          <p className="px-1 text-sm text-content-muted">{tProfile("recognitionEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {progress.recognitions.slice(0, 3).map((recognition) => (
              <li key={recognition.id}>
                <Card className="flex items-start gap-3 p-4">
                  <Medal aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: recognition.badgeColor }} />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-content">
                      {locale === "en" ? recognition.badgeNameEn : recognition.badgeNameHe}
                    </p>
                    <p className="text-content">{recognition.reason}</p>
                    {recognition.giverName ? (
                      <p className="mt-1 text-xs text-content-muted">{tProfile("from", { name: recognition.giverName })}</p>
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({
  Icon,
  label,
  value,
  color,
}: {
  Icon: typeof Mail;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-tint"
        style={color ? { color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` } : undefined}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-content-muted">{label}</p>
        <p className="truncate text-sm font-medium text-content">{value}</p>
      </div>
    </div>
  );
}
