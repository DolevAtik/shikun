"use client";

import {
  type Colleague,
  type EmployeeProgress,
  type PeerBadge,
  PeerBadgeSchema,
  RECOGNITION_REASON_MAX,
  RECOGNITION_REASON_MIN,
} from "@moch/contracts";
import { Avatar, Button, cn } from "@moch/ui";
import { Medal, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { Sheet } from "./Sheet";

/** The house colors of the Ministry logo, the same the badges use everywhere else. */
export const PEER_BADGE_COLOR: Record<PeerBadge, string> = {
  COMMUNITY_CONTRIBUTOR: "var(--accent-blue)",
  INNOVATION_CHAMPION: "var(--accent-violet)",
  KNOWLEDGE_SHARER: "var(--accent-teal)",
  DISTRICT_AMBASSADOR: "var(--accent-green)",
  VOLUNTEER: "var(--accent-red)",
  MENTOR: "var(--accent-amber)",
};

interface GiveRecognitionSheetProps {
  open: boolean;
  giving: EmployeeProgress["giving"];
  onClose: () => void;
  onGiven: (progress: EmployeeProgress, recipientName: string) => void;
}

/**
 * Thank a colleague: who, which badge, and why, in their words. It shows up
 * in the colleague's world and on the recognition wall on Home. No XP, for
 * either side — that is what keeps it a thank-you.
 */
export function GiveRecognitionSheet({ open, giving, onClose, onGiven }: GiveRecognitionSheetProps) {
  const t = useTranslations("myWorld");
  const ids = { search: useId(), reason: useId(), count: useId(), badges: useId(), people: useId() };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Colleague[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [recipient, setRecipient] = useState<Colleague | null>(null);
  const [badge, setBadge] = useState<PeerBadge | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setRecipient(null);
    setBadge(null);
    setReason("");
    setError(null);
    setPending(false);
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let live = true;
    setSearching(true);
    const timer = window.setTimeout(() => {
      clientFetch<Colleague[]>(`/me/colleagues?q=${encodeURIComponent(term)}`)
        .then((rows) => {
          if (!live) return;
          setResults(rows);
          setSearchFailed(false);
        })
        .catch(() => live && setSearchFailed(true))
        .finally(() => live && setSearching(false));
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const left = Math.max(0, giving.limit - giving.used);
  const length = reason.trim().length;
  const valid = recipient !== null && badge !== null && length >= RECOGNITION_REASON_MIN && length <= RECOGNITION_REASON_MAX;

  const submit = async () => {
    if (!valid || !recipient || !badge) return;
    setPending(true);
    setError(null);
    try {
      const progress = await clientFetch<EmployeeProgress>("/me/recognitions", {
        method: "POST",
        body: JSON.stringify({ recipientId: recipient.id, badge, reason: reason.trim() }),
      });
      onGiven(progress, recipient.fullName);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setPending(false);
    }
  };

  return (
    <Sheet open={open} title={t("give.title")} onClose={onClose}>
      {left === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-surface-tint px-3 py-3 text-sm text-content">{t("give.none")}</p>
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <p className="text-sm text-content-muted">{t("give.intro", { left })}</p>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold text-content">{t("give.who")}</legend>
            {recipient ? (
              <div className="flex items-start gap-3 rounded-lg border border-brand bg-brand-soft px-3 py-3">
                <Avatar name={recipient.fullName} initials={recipient.initials} src={recipient.avatarUrl} size="md" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-content">{recipient.fullName}</p>
                  <p className="text-content-muted">{[recipient.title, recipient.departmentName].filter(Boolean).join(" · ")}</p>
                  {recipient.bio ? <p className="mt-1.5 line-clamp-3 text-content">{recipient.bio}</p> : null}
                </div>
                <Button type="button" variant="ghost" onClick={() => setRecipient(null)}>
                  {t("give.change")}
                </Button>
              </div>
            ) : (
              <>
                <label htmlFor={ids.search} className="sr-only">
                  {t("give.searchLabel")}
                </label>
                <div className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
                  <input
                    id={ids.search}
                    type="search"
                    autoComplete="off"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("give.searchPlaceholder")}
                    aria-describedby={ids.people}
                    className="h-11 w-full rounded-md border border-line-strong bg-surface ps-9 pe-3 text-base text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:shadow-focus"
                  />
                </div>
                <div id={ids.people} aria-live="polite">
                  {searching ? <p className="px-1 text-sm text-content-muted">{t("give.searching")}</p> : null}
                  {!searching && searchFailed ? <p className="px-1 text-sm text-danger">{t("give.searchError")}</p> : null}
                  {!searching && !searchFailed && query.trim().length >= 2 && results.length === 0 ? (
                    <p className="px-1 text-sm text-content-muted">{t("give.noResults")}</p>
                  ) : null}
                </div>
                {results.length > 0 ? (
                  <ul className="flex max-h-64 flex-col divide-y divide-line overflow-y-auto rounded-lg border border-line">
                    {results.map((colleague) => (
                      <li key={colleague.id}>
                        <button
                          type="button"
                          onClick={() => setRecipient(colleague)}
                          className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-start hover:bg-surface-tint focus-visible:outline-none focus-visible:shadow-focus"
                        >
                          <Avatar name={colleague.fullName} initials={colleague.initials} src={colleague.avatarUrl} size="sm" />
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="block font-medium text-content">{colleague.fullName}</span>
                            <span className="block truncate text-content-muted">
                              {[colleague.title, colleague.departmentName].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </fieldset>

          <fieldset>
            <legend id={ids.badges} className="mb-2 text-sm font-semibold text-content">
              {t("give.badge")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {PeerBadgeSchema.options.map((key) => (
                <label
                  key={key}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:shadow-focus",
                    badge === key ? "border-brand bg-brand-soft font-semibold text-content" : "border-line text-content",
                  )}
                >
                  <input
                    type="radio"
                    name="badge"
                    value={key}
                    checked={badge === key}
                    onChange={() => setBadge(key)}
                    className="sr-only"
                  />
                  <Medal aria-hidden="true" className="size-4 shrink-0" style={{ color: PEER_BADGE_COLOR[key] }} />
                  {t(`give.badges.${key}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={ids.reason} className="mb-2 block text-sm font-semibold text-content">
              {t("give.reason")}
            </label>
            <textarea
              id={ids.reason}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={RECOGNITION_REASON_MAX}
              rows={3}
              aria-describedby={ids.count}
              placeholder={t("give.reasonPlaceholder")}
              className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-base text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:shadow-focus"
            />
            <p id={ids.count} className="mt-1 flex justify-between gap-2 text-xs text-content-muted">
              <span>{length < RECOGNITION_REASON_MIN ? t("give.reasonMin", { count: RECOGNITION_REASON_MIN }) : t("give.reasonNote")}</span>
              <span dir="ltr">
                {length}/{RECOGNITION_REASON_MAX}
              </span>
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {t("give.error", { message: error })}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" isLoading={pending} disabled={!valid || pending}>
            {pending ? t("give.sending") : t("give.send")}
          </Button>
          <p className="text-center text-xs text-content-muted">{t("give.noXp")}</p>
        </form>
      )}
    </Sheet>
  );
}
