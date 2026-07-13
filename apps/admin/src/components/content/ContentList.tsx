"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";
import type {
  AdminContentListItem,
  AdminContentPage,
  BulkResult,
  ContentKind,
  ContentStatus,
} from "@moch/contracts";
import { Link } from "@/i18n/routing";
import { api, toSearchParams } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { useListQuery } from "@/lib/use-list-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, selectColumn } from "@/components/data/DataTable";
import { ListToolbar } from "@/components/data/ListToolbar";
import { ListPagination } from "@/components/data/ListPagination";
import { BulkActionBar } from "@/components/data/BulkActionBar";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";

const KINDS: ContentKind[] = [
  "ANNOUNCEMENT",
  "FEED_POST",
  "EVENT",
  "CAREER",
  "TRAINING",
  "CEO_MESSAGE",
  "VIDEO",
  "ALERT",
];

const STATUSES: ContentStatus[] = ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"];

export function ContentList({ initial }: { initial?: AdminContentPage }) {
  const t = useTranslations("content");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [params, setParams] = useListQuery();
  const [kind, setKind] = React.useState<string>("all");
  const [status, setStatus] = React.useState<string>("all");
  const [selection, setSelection] = React.useState<RowSelectionState>({});
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchDraft, setSearchDraft] = React.useState(params.q);

  React.useEffect(() => {
    setSearchDraft(params.q);
  }, [params.q]);

  const listQuery = {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    dir: params.dir,
    sort: params.sort || "updatedAt",
    ...(kind !== "all" ? { kind: [kind] } : {}),
    ...(status !== "all" ? { status: [status] } : {}),
  };

  const query = useQuery({
    queryKey: qk.content.list(listQuery),
    queryFn: () =>
      api.get<AdminContentPage>(`/admin/content?${toSearchParams(listQuery)}`),
    placeholderData: keepPreviousData,
    initialData:
      kind === "all" && status === "all" && params.page === 1 && !params.q ? initial : undefined,
  });

  const bulk = useMutation({
    mutationFn: (body: { ids: string[]; action: "archive" | "publish" | "unpublish" }) =>
      api.post<BulkResult>("/admin/content/bulk", body),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: qk.content.all });
      setSelection({});
      if (result.failed.length === 0) {
        toast.success(t("bulkSuccess", { count: result.succeeded.length }));
      } else {
        toast.message(
          t("bulkPartial", {
            ok: result.succeeded.length,
            fail: result.failed.length,
          }),
        );
      }
      setConfirmArchive(false);
    },
  });

  const selectedIds = Object.keys(selection).filter((id) => selection[id]);

  const columns = React.useMemo<ColumnDef<AdminContentListItem, unknown>[]>(
    () => [
      selectColumn<AdminContentListItem>(),
      {
        accessorKey: "title",
        header: t("columns.title"),
        cell: ({ row }) => (
          <Link
            href={`/content/${row.original.id}`}
            className="font-medium text-content hover:text-brand"
          >
            {row.original.title ?? t("untitled")}
          </Link>
        ),
      },
      {
        accessorKey: "kind",
        header: t("columns.kind"),
        cell: ({ row }) => t(`kinds.${row.original.kind}`),
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {t(`status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "districtName",
        header: t("columns.district"),
        cell: ({ row }) => row.original.districtName ?? t("ministryWide"),
      },
      {
        accessorKey: "updatedAt",
        header: t("columns.updated"),
        cell: ({ row }) => (
          <span className="numeric text-content-muted">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
    ],
    [t],
  );

  function onSearchChange(value: string) {
    setSearchDraft(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void setParams({ q: value, page: 1 });
    }, 300);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
          <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/content/new">{t("create")}</Link>
        </Button>
      </div>

      <ListToolbar
        search={searchDraft}
        onSearchChange={onSearchChange}
        searchPlaceholder={t("search")}
        filters={
          <>
            <Select
              value={kind}
              onValueChange={(value) => {
                setKind(value);
                void setParams({ page: 1 });
              }}
            >
              <SelectTrigger className="w-[10rem]">
                <SelectValue placeholder={t("columns.kind")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allKinds")}</SelectItem>
                {KINDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`kinds.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                void setParams({ page: 1 });
              }}
            >
              <SelectTrigger className="w-[9rem]">
                <SelectValue placeholder={t("columns.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                {STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`status.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        loading={query.isLoading}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        getRowId={(row) => row.id}
      />

      {query.data && (
        <ListPagination
          meta={query.data.meta}
          onPageChange={(page) => void setParams({ page })}
          onPageSizeChange={(pageSize) => void setParams({ pageSize, page: 1 })}
        />
      )}

      <BulkActionBar
        count={selectedIds.length}
        label={t("selected")}
        onClear={() => setSelection({})}
        actions={
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulk.isPending}
              onClick={() => bulk.mutate({ ids: selectedIds, action: "publish" })}
            >
              {t("actions.publish")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulk.isPending}
              onClick={() => bulk.mutate({ ids: selectedIds, action: "unpublish" })}
            >
              {t("actions.unpublish")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={bulk.isPending}
              onClick={() => setConfirmArchive(true)}
            >
              {t("actions.archive")}
            </Button>
          </>
        }
      />

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={t("confirmArchiveTitle")}
        description={t("confirmArchiveDescription", { count: selectedIds.length })}
        confirmLabel={t("actions.archive")}
        cancelLabel={tCommon("cancel")}
        destructive
        pending={bulk.isPending}
        onConfirm={() => bulk.mutate({ ids: selectedIds, action: "archive" })}
      />
    </div>
  );
}

function statusVariant(status: ContentStatus): "secondary" | "success" | "warning" | "outline" {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "PENDING":
      return "warning";
    case "ARCHIVED":
      return "outline";
    default:
      return "secondary";
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
