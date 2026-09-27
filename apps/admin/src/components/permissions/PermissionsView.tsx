"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { AdminRoleCounts, Permission, Role } from "@moch/contracts";
import { PermissionSchema, ROLE_PERMISSIONS, RoleSchema } from "@moch/contracts";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * The permissions matrix, read from the same `ROLE_PERMISSIONS` the API guard
 * enforces — so this table cannot drift from what the system actually does.
 * Roles are granted per employee, on the Employees screen.
 */
export function PermissionsView({ initial }: { initial: AdminRoleCounts }) {
  const t = useTranslations("permissionsAdmin");
  const tRoles = useTranslations("employees.roles");
  const counts = useQuery({
    queryKey: qk.roleCounts,
    queryFn: () => api.get<AdminRoleCounts>("/admin/employees/role-counts"),
    initialData: initial,
  }).data;
  const countOf = (role: Role) => counts.roles.find((row) => row.role === role)?.count ?? 0;
  const roles = RoleSchema.options;
  const permissions = PermissionSchema.options;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      <section aria-label={t("rolesTitle")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((role) => (
          <Card key={role}>
            <CardHeader className="pb-2">
              <CardDescription>{tRoles(role)}</CardDescription>
              <CardTitle className="numeric text-2xl">{countOf(role)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-content-muted">{t(`roleHints.${role}`)}</p>
              <Link href={`/employees?role=${role}`} className="text-sm text-primary underline-offset-4 hover:underline">
                {t("whoHasIt")}
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("matrixTitle")}</CardTitle>
          <CardDescription>{t("matrixHint")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{t("permission")}</TableHead>
                {roles.map((role) => (
                  <TableHead key={role} scope="col" className="text-center">
                    {tRoles(role)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission: Permission) => (
                <TableRow key={permission}>
                  <TableHead scope="row" className="font-normal">
                    <span className="block text-sm text-content">{t(`permissions.${permission.replace(":", "_")}`)}</span>
                    <code className="text-xs text-content-muted" dir="ltr">
                      {permission}
                    </code>
                  </TableHead>
                  {roles.map((role) => {
                    const granted = ROLE_PERMISSIONS[role].includes(permission);
                    return (
                      <TableCell key={role} className="text-center">
                        {granted ? (
                          <Check className="mx-auto size-4 text-success" aria-label={t("granted")} />
                        ) : (
                          <span className="text-content-muted" aria-label={t("notGranted")}>
                            —
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
