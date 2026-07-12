import type { CurrentUser } from "@moch/contracts";
import { Avatar, Card, Chip, SectionHeader } from "@moch/ui";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverFetchOrLogin } from "@/lib/api";
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
  const user = await serverFetchOrLogin<CurrentUser>("/auth/me", locale);

  return (
    <div className="flex flex-col gap-4 p-4 pt-6">
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

      {user.startedAt ? (
        <p className="px-1 text-xs text-content-muted">
          במשרד מאז {formatDate(user.startedAt, locale)}
        </p>
      ) : null}

      {/* Skills, badges, activity and posts land with the full Profile module.
          Saying so beats faking an empty tab. */}
      <p className="px-1 text-xs text-content-muted">
        כישורים, תגים, פעילות ופוסטים — בסבב הבא.
      </p>
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
