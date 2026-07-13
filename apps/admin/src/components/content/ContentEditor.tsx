"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AdminContentDetail, CreateAdminContent, UpdateAdminContent } from "@moch/contracts";
import { useRouter } from "@/i18n/routing";
import { api, applyServerIssues, ApiError } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";

const CREATE_KINDS = ["ANNOUNCEMENT", "FEED_POST", "CEO_MESSAGE", "ALERT"] as const;

export function ContentEditor({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: AdminContentDetail;
}) {
  const t = useTranslations("content");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [body, setBody] = React.useState(initial?.body ?? "");
  const [summary, setSummary] = React.useState(initial?.summary ?? "");
  const [kind, setKind] = React.useState<(typeof CREATE_KINDS)[number]>(
    (initial?.kind as (typeof CREATE_KINDS)[number]) ?? "ANNOUNCEMENT",
  );
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const detailQuery = useQuery({
    queryKey: qk.content.detail(initial?.id ?? ""),
    queryFn: () => api.get<AdminContentDetail>(`/admin/content/${initial!.id}`),
    enabled: mode === "edit" && Boolean(initial?.id),
    initialData: initial,
  });

  const item = detailQuery.data ?? initial;

  const save = useMutation({
    mutationFn: async () => {
      setFieldErrors({});
      if (mode === "create") {
        const payload: CreateAdminContent = {
          kind,
          title,
          body: body || undefined,
          summary: summary || undefined,
          channelSlug: kind === "FEED_POST" ? "organization" : undefined,
        };
        return api.post<AdminContentDetail>("/admin/content", payload);
      }
      const payload: UpdateAdminContent = {
        title,
        body: body || null,
        summary: summary || null,
      };
      return api.patch<AdminContentDetail>(`/admin/content/${item!.id}`, payload);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: qk.content.all });
      toast.success(t("saved"));
      if (mode === "create") router.replace(`/content/${saved.id}`);
    },
    onError: (error) => {
      if (
        !applyServerIssues(error, (name, err) =>
          setFieldErrors((prev) => ({ ...prev, [name]: err.message })),
        )
      ) {
        toast.error(error instanceof ApiError ? error.message : tCommon("error"));
      }
    },
  });

  const publish = useMutation({
    mutationFn: () => api.post<AdminContentDetail>(`/admin/content/${item!.id}/publish`),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: qk.content.all });
      void queryClient.setQueryData(qk.content.detail(saved.id), saved);
      toast.success(t("published"));
    },
  });

  const unpublish = useMutation({
    mutationFn: () => api.post<AdminContentDetail>(`/admin/content/${item!.id}/unpublish`),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: qk.content.all });
      void queryClient.setQueryData(qk.content.detail(saved.id), saved);
      toast.success(t("unpublished"));
    },
  });

  const archive = useMutation({
    mutationFn: () => api.post<AdminContentDetail>(`/admin/content/${item!.id}/archive`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.content.all });
      toast.success(t("archived"));
      setConfirmArchive(false);
      router.push("/content");
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            {mode === "create" ? t("create") : (item?.title ?? t("untitled"))}
          </h1>
          {item && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
              <Badge>{t(`status.${item.status}`)}</Badge>
              {item.districtName && (
                <span className="text-sm text-content-muted">{item.districtName}</span>
              )}
            </div>
          )}
        </div>
        {mode === "edit" && item && (
          <div className="flex flex-wrap gap-2">
            {item.status !== "PUBLISHED" ? (
              <Button
                type="button"
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
              >
                {t("actions.publish")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => unpublish.mutate()}
                disabled={unpublish.isPending}
              >
                {t("actions.unpublish")}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmArchive(true)}
            >
              {t("actions.archive")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("form.details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="kind">{t("columns.kind")}</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREATE_KINDS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`kinds.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t("columns.title")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            {fieldErrors.title && (
              <p className="text-sm text-danger" role="alert">
                {fieldErrors.title}
              </p>
            )}
          </div>

          {(kind === "ANNOUNCEMENT" || item?.kind === "ANNOUNCEMENT") && (
            <div className="space-y-2">
              <Label htmlFor="summary">{t("form.summary")}</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="body">{t("form.body")}</Label>
            <textarea
              id="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={12}
              className="flex w-full rounded-sm border border-input bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || !title.trim()}
            >
              {tCommon("save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/content")}>
              {tCommon("cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={t("confirmArchiveTitle")}
        description={t("confirmArchiveOne")}
        confirmLabel={t("actions.archive")}
        cancelLabel={tCommon("cancel")}
        destructive
        pending={archive.isPending}
        onConfirm={() => archive.mutate()}
      />
    </div>
  );
}
