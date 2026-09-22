"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AchievementsSection } from "./AchievementsSection";
import { applyMissionCompletion } from "./apply-completion";
import { DepartmentProgress } from "./DepartmentProgress";
import { JourneySection } from "./JourneySection";
import { LevelUpDialog } from "./LevelUpDialog";
import { MissionSection } from "./MissionSection";
import { MyWorldHero } from "./MyWorldHero";
import { OverallProgress } from "./OverallProgress";
import { usePrefersReducedMotion } from "./motion";
import { RecognitionSection } from "./RecognitionSection";
import type { EmployeeGamification, ProgressSnapshot } from "./types";
import { UnlocksSection } from "./UnlocksSection";

export function MyWorldExperience({ initial }: { initial: EmployeeGamification }) {
  const t = useTranslations("myWorld");
  const reduced = usePrefersReducedMotion();
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>({
    xp: initial.xp,
    missions: initial.missions,
    journeys: initial.journeys,
    stats: initial.stats,
    department: initial.department,
  });
  const [gain, setGain] = useState<{ id: string; amount: number } | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const gainTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (gainTimer.current) window.clearTimeout(gainTimer.current);
    };
  }, []);

  const complete = (id: string) => {
    const result = applyMissionCompletion(snapshot, id);
    if (!result) return;
    setSnapshot(result.snapshot);
    setGain({ id, amount: result.xpGained });
    setAnnouncement(
      t("xpLive", {
        xp: result.xpGained,
        current: result.snapshot.xp.current,
        next: result.snapshot.xp.next,
      }),
    );
    if (result.leveledUpTo) setCelebration(result.leveledUpTo);
    if (gainTimer.current) window.clearTimeout(gainTimer.current);
    gainTimer.current = window.setTimeout(() => setGain(null), 1600);
  };

  const { flags } = initial;
  const upcoming = initial.unlocks.filter((unlock) => unlock.level > snapshot.xp.level).slice(0, 4);
  const nextUnlock = upcoming[0] ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <MyWorldHero profile={initial.profile} xp={snapshot.xp} gain={gain?.amount ?? null} nextUnlock={nextUnlock} />

      {flags.showOverallProgress ? <OverallProgress stats={snapshot.stats} /> : null}
      {flags.showMissions ? (
        <MissionSection
          missions={snapshot.missions}
          gainId={gain?.id ?? null}
          reducedMotion={reduced}
          onComplete={complete}
        />
      ) : null}
      {flags.showJourney ? <JourneySection journeys={snapshot.journeys} /> : null}
      {flags.showAchievements ? <AchievementsSection items={initial.achievements} /> : null}
      {flags.showRecognition ? <RecognitionSection items={initial.recognitions} /> : null}
      {flags.showDepartmentProgress && snapshot.department ? (
        <DepartmentProgress department={snapshot.department} />
      ) : null}
      {flags.showUnlocks ? <UnlocksSection items={upcoming} /> : null}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <LevelUpDialog level={celebration} onClose={() => setCelebration(null)} />
    </div>
  );
}
