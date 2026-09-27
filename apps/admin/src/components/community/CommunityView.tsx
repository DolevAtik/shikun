"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { toast } from "sonner";
import type {
  AdminChannel,
  AdminCommentPage,
  AdminRecognitionPage,
} from "@moch/contracts";
import { Link } from "@/i18n/routing";
import { api, ApiError, toSearchParams } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/cn";
import { useListQuery } from "@/lib/use-list-query";
import { formatDateTime } from "@/lib/use-org";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/data/EmptyState";
import { ListToolbar } from "@/components/data/ListToolbar";
import { ListPagination } from "@/components/data/ListPagination";
import { Field } from "@/components/form/Field";

const TABS = ["comments", "recognitions", "channels"] as const;

export function CommunityView({ channels: initialChannels }: { channels: AdminChannel[] }) {
  const t = useTranslations("community");
  const [tab, setTab] = useQueryState("tab", parseAsStringEnum([...TABS]).withDefault("comments"));
  const [, setParams] = useListQuery();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
          <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/content/new?kind=FEED_POST">{t("newPost")}</Link>
        </Button>
      </div>

      <div role="tablist" aria-label={t("title")} className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((value) => (
          <button
            key={value}
            id={`tab-${value}`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls={`panel-${value}`}
            onClick={() => {
              // Paging and search belong to one list; carrying them to the next would be wrong.
              void setParams({ page: 1, q: "" });
              void setTab(value);
            }}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === value ? "border-primary text-content" : "border-transparent text-content-muted hover:text-content",
            )}
          >
            {t(`tabs.${value}`)}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "comments" && <ModerationList kind="comments" />}
        {tab === "recognitions" && <ModerationList kind="recognitions" />}
        {tab === "channels" && <Channels initial={initialChannels} />}
      </div>
    </div>
  );
}

function Channels({ initial }: { initial: AdminChannel[] }) {
  const t = useTranslations("community");
  const locale = useLocale();
  const channels = useQuery({
    queryKey: qk.community.channels,
    queryFn: () => api.get<AdminChannel[]>("/admin/community/channels"),
    initialData: initial,
  }).data;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {channels.map((channel) => (
        <Card key={channel.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-full" style={{ background: channel.color }} />
              <p className="font-medium text-content">{locale === "en" ? channel.nameEn : channel.nameHe}</p>
              {channel.isMandatory && <Badge variant="outline">{t("mandatory")}</Badge>}
            </div>
            <p className="text-sm text-content-muted">{channel.descriptionHe}</p>
            <p className="numeric text-xs text-content-muted">
              {t("channelStats", { posts: channel.postCount, followers: channel.followerCount })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type Item =
  | { kind: "comments"; row: AdminCommentPage["items"][number] }
  | { kind: "recognitions"; row: AdminRecognitionPage["items"][number] };

function ModerationList({ kind }: { kind: "comments" | "recognitions" }) {
  const t = useTranslations("community");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-GB" : "he-IL";
  const queryClient = useQueryClient();
  const [params, setParams] = useListQuery();
  const [searchDraft, setSearchDraft] = React.useState(params.q);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [removing, setRemoving] = React.useState<Item | null>(null);
  const [reason, setReason] = React.useState("");
  const [reasonError, setReasonError] = React.useState<string>();

  const listQuery = { page: params.page, pageSize: params.pageSize, q: params.q || undefined, dir: "desc" };
  const key = kind === "comments" ? qk.community.comments(listQuery) : qk.community.recognitions(listQuery);

  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      api.get<AdminCommentPage | AdminRecognitionPage>(`/admin/community/${kind}?${toSearchParams(listQuery)}`),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (item: Item) =>
      api.post<void>(`/admin/community/${item.kind}/${item.row.id}/remove`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.community.all });
      setRemoving(null);
      toast.success(t("removed"));
    },
    onError: (error) => {
      if (error instanceof ApiError && error.issues.length) setReasonError(error.issues[0]!.message);
      else toast.error(error instanceof ApiError ? error.message : tCommon("error"));
    },
  });

  function onSearchChange(value: string) {
    setSearchDraft(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void setParams({ q: value, page: 1 }), 300);
  }

  const items: Item[] =
    kind === "comments"
      ? ((query.data as AdminCommentPage | undefined)?.items ?? []).map((row) => ({ kind: "comments", row }))
      : ((query.data as AdminRecognitionPage | undefined)?.items ?? []).map((row) => ({ kind: "recognitions", row }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-content-muted">{t(`${kind}Hint`)}</p>
      <ListToolbar search={searchDraft} onSearchChange={onSearchChange} searchPlaceholder={t("search")} />

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={t(`${kind}Empty`)} />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.row.id} className="flex flex-wrap items-start gap-3 rounded-md border border-line bg-surface p-3">
              <div className="min-w-0 flex-1 space-y-1">
                {item.kind === "comments" ? (
                  <>
                    <p className="text-sm text-content">
                      <span className="font-medium">{item.row.authorName}</span>
                      <span className="text-content-muted">
                        {" "}
                        {t("onPost")}{" "}
                        <Link href={`/content/${item.row.postId}`} className="hover:text-brand">
                          {item.row.postTitle ?? t("untitledPost")}
                        </Link>
                      </span>
                    </p>
                    <p className="whitespace-pre-line text-sm text-content">{item.row.body}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-content">
                      <span className="font-medium">{item.row.giverName ?? t("system")}</span>
                      <span className="text-content-muted"> {t("thanked")} </span>
                      <span className="font-medium">{item.row.recipientName}</span>
                      <Badge variant="secondary" className="ms-2 align-middle">
                        {item.row.badge}
                      </Badge>
                    </p>
                    <p className="whitespace-pre-line text-sm text-content">{item.row.reason}</p>
                  </>
                )}
                <p className="numeric text-xs text-content-muted">
                  {formatDateTime(item.kind === "comments" ? item.row.createdAt : item.row.awardedAt, dateLocale)}
                  {item.kind === "comments" && item.row.likeCount > 0 && ` · ${t("likes", { count: item.row.likeCount })}`}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setReason("");
                  setReasonError(undefined);
                  setRemoving(item);
                }}
              >
                {t("remove")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {query.data && (
        <ListPagination
          meta={query.data.meta}
          onPageChange={(page) => void setParams({ page })}
          onPageSizeChange={(pageSize) => void setParams({ pageSize, page: 1 })}
        />
      )}

      <Dialog open={removing !== null} onOpenChange={(value) => !value && setRemoving(null)}>
        <DialogContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (reason.trim().length < 2) {
                setReasonError(t("reasonRequired"));
                return;
              }
              if (removing) remove.mutate(removing);
            }}
          >
            <DialogHeader>
              <DialogTitle>{t(removing?.kind === "recognitions" ? "removeRecognitionTitle" : "removeCommentTitle")}</DialogTitle>
              <DialogDescription>{t("removeHint")}</DialogDescription>
            </DialogHeader>
            <Field id="remove-reason" label={t("reason")} error={reasonError} required>
              <Textarea id="remove-reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRemoving(null)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={remove.isPending}>
                {t("remove")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
