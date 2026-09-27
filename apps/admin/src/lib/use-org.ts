"use client";

import { useQuery } from "@tanstack/react-query";
import type { Department, District, Organization } from "@moch/contracts";
import { api } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";

/** The org lists change about once a year; fetch them once per session. */
const ORG_STALE_MS = 60 * 60 * 1000;

export function useOrg() {
  const districts = useQuery({
    queryKey: qk.org.districts,
    queryFn: () => api.get<District[]>("/org/districts"),
    staleTime: ORG_STALE_MS,
  });
  const departments = useQuery({
    queryKey: qk.org.departments,
    queryFn: () => api.get<Department[]>("/org/departments"),
    staleTime: ORG_STALE_MS,
  });
  const organizations = useQuery({
    queryKey: qk.org.organizations,
    queryFn: () => api.get<Organization[]>("/org/organizations"),
    staleTime: ORG_STALE_MS,
  });

  return {
    districts: districts.data ?? [],
    departments: departments.data ?? [],
    organizations: organizations.data ?? [],
    loading: districts.isLoading || departments.isLoading || organizations.isLoading,
  };
}

/** `<input type="datetime-local">` speaks local wall time without a zone; the API speaks ISO. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatDateTime(iso: string, locale = "he-IL"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
