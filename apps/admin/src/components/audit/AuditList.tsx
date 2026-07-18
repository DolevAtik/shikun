"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import type { AuditFacets, AuditLogItem, AuditLogPage } from "@moch/contracts";
import { api, toSearchParams } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { useListQuery } from "@/lib/use-list-query";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data/DataTable";
import { ListToolbar } from "@/components/data/ListToolbar";
import { ListPagination } from "@/components/data/ListPagination";

export function AuditList({
  initial,
  facets,
}: {
  initial?: AuditLogPage;
  facets: AuditFacets;
}) {
  const t = useTranslations("audit");
  const [params, setParams] = useListQuery();
  const [action, setAction] = React.useState("all");
  const [entityType, setEntityType] = React.useState("all");
  const [detail, setDetail] = React.useState<AuditLogItem | null>(null);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchDraft, setSearchDraft] = React.useState(params.q);

  React.useEffect(() => setSearchDraft(params.q), [params.q]);

  const listQuery = {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    dir: params.dir,
    ...(action !== "all" ? { action } : {}),
    ...(entityType !== "all" ? { entityType } : {}),
  };

  const query = useQuery({
    queryKey: qk.audit.list(listQuery),
    queryFn: () => api.get<AuditLogPage>(`/admin/audit?${toSearchParams(listQuery)}`),
    placeholderData: keepPreviousData,
    initialData:
      action === "all" && entityType === "all" && params.page === 1 && !params.q
        ? initial
        : undefined,
  });

  function onSearchChange(value: string) {
    setSearchDraft(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void setParams({ q: value, page: 1 }), 300);
  }

  const columns = React.useMemo<ColumnDef<AuditLogItem, unknown>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: t("columns.when"),
        cell: ({ row }) => (
          <span className="numeric whitespace-nowrap text-content-muted">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "actorEmail",
        header: t("columns.actor"),
        cell: ({ row }) => <span className="text-content">{row.original.actorEmail}</span>,
      },
      {
        accessorKey: "action",
        header: t("columns.action"),
        cell: ({ row }) => <Badge variant="secondary">{row.original.action}</Badge>,
      },
      {
        accessorKey: "summary",
        header: t("columns.summary"),
        cell: ({ row }) => {
          const hasDiff = row.original.before != null || row.original.after != null;
          return (
            <button
              type="button"
              disabled={!hasDiff}
              onClick={() => hasDiff && setDetail(row.original)}
              className="text-start text-content hover:text-brand disabled:cursor-default disabled:hover:text-content"
            >
              {row.original.summary}
              {hasDiff && <span className="ms-1 text-xs text-content-muted">({t("viewChange")})</span>}
            </button>
          );
        },
      },
    ],
    [t],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      <ListToolbar
        search={searchDraft}
        onSearchChange={onSearchChange}
        searchPlaceholder={t("search")}
        filters={
          <>
            <Select
              value={action}
              onValueChange={(value) => {
                setAction(value);
                void setParams({ page: 1 });
              }}
            >
              <SelectTrigger className="w-[12rem]">
                <SelectValue placeholder={t("columns.action")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allActions")}</SelectItem>
                {facets.actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={entityType}
              onValueChange={(value) => {
                setEntityType(value);
                void setParams({ page: 1 });
              }}
            >
              <SelectTrigger className="w-[11rem]">
                <SelectValue placeholder={t("columns.entity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allEntities")}</SelectItem>
                {facets.entityTypes.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
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
      />

      {query.data && (
        <ListPagination
          meta={query.data.meta}
          onPageChange={(page) => void setParams({ page })}
          onPageSizeChange={(pageSize) => void setParams({ pageSize, page: 1 })}
        />
      )}

      <Dialog open={detail != null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.summary}</DialogTitle>
            <DialogDescription>
              {detail?.actorEmail} · <span className="numeric">{detail && formatDateTime(detail.createdAt)}</span>
              {detail?.ip && <> · <span className="numeric">{detail.ip}</span></>}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <DiffPane label={t("before")} value={detail?.before} />
            <DiffPane label={t("after")} value={detail?.after} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiffPane({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-content-muted">{label}</div>
      <pre className="max-h-64 overflow-auto rounded-sm border border-line bg-muted p-3 text-xs text-content">
        {value == null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
