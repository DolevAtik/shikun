"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import type {
  AdminSession,
  AdminSessionKind,
  AdminSessionPage,
  AdminSessionRegistrants,
} from "@moch/contracts";
import { Link } from "@/i18n/routing";
import { api, toSearchParams } from "@/lib/client-api";
import { useListQuery } from "@/lib/use-list-query";
import { formatDateTime } from "@/lib/use-org";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data/DataTable";
import { ListToolbar } from "@/components/data/ListToolbar";
import { ListPagination } from "@/components/data/ListPagination";

const WHEN = ["upcoming", "past", "all"] as const;
type When = (typeof WHEN)[number];

/**
 * Events or trainings, as an organiser sees them: when, how full, and — once
 * it has happened — how many said they came. Editing one is the content editor.
 */
export function SessionsView({ kind, initial }: { kind: AdminSessionKind; initial?: AdminSessionPage }) {
  const t = useTranslations("sessions");
  const tContent = useTranslations("content");
  const locale = useLocale();
  const [params, setParams] = useListQuery();
  const [when, setWhen] = React.useState<When>("upcoming");
  const [sessionId, setSessionId] = useQueryState("session");
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchDraft, setSearchDraft] = React.useState(params.q);
  const dateLocale = locale === "en" ? "en-GB" : "he-IL";

  const listQuery = {
    kind,
    when,
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
  };

  const query = useQuery({
    queryKey: ["sessions", "list", listQuery],
    queryFn: () => api.get<AdminSessionPage>(`/admin/sessions?${toSearchParams(listQuery)}`),
    placeholderData: keepPreviousData,
    initialData: when === "upcoming" && params.page === 1 && !params.q ? initial : undefined,
  });

  function onSearchChange(value: string) {
    setSearchDraft(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void setParams({ q: value, page: 1 }), 300);
  }

  const columns = React.useMemo<ColumnDef<AdminSession, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("columns.title"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link href={`/content/${row.original.id}`} className="font-medium text-content hover:text-brand">
              {row.original.title ?? tContent("untitled")}
            </Link>
            <div className="text-xs text-content-muted">
              {row.original.format
                ? tContent(`format.${row.original.format}`)
                : row.original.isOnline
                  ? t("online")
                  : (row.original.location ?? "—")}
              {row.original.districtName ? ` · ${row.original.districtName}` : ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "startsAt",
        header: t("columns.when"),
        cell: ({ row }) => (
          <span className="numeric text-content-muted">{formatDateTime(row.original.startsAt, dateLocale)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => (
          <Badge variant={row.original.status === "PUBLISHED" ? "success" : "secondary"}>
            {tContent(`status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "registrations",
        header: t("columns.registrations"),
        cell: ({ row }) => {
          const { registrations, capacity } = row.original;
          const full = capacity !== null && registrations >= capacity;
          return (
            <span className="numeric">
              {capacity !== null ? t("ofCapacity", { count: registrations, capacity }) : registrations}
              {full && (
                <Badge variant="warning" className="ms-2">
                  {t("full")}
                </Badge>
              )}
            </span>
          );
        },
      },
      {
        id: "attendance",
        header: t("columns.attendance"),
        cell: ({ row }) =>
          new Date(row.original.startsAt) > new Date() ? (
            <span className="text-content-muted">—</span>
          ) : (
            <span className="numeric text-sm">
              {t("attendanceSummary", { attended: row.original.attended, missed: row.original.missed })}
            </span>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("columns.actions")}</span>,
        cell: ({ row }) => (
          <Button type="button" size="sm" variant="outline" onClick={() => void setSessionId(row.original.id)}>
            {t("registrants")}
          </Button>
        ),
      },
    ],
    [t, tContent, dateLocale, setSessionId],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">{t(`title.${kind}`)}</h1>
          <p className="mt-1 text-sm text-content-muted">{t(`subtitle.${kind}`)}</p>
        </div>
        <Button asChild>
          <Link href={`/content/new?kind=${kind}`}>{t(`create.${kind}`)}</Link>
        </Button>
      </div>

      <ListToolbar
        search={searchDraft}
        onSearchChange={onSearchChange}
        searchPlaceholder={t("search")}
        filters={
          <div className="flex gap-1 rounded-sm border border-line bg-surface p-1" role="group" aria-label={t("when")}>
            {WHEN.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={when === value ? "secondary" : "ghost"}
                aria-pressed={when === value}
                onClick={() => {
                  setWhen(value);
                  void setParams({ page: 1 });
                }}
              >
                {t(`whenOptions.${value}`)}
              </Button>
            ))}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        loading={query.isLoading}
        emptyTitle={t(`empty.${kind}`)}
        emptyDescription={t("emptyDescription")}
        getRowId={(row) => row.id}
      />

      {query.data && (
        <ListPagination
          meta={query.data.meta}
          onPageChange={(page) => void setParams({ page })}
          onPageSizeChange={(pageSize) => void setParams({ pageSize, page: 1 })}
        />
      )}

      <RegistrantsSheet id={sessionId} onClose={() => void setSessionId(null)} dateLocale={dateLocale} />
    </div>
  );
}

function RegistrantsSheet({
  id,
  onClose,
  dateLocale,
}: {
  id: string | null;
  onClose: () => void;
  dateLocale: string;
}) {
  const t = useTranslations("sessions");
  const query = useQuery({
    queryKey: ["sessions", "registrants", id],
    queryFn: () => api.get<AdminSessionRegistrants>(`/admin/sessions/${id}/registrants`),
    enabled: Boolean(id),
  });
  const data = query.data;

  function exportCsv() {
    if (!data) return;
    const header = [t("csv.name"), t("csv.email"), t("csv.department"), t("csv.district"), t("csv.registeredAt"), t("csv.attended")];
    const rows = data.items.map((item) => [
      item.fullName,
      item.email,
      item.departmentName ?? "",
      item.districtName ?? "",
      new Date(item.registeredAt).toISOString(),
      item.attended === null ? "" : item.attended ? t("yes") : t("no"),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    // A BOM so Excel opens the Hebrew as UTF-8 instead of mojibake.
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registrants-${data.session.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full max-w-xl overflow-y-auto p-6">
        <SheetTitle>{data?.session.title ?? t("registrants")}</SheetTitle>
        <SheetDescription>
          {data
            ? `${formatDateTime(data.session.startsAt, dateLocale)} · ${t("registeredCount", { count: data.items.length })}`
            : t("loading")}
        </SheetDescription>

        {query.isLoading && (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-content-muted">
                {t("attendanceSummary", { attended: data.session.attended, missed: data.session.missed })}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={exportCsv} disabled={data.items.length === 0}>
                <Download aria-hidden />
                {t("export")}
              </Button>
            </div>
            {data.items.length === 0 ? (
              <p className="text-sm text-content-muted">{t("noRegistrants")}</p>
            ) : (
              <ul className="divide-y divide-line rounded-md border border-line">
                {data.items.map((item) => (
                  <li key={item.userId} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-content">{item.fullName}</p>
                      <p className="truncate text-xs text-content-muted">
                        {[item.departmentName, item.districtName].filter(Boolean).join(" · ") || item.email}
                      </p>
                    </div>
                    <Badge variant={item.attended === null ? "outline" : item.attended ? "success" : "secondary"}>
                      {item.attended === null ? t("noAnswer") : item.attended ? t("came") : t("didNotCome")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function csvCell(value: string): string {
  // Quote everything, and neutralise a leading formula character so a name like
  // "=HYPERLINK(...)" cannot run when the file is opened in a spreadsheet.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
