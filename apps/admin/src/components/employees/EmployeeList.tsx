"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  AdminEmployeeListItem,
  AdminEmployeePage,
  District,
  Role,
} from "@moch/contracts";
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
import { DataTable } from "@/components/data/DataTable";
import { ListToolbar } from "@/components/data/ListToolbar";
import { ListPagination } from "@/components/data/ListPagination";

const ROLES: Role[] = [
  "EMPLOYEE",
  "MANAGER",
  "DISTRICT_MANAGER",
  "CONTENT_EDITOR",
  "HR",
  "EXECUTIVE",
  "ADMIN",
];

export function EmployeeList({
  initial,
  districts,
}: {
  initial?: AdminEmployeePage;
  districts: District[];
}) {
  const t = useTranslations("employees");
  const [params, setParams] = useListQuery();
  const [role, setRole] = React.useState("all");
  const [districtId, setDistrictId] = React.useState("all");
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchDraft, setSearchDraft] = React.useState(params.q);

  React.useEffect(() => setSearchDraft(params.q), [params.q]);

  const listQuery = {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    dir: params.dir,
    sort: params.sort || "name",
    ...(role !== "all" ? { role: [role] } : {}),
    ...(districtId !== "all" ? { districtId } : {}),
  };

  const query = useQuery({
    queryKey: qk.employees.list(listQuery),
    queryFn: () => api.get<AdminEmployeePage>(`/admin/employees?${toSearchParams(listQuery)}`),
    placeholderData: keepPreviousData,
    initialData:
      role === "all" && districtId === "all" && params.page === 1 && !params.q ? initial : undefined,
  });

  function onSearchChange(value: string) {
    setSearchDraft(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void setParams({ q: value, page: 1 }), 300);
  }

  const columns = React.useMemo<ColumnDef<AdminEmployeeListItem, unknown>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: t("columns.name"),
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-content"
              >
                {e.initials}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium text-content">
                  {e.fullName}
                  {!e.isActive && (
                    <Badge variant="outline" className="ms-2 align-middle">
                      {t("inactiveBadge")}
                    </Badge>
                  )}
                </div>
                <div className="truncate text-xs text-content-muted">{e.title ?? e.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "roles",
        header: t("columns.roles"),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((r) => (
              <Badge key={r} variant="secondary">
                {t(`roles.${r}`)}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "districtName",
        header: t("columns.district"),
        cell: ({ row }) =>
          row.original.districtName ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium"
              // The DB stores a token reference (`var(--district-haifa)`), which
              // is already a valid CSS value and is contrast-checked in both themes.
              style={row.original.districtColor ? { color: row.original.districtColor } : undefined}
            >
              {row.original.districtName}
            </span>
          ) : (
            <span className="text-content-muted">{t("headquarters")}</span>
          ),
      },
      {
        accessorKey: "departmentName",
        header: t("columns.department"),
        cell: ({ row }) => (
          <span className="text-content-muted">{row.original.departmentName ?? "—"}</span>
        ),
      },
      {
        accessorKey: "startedAt",
        header: t("columns.startedAt"),
        cell: ({ row }) => (
          <span className="numeric text-content-muted">
            {row.original.startedAt ? formatDate(row.original.startedAt) : "—"}
          </span>
        ),
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
              value={role}
              onValueChange={(value) => {
                setRole(value);
                void setParams({ page: 1 });
              }}
            >
              <SelectTrigger className="w-[11rem]">
                <SelectValue placeholder={t("columns.roles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allRoles")}</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`roles.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={districtId}
              onValueChange={(value) => {
                setDistrictId(value);
                void setParams({ page: 1 });
              }}
            >
              <SelectTrigger className="w-[11rem]">
                <SelectValue placeholder={t("columns.district")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allDistricts")}</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nameHe}
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
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}
