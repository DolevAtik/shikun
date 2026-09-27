"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  AdminHomeData,
  AdminKeyMetric,
  AdminProject,
  AdminWeeklySummary,
  KeyMetricInput,
  ProjectInput,
  ProjectStatus,
  WeeklySummaryInput,
} from "@moch/contracts";
import { ProjectStatusSchema } from "@moch/contracts";
import { api, applyServerIssues, ApiError } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { useOrg } from "@/lib/use-org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { OrderedRows } from "@/components/data/OrderedRows";
import { Field } from "@/components/form/Field";
import { ImageField } from "@/components/form/ImageField";

/** Shared plumbing: every write refreshes Home's data and reports errors per field. */
function useHomeWrite<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  { success, onDone, setErrors }: { success: string; onDone?: () => void; setErrors?: (errors: Record<string, string>) => void },
) {
  const queryClient = useQueryClient();
  const tCommon = useTranslations("common");
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.home.data });
      toast.success(success);
      onDone?.();
    },
    onError: (error) => {
      const next: Record<string, string> = {};
      if (setErrors && applyServerIssues(error, (name, err) => (next[name] = err.message))) {
        setErrors(next);
      } else {
        toast.error(error instanceof ApiError ? error.message : tCommon("error"));
      }
    },
  });
}

