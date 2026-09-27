"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  AdminContentDetail,
  AlertSeverity,
  Audience,
  Channel,
  ChannelSlug,
  ContentKind,
  CreateAdminContent,
  TrainingFormat,
  UpdateAdminContent,
} from "@moch/contracts";
import { ContentKindSchema, EMPTY_AUDIENCE } from "@moch/contracts";
import { Link, useRouter } from "@/i18n/routing";
import { api, applyServerIssues, ApiError } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { fromLocalInput, toLocalInput, useOrg } from "@/lib/use-org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { Field } from "@/components/form/Field";
import { ImageField } from "@/components/form/ImageField";
import { AudiencePicker } from "@/components/form/AudiencePicker";

const KINDS = ContentKindSchema.options;
const SEVERITIES: AlertSeverity[] = ["INFO", "WARNING", "CRITICAL"];
const FORMATS: TrainingFormat[] = ["ONLINE", "IN_PERSON", "HYBRID"];
const NONE = "__none";

/** Which kinds carry which fields. One table, read by the form and by the payload. */
const HAS = {
  summary: ["ANNOUNCEMENT"],
  image: ["ANNOUNCEMENT", "EVENT", "CEO_MESSAGE"],
  channel: ["FEED_POST"],
  alert: ["ALERT"],
  session: ["EVENT", "TRAINING"],
  event: ["EVENT"],
  training: ["TRAINING"],
  career: ["CAREER"],
  video: ["VIDEO", "CEO_MESSAGE"],
  videoDetails: ["VIDEO"],
  href: ["ALERT", "CAREER"],
} satisfies Record<string, ContentKind[]>;

const has = (group: keyof typeof HAS, kind: ContentKind) => (HAS[group] as ContentKind[]).includes(kind);

interface Form {
  kind: ContentKind;
  title: string;
  body: string;
  summary: string;
  imageUrl: string;
  channelSlug: string;
  districtId: string;
  audience: Audience;
  isPinned: boolean;
  publishedAt: string;
  severity: AlertSeverity;
  href: string;
  expiresAt: string;
  startsAt: string;
  endsAt: string;
  location: string;
  isOnline: boolean;
  capacity: string;
  format: TrainingFormat;
  departmentId: string;
  closesAt: string;
  isInternal: boolean;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: string;
  isVideoOfWeek: boolean;
}

function formFrom(item: AdminContentDetail | undefined, kind: ContentKind): Form {
  return {
    kind: item?.kind ?? kind,
    title: item?.title ?? "",
    body: item?.body ?? "",
    summary: item?.summary ?? "",
    imageUrl: item?.imageUrl ?? "",
    channelSlug: item?.channelSlug ?? "organization",
    districtId: item?.districtId ?? NONE,
    audience: item?.audience ?? EMPTY_AUDIENCE,
    isPinned: item?.isPinned ?? false,
    publishedAt: toLocalInput(item?.publishedAt),
    severity: item?.severity ?? "INFO",
    href: item?.href ?? "",
    expiresAt: toLocalInput(item?.expiresAt),
    startsAt: toLocalInput(item?.startsAt),
    endsAt: toLocalInput(item?.endsAt),
    location: item?.location ?? "",
    isOnline: item?.isOnline ?? false,
    capacity: item?.capacity != null ? String(item.capacity) : "",
    format: item?.format ?? "IN_PERSON",
    departmentId: item?.departmentId ?? NONE,
    closesAt: toLocalInput(item?.closesAt),
    isInternal: item?.isInternal ?? true,
    videoUrl: item?.videoUrl ?? "",
    thumbnailUrl: item?.thumbnailUrl ?? "",
    durationSeconds: item?.durationSeconds != null ? String(item.durationSeconds) : "",
    isVideoOfWeek: item?.isVideoOfWeek ?? false,
  };
}

const text = (value: string) => (value.trim() ? value.trim() : null);
const int = (value: string) => (value.trim() ? Number.parseInt(value, 10) : null);
const pickId = (value: string) => (value === NONE ? null : value);

