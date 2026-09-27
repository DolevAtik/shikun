"use client";

import type { AvatarStyle, Booking, EmployeeProgress, EmployeeWorld, Mission, MonthlyRecap, WorldFocus } from "@moch/contracts";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { track } from "@/lib/telemetry";
import { AchievementSection } from "./AchievementSection";
import { BookingsSection } from "./BookingsSection";
import { DepartmentQuest } from "./DepartmentQuest";
import { DetailSheet } from "./DetailSheet";
import { getMyWorldFlags } from "./flags";
import { GiveRecognitionSheet } from "./GiveRecognitionSheet";
import { JourneySection } from "./JourneySection";
import { LevelUpDialog } from "./LevelUpDialog";
import { MissionSection, type RegisteredNotice } from "./MissionSection";
import { MyWorldHero } from "./MyWorldHero";
import { OverallProgress } from "./OverallProgress";
import { orderMissions, xpText } from "./progress";
import { RecapSection } from "./RecapSection";
import { RecognitionSection } from "./RecognitionSection";
import { RegisterSheet } from "./RegisterSheet";
import type { Detail, MyWorldProfile } from "./types";
import { UnlockSection } from "./UnlockSection";

/** What this browser last saw, so a return visit can show what moved. Best effort only. */
const SEEN_KEY = "moch:my-world:seen";

interface Seen {
  total: number;
  level: number;
  /** Newest recognition received, as an ISO time. */
  recognitionAt: string | null;
}

function readSeen(): Seen | null {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Seen>;
    return typeof parsed.total === "number" && typeof parsed.level === "number"
      ? { total: parsed.total, level: parsed.level, recognitionAt: typeof parsed.recognitionAt === "string" ? parsed.recognitionAt : null }
      : null;
  } catch {
    return null;
  }
}

function writeSeen(progress: EmployeeProgress) {
  try {
    const seen: Seen = {
      total: progress.level.total,
      level: progress.level.level,
      recognitionAt: progress.recognitions[0]?.awardedAt ?? null,
    };
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Private mode or blocked storage: the screen works the same, it just can't say "since last visit".
  }
}

interface MyWorldExperienceProps {
  profile: MyWorldProfile;
  initial: EmployeeProgress;
  /** This month's recap; null when it could not be loaded, and the section stays out. */
  recap: MonthlyRecap | null;
}

