"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import type { AdminQuest, AdminQuests } from "@moch/contracts";
import { api, ApiError } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/data/EmptyState";

const REWARD_MAX = 160;

/**
 * What each department gets for reaching its monthly goal in העולם שלי.
 * The progress shown is the same department total employees see — a sum,
 * never a list of who contributed.
 */
export function QuestList({ initial }: { initial: AdminQuests }) {
  const t = useTranslations("quests");
  const locale = useLocale();
  const query = useQuery({
    queryKey: qk.quests,
    queryFn: () => api.get<AdminQuests>("/admin/quests"),
    initialData: initial,
  });
  const data = query.data ?? initial;
  const monthName = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "he-IL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${data.month}-01T12:00:00Z`));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle", { month: monthName })}</p>
      </div>
      {data.items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="space-y-3">
          {data.items.map((item) => (
            <li key={item.departmentId}>
              <QuestRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuestRow({ item }: { item: AdminQuest }) {
  const t = useTranslations("quests");
  const locale = useLocale();
  const client = useQueryClient();
  const inputId = React.useId();
  const [draft, setDraft] = React.useState(item.reward ?? "");
  React.useEffect(() => setDraft(item.reward ?? ""), [item.reward]);

  const mutation = useMutation({
    mutationFn: (reward: string | null) => api.put<AdminQuests>(`/admin/quests/${item.departmentId}`, { reward }),
    onSuccess: (next) => {
      client.setQueryData(qk.quests, next);
      toast.success(t("saved"));
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : t("saveError")),
  });

  const name = locale === "en" ? item.nameEn : item.nameHe;
  const pct = item.target > 0 ? Math.min(100, Math.round((item.earned / item.target) * 100)) : 0;
  const number = (value: number) => new Intl.NumberFormat(locale === "en" ? "en-US" : "he-IL").format(value);
  const dirty = draft.trim() !== (item.reward ?? "");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-content">{name}</h2>
        <p className="text-sm text-content-muted">{t("members", { count: item.members })}</p>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-content-muted">{t("progress")}</span>
          <span dir="ltr" className="font-medium text-content">
            {number(item.earned)} / {number(item.target)} XP
          </span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken"
          role="progressbar"
          aria-label={t("progressOf", { name })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <form
        className="mt-4 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(draft.trim() ? draft.trim() : null);
        }}
      >
        <label htmlFor={inputId} className="flex items-center gap-1.5 text-sm font-medium text-content">
          <Gift aria-hidden="true" className="size-4 text-brand" />
          {t("reward")}
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={inputId}
            value={draft}
            maxLength={REWARD_MAX}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("rewardPlaceholder")}
            className="min-w-0 flex-1"
          />
          <Button type="submit" disabled={!dirty || mutation.isPending}>
            {mutation.isPending ? t("saving") : t("save")}
          </Button>
          {item.reward ? (
            <Button
              type="button"
              variant="ghost"
              disabled={mutation.isPending}
              onClick={() => {
                setDraft("");
                mutation.mutate(null);
              }}
            >
              {t("clear")}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-content-muted">
          {item.rewardSetBy ? t("setBy", { name: item.rewardSetBy }) : t("rewardHint")}
        </p>
      </form>
    </Card>
  );
}