/** The kind's own fields, shaped for both create and PATCH. */
function kindFields(form: Form) {
  const k = form.kind;
  return {
    ...(has("summary", k) ? { summary: text(form.summary) } : {}),
    ...(has("image", k) ? { imageUrl: text(form.imageUrl) } : {}),
    ...(has("alert", k)
      ? { severity: form.severity, expiresAt: fromLocalInput(form.expiresAt) }
      : {}),
    ...(has("href", k) ? { href: text(form.href) } : {}),
    ...(has("session", k)
      ? { startsAt: fromLocalInput(form.startsAt) ?? undefined, capacity: int(form.capacity) }
      : {}),
    ...(has("event", k)
      ? { endsAt: fromLocalInput(form.endsAt), location: text(form.location), isOnline: form.isOnline }
      : {}),
    ...(has("training", k) ? { format: form.format } : {}),
    ...(has("career", k)
      ? { departmentId: pickId(form.departmentId), closesAt: fromLocalInput(form.closesAt), isInternal: form.isInternal }
      : {}),
    ...(has("video", k) ? { videoUrl: text(form.videoUrl) } : {}),
    ...(has("videoDetails", k)
      ? {
          thumbnailUrl: text(form.thumbnailUrl),
          durationSeconds: int(form.durationSeconds),
          isVideoOfWeek: form.isVideoOfWeek,
        }
      : {}),
  };
}

