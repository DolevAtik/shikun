"use client";

import type { EmployeeProgress, EmployeeWorld, Mission, WorldFocus } from "@moch/contracts";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { AchievementSection } from "./AchievementSection";
import { DepartmentQuest } from "./DepartmentQuest";
import { DetailSheet } from "./DetailSheet";
import { getMyWorldFlags } from "./flags";
import { JourneySection } from "./JourneySection";
import { LevelUpDialog } from "./LevelUpDialog";
import { MissionSection, type RegisteredNotice } from "./MissionSection";
import { MyWorldHero } from "./MyWorldHero";
import { OverallProgress } from "./OverallProgress";
import { orderMissions } from "./progress";
import { RecognitionSection } from "./RecognitionSection";
import { RegisterSheet } from "./RegisterSheet";
import type { Detail, MyWorldProfile } from "./types";
import { UnlockSection } from "./UnlockSection";

/** What this browser last saw, so a return visit can show what moved. Best effort only. */
const SEEN_KEY = "moch:my-world:seen";

interface Seen {
  total: number;
  level: number;
}

function readSeen(): Seen | null {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Seen>;
    return typeof parsed.total === "number" && typeof parsed.level === "number" ? { total: parsed.total, level: parsed.level } : null;
  } catch {
    return null;
  }
}

function writeSeen(progress: EmployeeProgress) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify({ total: progress.level.total, level: progress.level.level }));
  } catch {
    // Private mode or blocked storage: the screen works the same, it just can't say "since last visit".
  }
}

export function MyWorldExperience({ profile, initial }: { profile: MyWorldProfile; initial: EmployeeProgress }) {
  const t = useTranslations("myWorld");
  const flags = getMyWorldFlags();
  const [progress, setProgress] = useState(initial);
  const [chosen, setChosen] = useState<WorldFocus | null>(initial.chosenWorld);
  const [focusError, setFocusError] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const [sinceLastVisit, setSinceLastVisit] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [notice, setNotice] = useState<RegisteredNotice | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const gainTimer = useRef<number | null>(null);

  // A return after reading a post elsewhere: say what moved, and celebrate a level crossed while away.
  useEffect(() => {
    const seen = readSeen();
    if (seen && initial.level.total > seen.total) {
      setSinceLastVisit(initial.level.total - seen.total);
      if (initial.level.level > seen.level) setCelebration(initial.level.level);
    }
    writeSeen(initial);
  }, [initial]);

  useEffect(
    () => () => {
      if (gainTimer.current) window.clearTimeout(gainTimer.current);
    },
    [],
  );

  const onRegistered = (next: EmployeeProgress, mission: Mission) => {
    const gained = next.level.total - progress.level.total;
    setProgress(next);
    setDetail(null);
    writeSeen(next);
    setNotice({ title: mission.title, xp: gained > 0 ? gained : mission.xp, world: mission.world });
    if (gained > 0) {
      setGain(gained);
      setAnnouncement(t("xpLive", { xp: gained, current: next.level.current, next: next.level.next, level: next.level.level }));
      if (gainTimer.current) window.clearTimeout(gainTimer.current);
      gainTimer.current = window.setTimeout(() => setGain(null), 1600);
    }
    if (next.level.level > progress.level.level) setCelebration(next.level.level);
  };

  const choose = (world: WorldFocus | null) => {
    const previous = chosen;
    setChosen(world);
    setFocusError(false);
    clientFetch<EmployeeWorld>("/me/world", { method: "PATCH", body: JSON.stringify({ chosenWorld: world }) }).catch(() => {
      setChosen(previous);
      setFocusError(true);
    });
  };

  const openRegister = (mission: Mission) => setDetail({ kind: "register", mission });
  const missions = orderMissions(progress.missions, chosen);
  const celebrated = celebration === null ? null : (progress.unlocks.find((unlock) => unlock.level === celebration) ?? null);

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <MyWorldHero
        profile={profile}
        progress={progress}
        gain={gain}
        sinceLastVisit={sinceLastVisit}
        onOpen={setDetail}
        onRegister={openRegister}
      />
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
      {flags.showRecognition ? <RecognitionSection items={progress.recognitions} onOpen={setDetail} /> : null}
      {flags.showDepartment ? <DepartmentQuest department={progress.department} onOpen={setDetail} /> : null}
      {flags.showUnlocks ? <UnlockSection items={progress.unlocks} total={progress.level.total} onOpen={setDetail} /> : null}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <DetailSheet detail={detail} progress={progress} onClose={() => setDetail(null)} />
      <RegisterSheet
        mission={detail?.kind === "register" ? detail.mission : null}
        onClose={() => setDetail(null)}
        onRegistered={onRegistered}
      />
      <LevelUpDialog level={celebration} unlock={celebrated} onClose={() => setCelebration(null)} />
    </div>
  );
}
