"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";
import type { AdminHomeSection, AdminHomeSections, Audience, HomeSectionType } from "@moch/contracts";
import { Link } from "@/i18n/routing";
import { api, ApiError } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form/Field";
import { AudiencePicker } from "@/components/form/AudiencePicker";

/**
 * Where each section's content comes from, so "what shows up in this box?" is
 * one click away from the box. `tab:` targets a tab on this same screen.
 * Birthdays and the greeting have no source to manage: they are computed.
 */
const SOURCE: Partial<Record<HomeSectionType, string>> = {
  EMERGENCY: "/content?kind=ALERT",
  ANNOUNCEMENTS: "/content?kind=ANNOUNCEMENT",
  WEEKLY_SUMMARY: "tab:weekly",
  EVENTS: "/events",
  CEO_MESSAGE: "/content?kind=CEO_MESSAGE",
  VIDEO_OF_WEEK: "/content?kind=VIDEO",
  PROJECTS: "tab:projects",
  KEY_NUMBERS: "tab:numbers",
  CAREERS: "/careers",
  TRAININGS: "/learning",
  RECOGNITION: "/community?tab=recognitions",
};

/** Sections that render a list, and so honour `maxItems`. */
const HAS_LIMIT: HomeSectionType[] = [
  "ANNOUNCEMENTS",
  "EVENTS",
  "PROJECTS",
  "KEY_NUMBERS",
  "CAREERS",
  "TRAININGS",
  "BIRTHDAYS",
  "RECOGNITION",
];

const isTargeted = (audience: Audience) =>
  audience.districtIds.length + audience.departmentIds.length + audience.organizationIds.length + audience.roles.length > 0;

export function HomeLayoutEditor({
  initial,
  onOpenTab,
}: {
  initial: AdminHomeSections;
  onOpenTab?: (tab: string) => void;
}) {
  const t = useTranslations("homeLayout");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [sections, setSections] = React.useState(initial.sections);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  const query = useQuery({
    queryKey: qk.home.sections,
    queryFn: () => api.get<AdminHomeSections>("/admin/home/sections"),
    initialData: initial,
  });

  React.useEffect(() => {
    if (query.data && !dirty) setSections(query.data.sections);
  }, [query.data, dirty]);

  // Leaving with unsaved changes loses them; say so, the way a browser tab does.
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: (next: AdminHomeSection[]) =>
      api.put<AdminHomeSections>("/admin/home/sections", {
        sections: next.map((section, index) => ({
          id: section.id,
          order: index,
          isEnabled: section.isEnabled,
          title: section.title?.trim() ? section.title.trim() : null,
          maxItems: section.maxItems,
          audience: section.audience,
        })),
      }),
    onSuccess: (data) => {
      setDirty(false);
      setSections(data.sections);
      queryClient.setQueryData(qk.home.sections, data);
      toast.success(t("saved"));
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : tCommon("error")),
  });

  function update(id: string, patch: Partial<AdminHomeSection>) {
    setDirty(true);
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row!);
    setDirty(true);
    setSections(next.map((section, order) => ({ ...section, order })));
  }

  if (query.isLoading && sections.length === 0) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-sm text-warning">{t("unsaved")}</span>}
          <Button type="button" onClick={() => save.mutate(sections)} disabled={save.isPending || !dirty}>
            {tCommon("save")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ol className="space-y-2">
          {sections.map((section, index) => {
            const name = section.title ?? t(`types.${section.type}`);
            const open = expanded === section.id;
            const source = SOURCE[section.type];
            const panelId = `section-${section.id}-panel`;
            return (
              <li
                key={section.id}
                className={cn(
                  "rounded-md border border-line bg-surface",
                  !section.isEnabled && "bg-surface-sunken",
                )}
              >
                <div className="flex flex-wrap items-center gap-3 px-3 py-2">
                  <span className="numeric w-6 text-center text-sm text-content-muted" aria-hidden>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", section.isEnabled ? "text-content" : "text-content-muted")}>
                      {name}
                    </p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-content-muted">
                      {section.title && t(`types.${section.type}`)}
                      {!section.isEnabled && <Badge variant="outline">{t("hidden")}</Badge>}
                      {isTargeted(section.audience) && (
                        <Badge variant="secondary">
                          <Users className="me-1 size-3" aria-hidden />
                          {t("targeted")}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={t("moveUpNamed", { name })}
                    >
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === sections.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={t("moveDownNamed", { name })}
                    >
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-expanded={open}
                      aria-controls={panelId}
                      aria-label={t("settingsFor", { name })}
                      onClick={() => setExpanded(open ? null : section.id)}
                    >
                      <ChevronDown aria-hidden className={cn("transition-transform", open && "rotate-180")} />
                    </Button>
                  </div>
                  <Switch
                    checked={section.isEnabled}
                    onCheckedChange={(checked) => update(section.id, { isEnabled: checked })}
                    aria-label={t("showNamed", { name })}
                  />
                </div>

                {open && (
                  <div id={panelId} className="space-y-4 border-t border-line px-3 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id={`${section.id}-title`} label={t("customTitle")} hint={t("customTitleHint")}>
                        <Input
                          id={`${section.id}-title`}
                          value={section.title ?? ""}
                          placeholder={t(`types.${section.type}`)}
                          maxLength={100}
                          onChange={(event) => update(section.id, { title: event.target.value || null })}
                        />
                      </Field>
                      {HAS_LIMIT.includes(section.type) && (
                        <Field id={`${section.id}-max`} label={t("maxItems")} hint={t("maxItemsHint")}>
                          <Input
                            id={`${section.id}-max`}
                            type="number"
                            min={1}
                            max={20}
                            inputMode="numeric"
                            value={section.maxItems ?? ""}
                            onChange={(event) => {
                              const value = Number.parseInt(event.target.value, 10);
                              update(section.id, {
                                maxItems: Number.isFinite(value) ? Math.min(20, Math.max(1, value)) : null,
                              });
                            }}
                          />
                        </Field>
                      )}
                    </div>

                    {source && (
                      <p className="text-sm">
                        {source.startsWith("tab:") ? (
                          <Button type="button" variant="link" className="h-auto p-0" onClick={() => onOpenTab?.(source.slice(4))}>
                            {t("manageContent")}
                          </Button>
                        ) : (
                          <Link href={source} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                            {t("manageContent")}
                            <ExternalLink className="size-3.5" aria-hidden />
                          </Link>
                        )}
                      </p>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-content">{t("whoSees")}</p>
                      <AudiencePicker
                        idPrefix={`section-${section.id}`}
                        value={section.audience}
                        onChange={(audience) => update(section.id, { audience })}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
