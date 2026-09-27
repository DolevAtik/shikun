"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Users } from "lucide-react";
import type { Audience, AudienceEstimate, Role } from "@moch/contracts";
import { RoleSchema } from "@moch/contracts";
import { api } from "@/lib/client-api";
import { useOrg } from "@/lib/use-org";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Dimension = "districtIds" | "departmentIds" | "organizationIds" | "roles";

/**
 * Who will see this. Four dimensions, each "anyone" until something is ticked;
 * dimensions combine with AND — the same rule `audience.ts` applies on the API.
 * Under the boxes: the rule in a sentence, and how many active employees it
 * reaches right now, so nobody has to reason about the AND in their head.
 */
export function AudiencePicker({
  value,
  onChange,
  idPrefix = "audience",
}: {
  value: Audience;
  onChange: (next: Audience) => void;
  idPrefix?: string;
}) {
  const t = useTranslations("audience");
  const tRoles = useTranslations("employees.roles");
  const locale = useLocale();
  const org = useOrg();
  const name = (row: { nameHe: string; nameEn: string }) => (locale === "en" ? row.nameEn : row.nameHe);

  const estimate = useQuery({
    queryKey: ["audience", "estimate", value],
    queryFn: () => api.post<AudienceEstimate>("/admin/audience/estimate", value),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  function toggle(dimension: Dimension, id: string, on: boolean) {
    const current = value[dimension] as string[];
    const next = on ? [...new Set([...current, id])] : current.filter((item) => item !== id);
    onChange({ ...value, [dimension]: next } as Audience);
  }

  const isEveryone =
    value.districtIds.length === 0 &&
    value.departmentIds.length === 0 &&
    value.organizationIds.length === 0 &&
    value.roles.length === 0;

  const pick = <T extends { id: string; nameHe: string; nameEn: string }>(rows: T[], ids: string[]) =>
    rows.filter((row) => ids.includes(row.id)).map(name);

  const parts = [
    value.districtIds.length ? t("sentence.districts", { list: pick(org.districts, value.districtIds).join(", ") }) : null,
    value.departmentIds.length ? t("sentence.departments", { list: pick(org.departments, value.departmentIds).join(", ") }) : null,
    value.organizationIds.length ? t("sentence.organizations", { list: pick(org.organizations, value.organizationIds).join(", ") }) : null,
    value.roles.length ? t("sentence.roles", { list: value.roles.map((role) => tRoles(role)).join(", ") }) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-sunken px-3 py-2">
        <p className="text-sm text-content">
          {isEveryone ? t("everyone") : parts.join(t("and"))}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-content-muted" aria-live="polite">
          <Users className="size-4" aria-hidden />
          {estimate.data
            ? t("reach", { count: estimate.data.count, total: estimate.data.total })
            : t("reachLoading")}
        </p>
      </div>

      <Group
        legend={t("districts")}
        idPrefix={`${idPrefix}-district`}
        options={org.districts.map((row) => ({ id: row.id, label: name(row) }))}
        selected={value.districtIds}
        onToggle={(id, on) => toggle("districtIds", id, on)}
        anyLabel={t("any")}
      />
      <Group
        legend={t("roles")}
        idPrefix={`${idPrefix}-role`}
        options={RoleSchema.options.map((role: Role) => ({ id: role, label: tRoles(role) }))}
        selected={value.roles}
        onToggle={(id, on) => toggle("roles", id, on)}
        anyLabel={t("any")}
      />
      <Group
        legend={t("departments")}
        idPrefix={`${idPrefix}-department`}
        options={org.departments.map((row) => ({ id: row.id, label: name(row) }))}
        selected={value.departmentIds}
        onToggle={(id, on) => toggle("departmentIds", id, on)}
        anyLabel={t("any")}
        collapsible
      />
      <Group
        legend={t("organizations")}
        idPrefix={`${idPrefix}-organization`}
        options={org.organizations.map((row) => ({ id: row.id, label: name(row) }))}
        selected={value.organizationIds}
        onToggle={(id, on) => toggle("organizationIds", id, on)}
        anyLabel={t("any")}
        collapsible
      />

      {!isEveryone && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange({ districtIds: [], departmentIds: [], organizationIds: [], roles: [] })}
        >
          {t("reset")}
        </Button>
      )}
    </div>
  );
}

function Group({
  legend,
  idPrefix,
  options,
  selected,
  onToggle,
  anyLabel,
  collapsible,
}: {
  legend: string;
  idPrefix: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string, on: boolean) => void;
  anyLabel: string;
  collapsible?: boolean;
}) {
  const [open, setOpen] = React.useState(!collapsible || selected.length > 0);
  const listId = `${idPrefix}-list`;

  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-center justify-between gap-2 text-sm font-medium text-content">
        <span>
          {legend}
          <span className="ms-2 text-xs font-normal text-content-muted">
            {selected.length === 0 ? anyLabel : `(${selected.length})`}
          </span>
        </span>
        {collapsible && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "−" : "+"}
            <span className="sr-only">{legend}</span>
          </Button>
        )}
      </legend>
      {open && (
        <div id={listId} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option) => {
            const id = `${idPrefix}-${option.id}`;
            return (
              <label key={option.id} htmlFor={id} className="flex items-center gap-2 text-sm text-content">
                <Checkbox
                  id={id}
                  checked={selected.includes(option.id)}
                  onCheckedChange={(checked) => onToggle(option.id, checked === true)}
                />
                <span className="min-w-0 truncate">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
