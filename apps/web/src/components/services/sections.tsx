import type { QuickAction, QuickLink } from "@moch/contracts";
import { ExternalLink, type LucideIcon } from "lucide-react";
import { SectionHeader } from "@moch/ui";
import { getTranslations } from "next-intl/server";
import { ICONS } from "@/components/icons";

/**
 * The two lists that make Services the screen you *do* something on: tasks that
 * start inside the app, and the systems the employee has to leave it for.
 */

export async function QuickActionsSection({ items }: { items: QuickAction[] }) {
  const t = await getTranslations("services");

  return (
    <section className="py-3">
      <SectionHeader title={t("quickActions")} className="px-4" />
      <ul className="grid grid-cols-3 gap-3 px-4">
        {items.map((action) => {
          const Icon: LucideIcon = ICONS[action.icon] ?? ExternalLink;
          return (
            <li key={action.id}>
              <a
                href={action.href}
                className="flex h-full min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-lg border border-line bg-surface p-3 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon aria-hidden="true" className="size-[1.1rem]" />
                </span>
                <span className="text-xs font-medium leading-tight text-content">{action.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function QuickLinksSection({ items }: { items: QuickLink[] }) {
  const t = await getTranslations("services");

  return (
    <section className="py-3">
      <SectionHeader title={t("quickLinks")} className="px-4" />
      <ul className="grid grid-cols-2 gap-2 px-4">
        {items.map((link) => {
          const Icon: LucideIcon = ICONS[link.icon ?? ""] ?? ExternalLink;
          return (
            <li key={link.id}>
              <a
                href={link.url}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                className="flex min-h-11 items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-content shadow-sm transition-shadow hover:shadow-md"
              >
                <Icon aria-hidden="true" className="size-4 shrink-0 text-brand" />
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                {link.isExternal ? (
                  <>
                    <ExternalLink aria-hidden="true" className="size-3.5 shrink-0 text-content-muted" />
                    {/* Tell a screen reader the link leaves the app. WCAG 3.2.5. */}
                    <span className="sr-only">{t("opensInNewWindow")}</span>
                  </>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