export function MyWorldExperience({ profile, initial, recap }: MyWorldExperienceProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const flags = getMyWorldFlags();
  const [progress, setProgress] = useState(initial);
  const [chosen, setChosen] = useState<WorldFocus | null>(initial.chosenWorld);
  const [focusError, setFocusError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const [sinceLastVisit, setSinceLastVisit] = useState<number | null>(null);
  const [newRecognitions, setNewRecognitions] = useState(0);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [notice, setNotice] = useState<RegisteredNotice | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const gainTimer = useRef<number | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // A return after reading a post elsewhere: say what moved, and celebrate a level crossed while away.
  useEffect(() => {
    const seen = readSeen();
    if (seen && initial.level.total > seen.total) {
      setSinceLastVisit(initial.level.total - seen.total);
      if (initial.level.level > seen.level) setCelebration(initial.level.level);
    }
    if (seen) {
      setNewRecognitions(
        initial.recognitions.filter((item) => seen.recognitionAt === null || item.awardedAt > seen.recognitionAt).length,
      );
    }
    writeSeen(initial);
  }, [initial]);

  useEffect(
    () => () => {
      if (gainTimer.current) window.clearTimeout(gainTimer.current);
    },
    [],
  );

  /** Every write answers with the new progress. Move the bar, say it, and celebrate a level crossed. */
  const apply = (next: EmployeeProgress): number => {
    const before = progressRef.current;
    const gained = next.level.total - before.level.total;
    setProgress(next);
    writeSeen(next);
    if (gained > 0) {
      setGain(gained);
      setAnnouncement(t("xpLive", { xp: gained, current: next.level.current, next: next.level.next, level: next.level.level }));
      if (gainTimer.current) window.clearTimeout(gainTimer.current);
      gainTimer.current = window.setTimeout(() => setGain(null), 1600);
    }
    if (next.level.level > before.level.level) setCelebration(next.level.level);
    return gained;
  };

  const onRegistered = (next: EmployeeProgress, mission: Mission) => {
    const gained = apply(next);
    setDetail(null);
    setNotice({ title: mission.title, xp: gained > 0 ? gained : mission.xp, world: mission.world });
  };

  const onAnswered = (next: EmployeeProgress, booking: Booking, attended: boolean) => {
    const gained = apply(next);
    setFlash(
      attended
        ? t("bookings.thanksAttended", { title: booking.title, xp: xpText(gained > 0 ? gained : booking.attendXp, locale, true) })
        : t("bookings.thanksMissed", { title: booking.title }),
    );
  };

  const onGiven = (next: EmployeeProgress, name: string) => {
    setProgress(next);
    setDetail(null);
    setSent(t("give.sent", { name }));
  };

  const choose = (world: WorldFocus | null) => {
    const previous = chosen;
    setChosen(world);
    setFocusError(false);
    track("world.focus", { props: { world } });
    clientFetch<EmployeeWorld>("/me/world", { method: "PATCH", body: JSON.stringify({ chosenWorld: world }) }).catch(() => {
      setChosen(previous);
      setFocusError(true);
    });
  };

  const changeAvatar = (patch: Partial<AvatarStyle>) => {
    const previous = progressRef.current.avatar;
    setAvatarError(false);
    setProgress((current) => ({ ...current, avatar: { ...current.avatar, ...patch } }));
    const body = {
      ...(patch.backdrop ? { avatarBackdrop: patch.backdrop } : {}),
      ...(patch.outfit ? { avatarOutfit: patch.outfit } : {}),
    };
    clientFetch<EmployeeWorld>("/me/world", { method: "PATCH", body: JSON.stringify(body) }).catch(() => {
      setProgress((current) => ({ ...current, avatar: previous }));
      setAvatarError(true);
    });
  };

  const openRegister = (mission: Mission) => setDetail({ kind: "register", mission });
  const missions = orderMissions(progress.missions, chosen);
  const celebrated = celebration === null ? null : (progress.unlocks.find((unlock) => unlock.level === celebration) ?? null);

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <div className="flex flex-col gap-4">
        <MyWorldHero
          profile={profile}
          progress={progress}
          gain={gain}
          sinceLastVisit={sinceLastVisit}
          newRecognitions={newRecognitions}
          onOpen={setDetail}
          onRegister={openRegister}
        />
        <div role="status" aria-live="polite">
          {flash ? (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm font-semibold text-success">
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
              {flash}
            </p>
          ) : null}
        </div>
      </div>
      {flags.showBookings ? <BookingsSection bookings={progress.bookings} onAnswered={onAnswered} /> : null}
      {flags.showStats ? <OverallProgress progress={progress} /> : null}
      {flags.showMissions ? <MissionSection missions={missions} notice={notice} onRegister={openRegister} /> : null}
      {flags.showJourney ? (
        <JourneySection
          progress={progress}
          chosen={chosen}
          showFocus={flags.showFocus}
          focusError={focusError}
          onChoose={choose}
          onOpen={setDetail}
        />
      ) : null}
      {flags.showAchievements ? <AchievementSection items={progress.achievements} onOpen={setDetail} /> : null}
      {flags.showRecognition ? (
        <RecognitionSection items={progress.recognitions} giving={progress.giving} sent={sent} onOpen={setDetail} />
      ) : null}
      {flags.showDepartment ? <DepartmentQuest department={progress.department} onOpen={setDetail} /> : null}
      {flags.showRecap && recap ? <RecapSection initial={recap} /> : null}
      {flags.showUnlocks ? (
        <UnlockSection items={progress.unlocks} total={progress.level.total} style={progress.avatar} onOpen={setDetail} />
      ) : null}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <DetailSheet
        detail={detail}
        progress={progress}
        onAvatarChange={changeAvatar}
        avatarError={avatarError}
        onClose={() => setDetail(null)}
      />
      <RegisterSheet
        mission={detail?.kind === "register" ? detail.mission : null}
        onClose={() => setDetail(null)}
        onRegistered={onRegistered}
      />
      <GiveRecognitionSheet open={detail?.kind === "give"} giving={progress.giving} onClose={() => setDetail(null)} onGiven={onGiven} />
      <LevelUpDialog level={celebration} unlock={celebrated} style={progress.avatar} onClose={() => setCelebration(null)} />
    </div>
  );
}