export function ContentEditor({
  mode,
  initial,
  defaultKind = "ANNOUNCEMENT",
}: {
  mode: "create" | "edit";
  initial?: AdminContentDetail;
  defaultKind?: ContentKind;
}) {
  const t = useTranslations("content");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const org = useOrg();

  const [form, setForm] = React.useState<Form>(() => formFrom(initial, defaultKind));
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const detailQuery = useQuery({
    queryKey: qk.content.detail(initial?.id ?? ""),
    queryFn: () => api.get<AdminContentDetail>(`/admin/content/${initial!.id}`),
    enabled: mode === "edit" && Boolean(initial?.id),
    initialData: initial,
  });
  const item = detailQuery.data ?? initial;

  const channels = useQuery({
    queryKey: ["channels"],
    queryFn: () => api.get<Channel[]>("/feed/channels"),
    enabled: form.kind === "FEED_POST",
    staleTime: 10 * 60 * 1000,
  });

  const scheduledIso = fromLocalInput(form.publishedAt);
  const isFuture = scheduledIso !== null && new Date(scheduledIso) > new Date();

  function onError(error: unknown) {
    const next: Record<string, string> = {};
    if (applyServerIssues(error, (name, err) => (next[name] = err.message))) {
      setFieldErrors(next);
      toast.error(t("fixErrors"));
    } else {
      toast.error(error instanceof ApiError ? error.message : tCommon("error"));
    }
  }

  function afterSave(saved: AdminContentDetail) {
    void queryClient.invalidateQueries({ queryKey: qk.content.all });
    void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.setQueryData(qk.content.detail(saved.id), saved);
    setForm(formFrom(saved, saved.kind));
  }

  const create = useMutation({
    mutationFn: (publish: boolean) => {
      setFieldErrors({});
      const payload: CreateAdminContent = {
        kind: form.kind,
        title: form.title,
        body: form.body || undefined,
        districtId: pickId(form.districtId),
        audience: form.audience,
        isPinned: form.isPinned,
        publishedAt: scheduledIso,
        publish,
        ...(has("channel", form.kind) ? { channelSlug: form.channelSlug as ChannelSlug } : {}),
        ...stripNulls(kindFields(form)),
      };
      return api.post<AdminContentDetail>("/admin/content", payload);
    },
    onSuccess: (saved) => {
      afterSave(saved);
      toast.success(saved.status === "PUBLISHED" ? t("published") : t("saved"));
      router.replace(`/content/${saved.id}`);
    },
    onError,
  });

  const save = useMutation({
    mutationFn: async (thenPublish: boolean) => {
      setFieldErrors({});
      const payload: UpdateAdminContent = {
        title: form.title,
        body: form.body || null,
        districtId: pickId(form.districtId),
        audience: form.audience,
        isPinned: form.isPinned,
        // An emptied date keeps the old one: a published item with no date
        // would silently vanish from the employee app.
        ...(scheduledIso ? { publishedAt: scheduledIso } : {}),
        ...(has("channel", form.kind) ? { channelSlug: form.channelSlug as ChannelSlug } : {}),
        ...kindFields(form),
      };
      const saved = await api.patch<AdminContentDetail>(`/admin/content/${item!.id}`, payload);
      if (!thenPublish) return saved;
      return api.post<AdminContentDetail>(`/admin/content/${item!.id}/publish`);
    },
    onSuccess: (saved, thenPublish) => {
      afterSave(saved);
      toast.success(thenPublish ? t("published") : t("saved"));
    },
    onError,
  });

  const unpublish = useMutation({
    mutationFn: () => api.post<AdminContentDetail>(`/admin/content/${item!.id}/unpublish`),
    onSuccess: (saved) => {
      afterSave(saved);
      toast.success(t("unpublished"));
    },
    onError,
  });

  const archive = useMutation({
    mutationFn: () => api.post<AdminContentDetail>(`/admin/content/${item!.id}/archive`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.content.all });
      toast.success(t("archived"));
      setConfirmArchive(false);
      router.push("/content");
    },
    onError,
  });

  const busy = create.isPending || save.isPending || unpublish.isPending || archive.isPending;
  const k = form.kind;
  const err = (name: string) => fieldErrors[name];
  const scheduled =
    item?.status === "PUBLISHED" && item.publishedAt && new Date(item.publishedAt) > new Date();
  const sessionHref = item && has("session", item.kind)
    ? `/${item.kind === "EVENT" ? "events" : "learning"}?session=${item.id}`
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/content" className="text-sm text-content-muted hover:text-brand">
            {t("backToList")}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-content">
            {mode === "create" ? t("createKind", { kind: t(`kinds.${k}`) }) : (item?.title ?? t("untitled"))}
          </h1>
          {item && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
              {scheduled ? (
                <Badge variant="warning">{t("scheduledFor", { date: formatDate(item.publishedAt!, locale) })}</Badge>
              ) : (
                <Badge variant={item.status === "PUBLISHED" ? "success" : "secondary"}>
                  {t(`status.${item.status}`)}
                </Badge>
              )}
              {item.isPinned && <Badge variant="outline">{t("form.pinned")}</Badge>}
              {item.authorName && (
                <span className="text-sm text-content-muted">{t("byAuthor", { name: item.authorName })}</span>
              )}
            </div>
          )}
        </div>
        {mode === "edit" && item && (
          <div className="flex flex-wrap gap-2">
            {sessionHref && (
              <Button asChild variant="outline">
                <Link href={sessionHref}>{t("registrantsCount", { count: item.registrationCount })}</Link>
              </Button>
            )}
            {item.status === "PUBLISHED" && (
              <Button type="button" variant="outline" onClick={() => unpublish.mutate()} disabled={busy}>
                {t("actions.unpublish")}
              </Button>
            )}
            {item.status !== "ARCHIVED" && (
              <Button type="button" variant="destructive" onClick={() => setConfirmArchive(true)} disabled={busy}>
                {t("actions.archive")}
              </Button>
            )}
          </div>
        )}
      </div>

      <form
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === "create") create.mutate(false);
          else save.mutate(false);
        }}
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("form.details")}</CardTitle>
              <CardDescription>{t(`appearsIn.${k}`)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === "create" && (
                <Field id="kind" label={t("columns.kind")}>
                  <Select value={k} onValueChange={(value) => set("kind", value as ContentKind)}>
                    <SelectTrigger id="kind">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`kinds.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field id="title" label={t("columns.title")} error={err("title")} required>
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} />
              </Field>

              {has("summary", k) && (
                <Field id="summary" label={t("form.summary")} hint={t("form.summaryHint")} error={err("summary")}>
                  <Input id="summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} maxLength={500} />
                </Field>
              )}

              <Field id="body" label={t("form.body")} error={err("body")}>
                <Textarea id="body" value={form.body} onChange={(e) => set("body", e.target.value)} rows={k === "ALERT" ? 4 : 12} />
              </Field>

              {has("image", k) && (
                <Field id="imageUrl" label={t("form.image")} hint={t("form.imageHint")} error={err("imageUrl")}>
                  <ImageField id="imageUrl" value={form.imageUrl} onChange={(value) => set("imageUrl", value)} />
                </Field>
              )}
            </CardContent>
          </Card>

          {(has("alert", k) || has("session", k) || has("career", k) || has("video", k) || has("channel", k)) && (
            <Card>
              <CardHeader>
                <CardTitle>{t(`form.kindCard.${k}`)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {has("channel", k) && (
                  <Field id="channel" label={t("form.channel")} className="sm:col-span-2">
                    <Select value={form.channelSlug} onValueChange={(value) => set("channelSlug", value)}>
                      <SelectTrigger id="channel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(channels.data ?? [{ slug: "organization", nameHe: "ארגון", nameEn: "Organization" } as Channel]).map((channel) => (
                          <SelectItem key={channel.slug} value={channel.slug}>
                            {locale === "en" ? channel.nameEn : channel.nameHe}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {has("alert", k) && (
                  <>
                    <Field id="severity" label={t("form.severity")}>
                      <Select value={form.severity} onValueChange={(value) => set("severity", value as AlertSeverity)}>
                        <SelectTrigger id="severity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITIES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {t(`severity.${value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field id="expiresAt" label={t("form.expiresAt")} hint={t("form.expiresAtHint")} error={err("expiresAt")}>
                      <Input id="expiresAt" type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
                    </Field>
                  </>
                )}

                {has("session", k) && (
                  <>
                    <Field id="startsAt" label={t("form.startsAt")} error={err("startsAt")} required>
                      <Input id="startsAt" type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
                    </Field>
                    {has("event", k) ? (
                      <Field id="endsAt" label={t("form.endsAt")} error={err("endsAt")}>
                        <Input id="endsAt" type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
                      </Field>
                    ) : (
                      <Field id="format" label={t("form.format")} error={err("format")} required>
                        <Select value={form.format} onValueChange={(value) => set("format", value as TrainingFormat)}>
                          <SelectTrigger id="format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMATS.map((value) => (
                              <SelectItem key={value} value={value}>
                                {t(`format.${value}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                    {has("event", k) && (
                      <Field id="location" label={t("form.location")} error={err("location")}>
                        <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} />
                      </Field>
                    )}
                    <Field id="capacity" label={t("form.capacity")} hint={t("form.capacityHint")} error={err("capacity")}>
                      <Input id="capacity" type="number" min={1} inputMode="numeric" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
                    </Field>
                    {has("event", k) && (
                      <SwitchRow id="isOnline" label={t("form.isOnline")} checked={form.isOnline} onChange={(value) => set("isOnline", value)} />
                    )}
                  </>
                )}

                {has("career", k) && (
                  <>
                    <Field id="departmentId" label={t("form.department")}>
                      <Select value={form.departmentId} onValueChange={(value) => set("departmentId", value)}>
                        <SelectTrigger id="departmentId">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>{t("form.noDepartment")}</SelectItem>
                          {org.departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {locale === "en" ? department.nameEn : department.nameHe}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field id="closesAt" label={t("form.closesAt")} error={err("closesAt")}>
                      <Input id="closesAt" type="datetime-local" value={form.closesAt} onChange={(e) => set("closesAt", e.target.value)} />
                    </Field>
                    <SwitchRow id="isInternal" label={t("form.isInternal")} checked={form.isInternal} onChange={(value) => set("isInternal", value)} />
                  </>
                )}

                {has("href", k) && (
                  <Field id="href" label={t(k === "CAREER" ? "form.careerHref" : "form.alertHref")} error={err("href")} className="sm:col-span-2">
                    <Input id="href" dir="ltr" value={form.href} onChange={(e) => set("href", e.target.value)} placeholder="https://" />
                  </Field>
                )}

                {has("video", k) && (
                  <Field id="videoUrl" label={t("form.videoUrl")} error={err("videoUrl")} required={k === "VIDEO"} className="sm:col-span-2">
                    <Input id="videoUrl" dir="ltr" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://" />
                  </Field>
                )}
                {has("videoDetails", k) && (
                  <>
                    <Field id="thumbnailUrl" label={t("form.thumbnail")} className="sm:col-span-2">
                      <ImageField id="thumbnailUrl" value={form.thumbnailUrl} onChange={(value) => set("thumbnailUrl", value)} />
                    </Field>
                    <Field id="durationSeconds" label={t("form.duration")} error={err("durationSeconds")}>
                      <Input id="durationSeconds" type="number" min={0} inputMode="numeric" value={form.durationSeconds} onChange={(e) => set("durationSeconds", e.target.value)} />
                    </Field>
                    <SwitchRow id="isVideoOfWeek" label={t("form.videoOfWeek")} checked={form.isVideoOfWeek} onChange={(value) => set("isVideoOfWeek", value)} />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("form.audience")}</CardTitle>
              <CardDescription>{t("form.audienceHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AudiencePicker value={form.audience} onChange={(value) => set("audience", value)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>{t("form.publishing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="publishedAt" label={t("form.publishAt")} hint={t("form.publishAtHint")} error={err("publishedAt")}>
                <Input id="publishedAt" type="datetime-local" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
              </Field>

              <Field id="districtId" label={t("columns.district")} hint={t("form.districtHint")}>
                <Select value={form.districtId} onValueChange={(value) => set("districtId", value)}>
                  <SelectTrigger id="districtId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("ministryWide")}</SelectItem>
                    {org.districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {locale === "en" ? district.nameEn : district.nameHe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <SwitchRow id="isPinned" label={t("form.pin")} hint={t("form.pinHint")} checked={form.isPinned} onChange={(value) => set("isPinned", value)} />

              <div className="flex flex-col gap-2 border-t border-line pt-4">
                {mode === "create" ? (
                  <>
                    <Button type="button" disabled={busy || !form.title.trim()} onClick={() => create.mutate(true)}>
                      {isFuture ? t("actions.schedule") : t("actions.publishNow")}
                    </Button>
                    <Button type="submit" variant="outline" disabled={busy || !form.title.trim()}>
                      {t("actions.saveDraft")}
                    </Button>
                  </>
                ) : (
                  <>
                    {item?.status !== "PUBLISHED" && (
                      <Button type="button" disabled={busy || !form.title.trim()} onClick={() => save.mutate(true)}>
                        {isFuture ? t("actions.saveAndSchedule") : t("actions.saveAndPublish")}
                      </Button>
                    )}
                    <Button type="submit" variant={item?.status === "PUBLISHED" ? "default" : "outline"} disabled={busy || !form.title.trim()}>
                      {tCommon("save")}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={t("confirmArchiveTitle")}
        description={t("confirmArchiveOne")}
        confirmLabel={t("actions.archive")}
        cancelLabel={tCommon("cancel")}
        destructive
        pending={archive.isPending}
        onConfirm={() => archive.mutate()}
      />
    </div>
  );
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 self-end">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-content">
          {label}
        </label>
        {hint && <p className="text-xs text-content-muted">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** Create treats a missing field as "use the default"; a null would be read as a value. */
function stripNulls<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>;
}

function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
