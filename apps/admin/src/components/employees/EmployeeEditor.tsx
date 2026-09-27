"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AdminEmployeeDetail, Role, UpdateAdminEmployee } from "@moch/contracts";
import { RoleSchema, ROLE_PERMISSIONS } from "@moch/contracts";
import { api, ApiError } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { useOrg } from "@/lib/use-org";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { Field } from "@/components/form/Field";

const NONE = "__none";

/** One employee: title, unit, district, roles, and whether the account may sign in. */
export function EmployeeEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const org = useOrg();
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: qk.employees.detail(id ?? ""),
    queryFn: () => api.get<AdminEmployeeDetail>(`/admin/employees/${id}`),
    enabled: Boolean(id),
  });

  const [form, setForm] = React.useState({ title: "", departmentId: NONE, districtId: NONE, roles: [] as Role[], isActive: true });
  const [confirmDeactivate, setConfirmDeactivate] = React.useState(false);

  React.useEffect(() => {
    const d = detail.data;
    if (!d) return;
    setForm({
      title: d.title ?? "",
      departmentId: d.departmentId ?? NONE,
      districtId: d.districtId ?? NONE,
      roles: d.roles,
      isActive: d.isActive,
    });
  }, [detail.data]);

  const save = useMutation({
    mutationFn: (payload: UpdateAdminEmployee) => api.patch<AdminEmployeeDetail>(`/admin/employees/${id}`, payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(qk.employees.detail(saved.id), saved);
      void queryClient.invalidateQueries({ queryKey: qk.employees.all });
      void queryClient.invalidateQueries({ queryKey: qk.roleCounts });
      setConfirmDeactivate(false);
      toast.success(t("saved"));
    },
    onError: (error) => {
      setConfirmDeactivate(false);
      toast.error(error instanceof ApiError ? error.message : tCommon("error"));
    },
  });

  function payload(): UpdateAdminEmployee {
    return {
      title: form.title.trim() || null,
      departmentId: form.departmentId === NONE ? null : form.departmentId,
      districtId: form.districtId === NONE ? null : form.districtId,
      roles: form.roles,
      isActive: form.isActive,
    };
  }

  function submit() {
    if (form.roles.length === 0) {
      toast.error(t("rolesRequired"));
      return;
    }
    // Turning an account off is the one change here that locks someone out: confirm it.
    if (detail.data?.isActive && !form.isActive) {
      setConfirmDeactivate(true);
      return;
    }
    save.mutate(payload());
  }

  const d = detail.data;
  const permissionCount = new Set(form.roles.flatMap((role) => ROLE_PERMISSIONS[role])).size;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full max-w-lg overflow-y-auto p-6">
        <SheetTitle>{d?.fullName ?? t("editTitle")}</SheetTitle>
        <SheetDescription>{d ? d.email : tCommon("loading")}</SheetDescription>

        {detail.isLoading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        )}

        {d && (
          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <dl className="grid grid-cols-2 gap-3 rounded-md border border-line bg-surface-sunken p-3 text-sm">
              <div>
                <dt className="text-xs text-content-muted">{t("authored")}</dt>
                <dd className="numeric font-medium text-content">{d.authoredCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-content-muted">{t("commentsCount")}</dt>
                <dd className="numeric font-medium text-content">{d.commentCount}</dd>
              </div>
              {d.phone && (
                <div className="col-span-2">
                  <dt className="text-xs text-content-muted">{t("phone")}</dt>
                  <dd className="text-content" dir="ltr">{d.phone}</dd>
                </div>
              )}
            </dl>

            <Field id="employee-title" label={t("jobTitle")}>
              <Input id="employee-title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="employee-department" label={t("columns.department")}>
                <Select value={form.departmentId} onValueChange={(value) => setForm({ ...form, departmentId: value })}>
                  <SelectTrigger id="employee-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("noDepartment")}</SelectItem>
                    {org.departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {locale === "en" ? department.nameEn : department.nameHe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="employee-district" label={t("columns.district")}>
                <Select value={form.districtId} onValueChange={(value) => setForm({ ...form, districtId: value })}>
                  <SelectTrigger id="employee-district">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("headquarters")}</SelectItem>
                    {org.districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {locale === "en" ? district.nameEn : district.nameHe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-content">{t("columns.roles")}</legend>
              <p className="text-xs text-content-muted">{t("rolesHint", { count: permissionCount })}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {RoleSchema.options.map((role) => {
                  const checkboxId = `employee-role-${role}`;
                  return (
                    <label key={role} htmlFor={checkboxId} className="flex items-center gap-2 text-sm text-content">
                      <Checkbox
                        id={checkboxId}
                        checked={form.roles.includes(role)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            roles: checked === true ? [...form.roles, role] : form.roles.filter((r) => r !== role),
                          })
                        }
                      />
                      {t(`roles.${role}`)}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex items-start justify-between gap-3 rounded-md border border-line p-3">
              <div>
                <label htmlFor="employee-active" className="text-sm font-medium text-content">
                  {t("activeLabel")}
                </label>
                <p className="text-xs text-content-muted">{t("activeHint")}</p>
              </div>
              <Switch id="employee-active" checked={form.isActive} onCheckedChange={(value) => setForm({ ...form, isActive: value })} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending}>
                {tCommon("save")}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
            </div>
          </form>
        )}

        <ConfirmDialog
          open={confirmDeactivate}
          onOpenChange={setConfirmDeactivate}
          title={t("confirmDeactivateTitle")}
          description={t("confirmDeactivate", { name: d?.fullName ?? "" })}
          confirmLabel={t("deactivate")}
          cancelLabel={tCommon("cancel")}
          destructive
          pending={save.isPending}
          onConfirm={() => save.mutate(payload())}
        />
      </SheetContent>
    </Sheet>
  );
}
