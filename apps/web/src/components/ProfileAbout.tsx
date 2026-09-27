"use client";

import { PROFILE_BIO_MIN, type ProfileResult } from "@moch/contracts";
import { Button, Card } from "@moch/ui";
import { CheckCircle2, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { xpText } from "@/components/my-world/progress";
import { useRouter } from "@/i18n/routing";
import { clientFetch } from "@/lib/client-api";

const BIO_MAX = 500;

/**
 * A few words about me, written by me. Colleagues see it when they thank me,
 * so they know who they are writing to. The first introduction long enough to
 * say something is an act in העולם שלי; clearing it takes the act away.
 */
export function ProfileAbout({ bio, phone }: { bio: string | null; phone: string | null }) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const ids = { bio: useId(), phone: useId(), hint: useId() };
  const [editing, setEditing] = useState(false);
  const [draftBio, setDraftBio] = useState(bio ?? "");
  const [draftPhone, setDraftPhone] = useState(phone ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const length = draftBio.trim().length;

  const save = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await clientFetch<ProfileResult>("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ bio: draftBio.trim() || null, phone: draftPhone.trim() || null }),
      });
      setEditing(false);
      setSaved(result.xp ? t("aboutSavedXp", { xp: xpText(result.xp, locale, true) }) : t("aboutSaved"));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <section id="about" className="scroll-mt-20">
      <div role="status" aria-live="polite">
        {saved ? (
          <p className="mb-2 flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm font-semibold text-success">
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
            {saved}
          </p>
        ) : null}
      </div>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="pt-2 text-base font-semibold text-content">{t("about")}</h2>
          {editing ? null : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraftBio(bio ?? "");
                setDraftPhone(phone ?? "");
                setSaved(null);
                setEditing(true);
              }}
            >
              <Pencil aria-hidden="true" className="size-4" />
              {bio ? t("aboutEdit") : t("aboutWrite")}
            </Button>
          )}
        </div>

        {editing ? (
          <form
            className="mt-3 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div>
              <label htmlFor={ids.bio} className="mb-1.5 block text-sm font-medium text-content">
                {t("aboutBio")}
              </label>
              <textarea
                id={ids.bio}
                value={draftBio}
                onChange={(event) => setDraftBio(event.target.value)}
                maxLength={BIO_MAX}
                rows={4}
                aria-describedby={ids.hint}
                placeholder={t("aboutPlaceholder")}
                className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-base text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:shadow-focus"
              />
              <p id={ids.hint} className="mt-1 flex justify-between gap-2 text-xs text-content-muted">
                <span>{length < PROFILE_BIO_MIN ? t("aboutMin", { count: PROFILE_BIO_MIN }) : t("aboutEnough")}</span>
                <span dir="ltr">
                  {length}/{BIO_MAX}
                </span>
              </p>
            </div>
            <div>
              <label htmlFor={ids.phone} className="mb-1.5 block text-sm font-medium text-content">
                {t("aboutPhone")}
              </label>
              <input
                id={ids.phone}
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                value={draftPhone}
                maxLength={20}
                onChange={(event) => setDraftPhone(event.target.value)}
                className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-content focus-visible:outline-none focus-visible:shadow-focus rtl:text-end"
              />
            </div>
            {error ? (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
                {t("aboutError", { message: error })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" isLoading={pending}>
                {t("aboutSave")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={pending}>
                {t("aboutCancel")}
              </Button>
            </div>
          </form>
        ) : bio ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-content">{bio}</p>
        ) : (
          <p className="mt-2 text-sm text-content-muted">{t("aboutEmpty")}</p>
        )}
      </Card>
    </section>
  );
}
