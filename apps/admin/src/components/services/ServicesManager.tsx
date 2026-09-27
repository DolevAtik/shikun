"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  AdminQuickAction,
  AdminQuickLink,
  AdminServices,
  ServiceIcon,
} from "@moch/contracts";
import { SERVICE_ICON_KEYS } from "@moch/contracts";
import { api, applyServerIssues, ApiError } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { serviceIcon } from "@/lib/service-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { OrderedRows } from "@/components/data/OrderedRows";
import { Field } from "@/components/form/Field";

type Kind = "actions" | "links";
type Row = AdminQuickAction | AdminQuickLink;

interface Draft {
  label: string;
  href: string;
  icon: ServiceIcon | "none";
  isExternal: boolean;
}

/** The employee Services screen: the tasks employees start, and the systems they leave for. */
export function ServicesManager({ initial }: { initial: AdminServices }) {
  const t = useTranslations("servicesAdmin");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const data = useQuery({
    queryKey: qk.services,
    queryFn: () => api.get<AdminServices>("/admin/services"),
    initialData: initial,
  }).data;

  const [editing, setEditing] = React.useState<{ kind: Kind; row: Row | null } | null>(null);
  const [deleting, setDeleting] = React.useState<{ kind: Kind; row: Row } | null>(null);
  const [draft, setDraft] = React.useState<Draft>({ label: "", href: "", icon: "file-text", isExternal: true });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function fail(error: unknown) {
    const next: Record<string, string> = {};
    if (applyServerIssues(error, (name, err) => (next[name === "url" ? "href" : name] = err.message))) {
      setErrors(next);
    } else {
      toast.error(error instanceof ApiError ? error.message : tCommon("error"));
    }
  }

  const refresh = () => void queryClient.invalidateQueries({ queryKey: qk.services });

  const save = useMutation({
    mutationFn: ({ kind, row, draft: d }: { kind: Kind; row: Row | null; draft: Draft }) => {
      const body =
        kind === "actions"
          ? { label: d.label, href: d.href, icon: d.icon === "none" ? "file-text" : d.icon }
          : { label: d.label, url: d.href, icon: d.icon === "none" ? null : d.icon, isExternal: d.isExternal };
      const base = `/admin/services/${kind}`;
      return row ? api.patch<Row>(`${base}/${row.id}`, body) : api.post<Row>(base, body);
    },
    onSuccess: () => {
      refresh();
      setEditing(null);
      toast.success(t("saved"));
    },
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: ({ kind, row }: { kind: Kind; row: Row }) => api.del<void>(`/admin/services/${kind}/${row.id}`),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success(t("deleted"));
    },
    onError: fail,
  });

  const reorder = useMutation({
    mutationFn: ({ kind, ids }: { kind: Kind; ids: string[] }) =>
      api.put<AdminServices>(`/admin/services/${kind}/order`, { ids }),
    onSuccess: (next) => {
      queryClient.setQueryData(qk.services, next);
      toast.success(t("reordered"));
    },
    onError: fail,
  });

  function open(kind: Kind, row: Row | null) {
    setErrors({});
    setDraft(
      row
        ? {
            label: row.label,
            href: "href" in row ? row.href : row.url,
            icon: ((row.icon as ServiceIcon | null) ?? "none"),
            isExternal: "isExternal" in row ? row.isExternal : false,
          }
        : { label: "", href: kind === "actions" ? "/" : "https://", icon: kind === "actions" ? "file-text" : "none", isExternal: true },
    );
    setEditing({ kind, row });
  }

  function submit() {
    if (!editing) return;
    const problems: Record<string, string> = {};
    if (!draft.label.trim()) problems.label = t("required");
    if (!draft.href.trim()) problems.href = t("required");
    if (Object.keys(problems).length) {
      setErrors(problems);
      return;
    }
    save.mutate({ kind: editing.kind, row: editing.row, draft });
  }

  const renderRow = (row: Row) => {
    const Icon = serviceIcon(row.icon);
    const href = "href" in row ? row.href : row.url;
    return (
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-content" aria-hidden>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-content">
            {row.label}
            {"isExternal" in row && row.isExternal && (
              <Badge variant="outline" className="ms-2 align-middle">
                {t("external")}
              </Badge>
            )}
          </p>
          <p className="truncate text-xs text-content-muted" dir="ltr">
            {href}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      {(["actions", "links"] as const).map((kind) => (
        <Card key={kind}>
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>{t(`${kind}.title`)}</CardTitle>
              <CardDescription>{t(`${kind}.subtitle`)}</CardDescription>
            </div>
            <Button type="button" onClick={() => open(kind, null)}>
              {t(`${kind}.add`)}
            </Button>
          </CardHeader>
          <CardContent>
            <OrderedRows<Row>
              items={kind === "actions" ? data.quickActions : data.quickLinks}
              busy={reorder.isPending}
              onReorder={(ids) => reorder.mutate({ kind, ids })}
              onEdit={(row) => open(kind, row)}
              onDelete={(row) => setDeleting({ kind, row })}
              itemLabel={(row) => row.label}
              emptyTitle={t(`${kind}.empty`)}
              render={renderRow}
            />
          </CardContent>
        </Card>
      ))}

      <Dialog open={editing !== null} onOpenChange={(value) => !value && setEditing(null)}>
        <DialogContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <DialogHeader>
              <DialogTitle>{editing?.row ? t("edit") : editing ? t(`${editing.kind}.add`) : ""}</DialogTitle>
              <DialogDescription>{editing ? t(`${editing.kind}.hint`) : ""}</DialogDescription>
            </DialogHeader>
            <Field id="service-label" label={t("label")} error={errors.label} required>
              <Input id="service-label" value={draft.label} maxLength={60} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            </Field>
            <Field id="service-href" label={t("href")} hint={t("hrefHint")} error={errors.href} required>
              <Input id="service-href" dir="ltr" value={draft.href} onChange={(e) => setDraft({ ...draft, href: e.target.value })} />
            </Field>
            <Field id="service-icon" label={t("icon")}>
              <Select value={draft.icon} onValueChange={(value) => setDraft({ ...draft, icon: value as Draft["icon"] })}>
                <SelectTrigger id="service-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editing?.kind === "links" && <SelectItem value="none">{t("noIcon")}</SelectItem>}
                  {SERVICE_ICON_KEYS.map((key) => {
                    const Icon = serviceIcon(key);
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <Icon className="size-4" aria-hidden />
                          {t(`icons.${key}`)}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>
            {editing?.kind === "links" && (
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="service-external" className="text-sm font-medium text-content">
                  {t("isExternal")}
                </label>
                <Switch id="service-external" checked={draft.isExternal} onCheckedChange={(value) => setDraft({ ...draft, isExternal: value })} />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(value) => !value && setDeleting(null)}
        title={t("confirmDelete")}
        description={deleting?.row.label ?? ""}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
