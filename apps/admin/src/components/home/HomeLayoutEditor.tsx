"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { AdminHomeSection, AdminHomeSections } from "@moch/contracts";
import { api } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeLayoutEditor({ initial }: { initial: AdminHomeSections }) {
  const t = useTranslations("homeLayout");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [sections, setSections] = React.useState(initial.sections);

  const query = useQuery({
    queryKey: qk.home.sections,
    queryFn: () => api.get<AdminHomeSections>("/admin/home/sections"),
    initialData: initial,
  });

  React.useEffect(() => {
    if (query.data) setSections(query.data.sections);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (next: AdminHomeSection[]) =>
      api.put<AdminHomeSections>("/admin/home/sections", {
        sections: next.map((section, index) => ({
          id: section.id,
          order: index,
          isEnabled: section.isEnabled,
          title: section.title,
          maxItems: section.maxItems,
        })),
      }),
    onSuccess: (data) => {
      setSections(data.sections);
      void queryClient.setQueryData(qk.home.sections, data);
      toast.success(t("saved"));
    },
  });

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row!);
    setSections(next.map((section, order) => ({ ...section, order })));
  }

  function toggle(id: string, isEnabled: boolean) {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, isEnabled } : section)),
    );
  }

  if (query.isLoading && sections.length === 0) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {sections.map((section, index) => (
            <li
              key={section.id}
              className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2"
            >
              <GripVertical className="size-4 shrink-0 text-content-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content">
                  {section.title ?? t(`types.${section.type}`)}
                </p>
                <p className="text-xs text-content-muted">{t(`types.${section.type}`)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={t("moveUp")}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === sections.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={t("moveDown")}
                >
                  ↓
                </Button>
              </div>
              <Switch
                checked={section.isEnabled}
                onCheckedChange={(checked) => toggle(section.id, checked)}
                aria-label={t("enabled")}
              />
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            onClick={() => save.mutate(sections)}
            disabled={save.isPending}
          >
            {tCommon("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
