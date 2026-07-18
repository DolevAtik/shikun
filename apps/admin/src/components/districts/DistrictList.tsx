"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Users, FileText, Building2, UserCog } from "lucide-react";
import type { AdminDistrict, AdminDistricts } from "@moch/contracts";
import { api } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DistrictList({ initial }: { initial: AdminDistricts }) {
  const t = useTranslations("districts");

  const query = useQuery({
    queryKey: qk.districts.list,
    queryFn: () => api.get<AdminDistricts>("/admin/districts"),
    initialData: initial,
  });

  const districts = query.data?.districts ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {districts.map((d) => (
            <DistrictCard key={d.id} district={d} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function DistrictCard({
  district: d,
  t,
}: {
  district: AdminDistrict;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card className="overflow-hidden">
      {/* The district's own token colour as a top rule. Already contrast-safe. */}
      <div className="h-1.5 w-full" style={{ backgroundColor: d.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-content">{d.nameHe}</h2>
            <p className="text-xs text-content-muted">{d.nameEn}</p>
          </div>
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: d.color }}
          />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          <Stat icon={Users} label={t("employees")} value={d.employeeCount} />
          <Stat icon={FileText} label={t("content")} value={d.contentCount} />
          <Stat icon={Building2} label={t("projects")} value={d.projectCount} />
        </dl>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-sm">
          <UserCog className="size-4 text-content-muted" />
          <span className="text-content-muted">{t("manager")}:</span>
          <span className="font-medium text-content">
            {d.managerName ?? t("noManager")}
          </span>
        </div>
      </div>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-content-muted">
        <Icon className="size-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="numeric mt-0.5 text-xl font-semibold text-content">{value}</div>
    </div>
  );
}
