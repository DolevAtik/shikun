"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Avatar } from "@moch/ui";

interface AppHeaderProps {
  name: string;
  initials: string;
  avatarUrl: string | null;
}

export function AppHeader({ name, initials, avatarUrl }: AppHeaderProps) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-brand text-content-onsurfacebrand">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
        {/* The Ministry's own mark, on its own white plate — a government emblem
            should never sit directly on a colored field. */}
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white p-1">
          <img src="/ministry-logo.svg" alt="" className="size-full object-contain" />
        </span>

        {/* The Ministry's name is never abbreviated. Theme, language and sign-out
            live on the profile page so this line always renders in full. */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{t("app.name")}</p>
          <p className="truncate text-xs leading-tight opacity-80">{t("app.shortName")}</p>
        </div>

        <Link
          href="/profile"
          aria-label={t("nav.profile")}
          className="shrink-0 rounded-full transition-opacity hover:opacity-80"
        >
          <Avatar
            name={name}
            initials={initials}
            src={avatarUrl}
            size="sm"
            className="bg-white/20 text-content-onsurfacebrand"
          />
        </Link>
      </div>
    </header>
  );
}