function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  pending: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const tCommon = useTranslations("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Key numbers ─────────────────────────────────────────────────────────────

export function KeyMetricsEditor({ metrics }: { metrics: AdminHomeData["metrics"] }) {
  const t = useTranslations("homeData.metrics");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = React.useState<AdminKeyMetric | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<AdminKeyMetric | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState({ label: "", value: "", unit: "", changePct: "", period: "" });

  function open(target: AdminKeyMetric | "new") {
    setErrors({});
    setForm(
      target === "new"
        ? { label: "", value: "", unit: "", changePct: "", period: "" }
        : {
            label: target.label,
            value: String(target.value),
            unit: target.unit ?? "",
            changePct: target.changePct != null ? String(target.changePct) : "",
            period: target.period ?? "",
          },
    );
    setEditing(target);
  }

  const save = useHomeWrite(
    (input: KeyMetricInput) =>
      editing === "new" || editing === null
        ? api.post<AdminKeyMetric>("/admin/home/metrics", input)
        : api.patch<AdminKeyMetric>(`/admin/home/metrics/${editing.id}`, input),
    { success: t("saved"), onDone: () => setEditing(null), setErrors },
  );
  const remove = useHomeWrite((id: string) => api.del<void>(`/admin/home/metrics/${id}`), {
    success: t("deleted"),
    onDone: () => setDeleting(null),
  });
  const reorder = useHomeWrite((ids: string[]) => api.put<AdminKeyMetric[]>("/admin/home/metrics/order", { ids }), {
    success: t("reordered"),
  });

  function submit() {
    const value = Number(form.value);
    if (!form.label.trim() || !Number.isFinite(value) || form.value.trim() === "") {
      setErrors({
        ...(form.label.trim() ? {} : { label: t("required") }),
        ...(form.value.trim() !== "" && Number.isFinite(value) ? {} : { value: t("numberRequired") }),
      });
      return;
    }
    const change = form.changePct.trim() === "" ? null : Number(form.changePct);
    save.mutate({
      label: form.label,
      value,
      unit: form.unit.trim() || null,
      changePct: change !== null && Number.isFinite(change) ? change : null,
      period: form.period.trim() || null,
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </div>
        <Button type="button" onClick={() => open("new")}>
          {t("add")}
        </Button>
      </CardHeader>
      <CardContent>
        <OrderedRows
          items={metrics}
          busy={reorder.isPending}
          onReorder={(ids) => reorder.mutate(ids)}
          onEdit={open}
          onDelete={setDeleting}
          itemLabel={(metric) => metric.label}
          emptyTitle={t("empty")}
          render={(metric) => (
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="numeric text-lg font-semibold text-content">
                {metric.value.toLocaleString()}
                {metric.unit ? ` ${metric.unit}` : ""}
              </span>
              <span className="text-sm text-content">{metric.label}</span>
              {metric.changePct != null && (
                <Badge variant={metric.changePct >= 0 ? "success" : "danger"} className="numeric">
                  {metric.changePct > 0 ? "+" : ""}
                  {metric.changePct}%
                </Badge>
              )}
              {metric.period && <span className="text-xs text-content-muted">{metric.period}</span>}
            </div>
          )}
        />
      </CardContent>

      <EditorDialog
        open={editing !== null}
        onOpenChange={(value) => !value && setEditing(null)}
        title={editing === "new" ? t("add") : t("edit")}
        pending={save.isPending}
        onSubmit={submit}
      >
        <Field id="metric-label" label={t("label")} error={errors.label} required>
          <Input id="metric-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={80} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="metric-value" label={t("value")} error={errors.value} required>
            <Input id="metric-value" inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </Field>
          <Field id="metric-unit" label={t("unit")} hint={t("unitHint")}>
            <Input id="metric-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} maxLength={20} />
          </Field>
          <Field id="metric-change" label={t("changePct")} hint={t("changePctHint")} error={errors.changePct}>
            <Input id="metric-change" inputMode="decimal" value={form.changePct} onChange={(e) => setForm({ ...form, changePct: e.target.value })} />
          </Field>
          <Field id="metric-period" label={t("period")} hint={t("periodHint")}>
            <Input id="metric-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} maxLength={40} />
          </Field>
        </div>
      </EditorDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(value) => !value && setDeleting(null)}
        title={t("confirmDelete")}
        description={deleting?.label ?? ""}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </Card>
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────

const PROJECT_STATUSES = ProjectStatusSchema.options;

export function ProjectsEditor({ projects }: { projects: AdminHomeData["projects"] }) {
  const t = useTranslations("homeData.projects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const org = useOrg();
  const [editing, setEditing] = React.useState<AdminProject | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<AdminProject | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const empty = { name: "", city: "", districtId: "", status: "PLANNING" as ProjectStatus, progress: "0", housingUnits: "", imageUrl: "" };
  const [form, setForm] = React.useState(empty);

  function open(target: AdminProject | "new") {
    setErrors({});
    setForm(
      target === "new"
        ? { ...empty, districtId: org.districts[0]?.id ?? "" }
        : {
            name: target.name,
            city: target.city ?? "",
            districtId: target.districtId,
            status: target.status,
            progress: String(target.progress),
            housingUnits: target.housingUnits != null ? String(target.housingUnits) : "",
            imageUrl: target.imageUrl ?? "",
          },
    );
    setEditing(target);
  }

  const save = useHomeWrite(
    (input: ProjectInput) =>
      editing === "new" || editing === null
        ? api.post<AdminProject>("/admin/home/projects", input)
        : api.patch<AdminProject>(`/admin/home/projects/${editing.id}`, input),
    { success: t("saved"), onDone: () => setEditing(null), setErrors },
  );
  const remove = useHomeWrite((id: string) => api.del<void>(`/admin/home/projects/${id}`), {
    success: t("deleted"),
    onDone: () => setDeleting(null),
  });
  const reorder = useHomeWrite((ids: string[]) => api.put<AdminProject[]>("/admin/home/projects/order", { ids }), {
    success: t("reordered"),
  });

  function submit() {
    const progress = Math.round(Number(form.progress));
    const units = form.housingUnits.trim() === "" ? null : Math.round(Number(form.housingUnits));
    const problems: Record<string, string> = {};
    if (!form.name.trim()) problems.name = t("required");
    if (!form.districtId) problems.districtId = t("required");
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) problems.progress = t("progressRange");
    if (units !== null && (!Number.isFinite(units) || units < 0)) problems.housingUnits = t("numberRequired");
    if (Object.keys(problems).length) {
      setErrors(problems);
      return;
    }
    save.mutate({
      name: form.name,
      city: form.city.trim() || null,
      districtId: form.districtId,
      status: form.status,
      progress,
      housingUnits: units,
      imageUrl: form.imageUrl.trim() || null,
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </div>
        <Button type="button" onClick={() => open("new")}>
          {t("add")}
        </Button>
      </CardHeader>
      <CardContent>
        <OrderedRows
          items={projects}
          busy={reorder.isPending}
          onReorder={(ids) => reorder.mutate(ids)}
          onEdit={open}
          onDelete={setDeleting}
          itemLabel={(project) => project.name}
          emptyTitle={t("empty")}
          render={(project) => (
            <div>
              <p className="text-sm font-medium text-content">
                {project.name}
                {project.city && <span className="font-normal text-content-muted"> · {project.city}</span>}
              </p>
              <p className="text-xs text-content-muted">
                {project.districtName} · {t(`status.${project.status}`)} ·{" "}
                <span className="numeric">{project.progress}%</span>
                {project.housingUnits != null && <> · {t("unitsCount", { count: project.housingUnits })}</>}
              </p>
            </div>
          )}
        />
      </CardContent>

      <EditorDialog
        open={editing !== null}
        onOpenChange={(value) => !value && setEditing(null)}
        title={editing === "new" ? t("add") : t("edit")}
        pending={save.isPending}
        onSubmit={submit}
      >
        <Field id="project-name" label={t("name")} error={errors.name} required>
          <Input id="project-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="project-city" label={t("city")}>
            <Input id="project-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
          </Field>
          <Field id="project-district" label={t("district")} error={errors.districtId} required>
            <Select value={form.districtId} onValueChange={(value) => setForm({ ...form, districtId: value })}>
              <SelectTrigger id="project-district">
                <SelectValue placeholder={t("pickDistrict")} />
              </SelectTrigger>
              <SelectContent>
                {org.districts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {locale === "en" ? district.nameEn : district.nameHe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="project-status" label={t("statusLabel")}>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as ProjectStatus })}>
              <SelectTrigger id="project-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="project-progress" label={t("progress")} error={errors.progress} required>
            <Input id="project-progress" type="number" min={0} max={100} inputMode="numeric" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
          </Field>
          <Field id="project-units" label={t("housingUnits")} error={errors.housingUnits}>
            <Input id="project-units" type="number" min={0} inputMode="numeric" value={form.housingUnits} onChange={(e) => setForm({ ...form, housingUnits: e.target.value })} />
          </Field>
        </div>
        <Field id="project-image" label={t("image")}>
          <ImageField id="project-image" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
        </Field>
      </EditorDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(value) => !value && setDeleting(null)}
        title={t("confirmDelete")}
        description={deleting?.name ?? ""}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </Card>
  );
}

// ─── Weekly summary ──────────────────────────────────────────────────────────

export function WeeklyEditor({ weekly }: { weekly: AdminHomeData["weekly"] }) {
  const t = useTranslations("homeData.weekly");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [editing, setEditing] = React.useState<AdminWeeklySummary | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<AdminWeeklySummary | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState({ weekOf: "", title: "", teaser: "", highlights: "" });

  function open(target: AdminWeeklySummary | "new") {
    setErrors({});
    setForm(
      target === "new"
        ? { weekOf: thisSunday(), title: "", teaser: "", highlights: "" }
        : { weekOf: target.weekOf, title: target.title, teaser: target.teaser, highlights: target.highlights.join("\n") },
    );
    setEditing(target);
  }

  const save = useHomeWrite(
    (input: WeeklySummaryInput) =>
      editing === "new" || editing === null
        ? api.post<AdminWeeklySummary>("/admin/home/weekly", input)
        : api.patch<AdminWeeklySummary>(`/admin/home/weekly/${editing.id}`, input),
    { success: t("saved"), onDone: () => setEditing(null), setErrors },
  );
  const remove = useHomeWrite((id: string) => api.del<void>(`/admin/home/weekly/${id}`), {
    success: t("deleted"),
    onDone: () => setDeleting(null),
  });

  function submit() {
    const problems: Record<string, string> = {};
    if (!form.weekOf) problems.weekOf = t("required");
    if (!form.title.trim()) problems.title = t("required");
    if (!form.teaser.trim()) problems.teaser = t("required");
    if (Object.keys(problems).length) {
      setErrors(problems);
      return;
    }
    save.mutate({
      weekOf: form.weekOf,
      title: form.title,
      teaser: form.teaser,
      highlights: form.highlights
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 10),
    });
  }

  const latestId = weekly[0]?.id;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </div>
        <Button type="button" onClick={() => open("new")}>
          {t("add")}
        </Button>
      </CardHeader>
      <CardContent>
        <OrderedRows
          items={weekly}
          onEdit={open}
          onDelete={setDeleting}
          itemLabel={(summary) => summary.title}
          emptyTitle={t("empty")}
          render={(summary) => (
            <div>
              <p className="text-sm font-medium text-content">
                {summary.title}
                {summary.id === latestId && (
                  <Badge variant="success" className="ms-2 align-middle">
                    {t("onHome")}
                  </Badge>
                )}
              </p>
              <p className="text-xs text-content-muted">
                {t("weekOf", {
                  date: new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${summary.weekOf}T00:00:00Z`)),
                })}
                {" · "}
                {t("highlightsCount", { count: summary.highlights.length })}
              </p>
            </div>
          )}
        />
      </CardContent>

      <EditorDialog
        open={editing !== null}
        onOpenChange={(value) => !value && setEditing(null)}
        title={editing === "new" ? t("add") : t("edit")}
        description={t("dialogHint")}
        pending={save.isPending}
        onSubmit={submit}
      >
        <Field id="weekly-week" label={t("weekOfLabel")} hint={t("weekOfHint")} error={errors.weekOf} required>
          <Input id="weekly-week" type="date" value={form.weekOf} onChange={(e) => setForm({ ...form, weekOf: e.target.value })} />
        </Field>
        <Field id="weekly-title" label={t("titleLabel")} error={errors.title} required>
          <Input id="weekly-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
        </Field>
        <Field id="weekly-teaser" label={t("teaser")} error={errors.teaser} required>
          <Textarea id="weekly-teaser" rows={3} value={form.teaser} onChange={(e) => setForm({ ...form, teaser: e.target.value })} maxLength={400} />
        </Field>
        <Field id="weekly-highlights" label={t("highlights")} hint={t("highlightsHint")} error={errors.highlights}>
          <Textarea id="weekly-highlights" rows={5} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} />
        </Field>
      </EditorDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(value) => !value && setDeleting(null)}
        title={t("confirmDelete")}
        description={deleting?.title ?? ""}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </Card>
  );
}

/** YYYY-MM-DD of this week's Sunday, local time — the Israeli week starts on Sunday. */
function thisSunday(): string {
  const now = new Date();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
}
