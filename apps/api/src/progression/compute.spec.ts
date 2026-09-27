import { describe, expect, it } from "vitest";
import { type Act, anniversary, compute, currentStreak, departmentHistory, monthsBack, recapCounts } from "./compute";
import { levelFor, readMinutes, RULES, worldForChannel, xpForLevel } from "./rules";

const NOW = new Date("2026-09-24T10:00:00Z"); // Thursday in Jerusalem

function act(daysAgo: number, overrides: Partial<Act> = {}): Act {
  const at = new Date(NOW);
  at.setUTCDate(at.getUTCDate() - daysAgo);
  return { contentItemId: `c${daysAgo}-${Math.random()}`, act: "read", world: "know", xp: 20, at, ...overrides };
}

describe("level curve", () => {
  it("starts at level 1 with nothing earned", () => {
    expect(levelFor(0)).toEqual({ level: 1, current: 0, next: 100, total: 0 });
  });

  it("each level costs 20 more than the last", () => {
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(220);
    expect(xpForLevel(5)).toBe(520);
    expect(levelFor(140)).toEqual({ level: 2, current: 40, next: 120, total: 140 });
  });
});

describe("streak", () => {
  it("is alive until today ends, even with nothing today", () => {
    expect(currentStreak(new Set(["2026-09-23", "2026-09-22"]), "2026-09-24")).toEqual({ days: 2, graceUsed: false });
  });

  it("forgives one missing day and no more", () => {
    const days = new Set(["2026-09-24", "2026-09-22", "2026-09-21", "2026-09-19"]);
    expect(currentStreak(days, "2026-09-24")).toEqual({ days: 3, graceUsed: true });
  });

  it("is zero after two quiet days", () => {
    expect(currentStreak(new Set(["2026-09-20"]), "2026-09-24").days).toBe(0);
  });
});

describe("compute", () => {
  it("grants nothing without acts", () => {
    const result = compute([], NOW);
    expect(result.level.total).toBe(0);
    expect(result.achievements.every((item) => item.unlockedAt === null)).toBe(true);
  });

  it("unlocks achievements at the act that crossed the threshold", () => {
    const acts = [act(5), act(4), act(3), act(2), act(1)];
    const result = compute(acts, NOW);
    const reader = result.achievements.find((item) => item.id === "reader")!;
    expect(reader.unlockedAt).toBe(acts[4]!.at.toISOString());
    expect(result.achievements.find((item) => item.id === "firstStep")!.unlockedAt).toBe(acts[0]!.at.toISOString());
  });

  it("counts only this week's acts on the weekly card, capped", () => {
    // Sunday 2026-09-20 opens the week.
    const result = compute([act(0), act(1), act(2), act(3), act(6)], NOW);
    expect(result.weeklyFilled).toBe(3);
  });

  it("puts each act in its world", () => {
    const result = compute([act(1, { world: "feel" }), act(1, { act: "training", world: "develop", xp: 40 })], NOW);
    expect(result.worlds.find((world) => world.id === "feel")).toMatchObject({ xp: 20, acts: 1, milestone: 5 });
    expect(result.worlds.find((world) => world.id === "develop")).toMatchObject({ xp: 40, acts: 1 });
  });
});

describe("rules", () => {
  it("maps channels to worlds, defaulting to Know", () => {
    expect(worldForChannel("people")).toBe("feel");
    expect(worldForChannel("learning")).toBe("develop");
    expect(worldForChannel("projects")).toBe("know");
  });

  it("never estimates a read at zero minutes", () => {
    expect(readMinutes("")).toBe(1);
    expect(readMinutes(Array(450).fill("מילה").join(" "))).toBe(3);
  });
});

describe("attendance", () => {
  it("opens learner and participant on being there, not on signing up", () => {
    const registered = compute(
      [act(3, { act: "training", world: "develop", xp: 10 }), act(2, { act: "event", world: "participate", xp: 10 })],
      NOW,
    );
    expect(registered.achievements.find((item) => item.id === "learner")!.unlockedAt).toBeNull();

    const attended = act(1, { act: "trainingAttended", world: "develop", xp: 30 });
    const result = compute([act(3, { act: "training", world: "develop", xp: 10 }), attended], NOW);
    expect(result.achievements.find((item) => item.id === "learner")!.unlockedAt).toBe(attended.at.toISOString());
    expect(result.level.total).toBe(40);
  });

  it("gives a session most of its XP for attending", () => {
    expect(RULES.xp.trainingAttended).toBeGreaterThan(RULES.xp.training);
    expect(RULES.xp.eventAttended).toBeGreaterThan(RULES.xp.event);
  });
});

describe("unlocks", () => {
  it("opens something every two or three levels", () => {
    const levels = RULES.unlocks.map((unlock) => unlock.level);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index]! - levels[index - 1]!).toBeLessThanOrEqual(3);
    }
    expect(levels[0]).toBeLessThanOrEqual(3);
  });
});

describe("monthly recap", () => {
  const at = (iso: string, overrides: Partial<Act> = {}): Act => ({
    contentItemId: `c-${iso}-${Math.random()}`,
    act: "read",
    world: "know",
    xp: 20,
    at: new Date(iso),
    ...overrides,
  });

  it("counts only the month, and starts the level from what came before", () => {
    const acts = [
      at("2026-08-10T09:00:00Z"),
      at("2026-08-11T09:00:00Z"),
      at("2026-08-12T09:00:00Z"),
      at("2026-08-13T09:00:00Z"),
      at("2026-08-14T09:00:00Z"),
      at("2026-09-02T09:00:00Z", { act: "training", world: "develop", xp: 10 }),
      at("2026-09-03T09:00:00Z", { world: "feel" }),
      at("2026-09-03T15:00:00Z", { world: "feel" }),
    ];
    const recap = recapCounts(acts, "2026-09", NOW);
    expect(recap.xp).toBe(50);
    expect(recap.acts.read).toBe(2);
    expect(recap.acts.training).toBe(1);
    expect(recap.activeDays).toBe(2);
    expect(recap.topWorld).toBe("feel");
    expect(recap.levelStart).toBe(2);
    expect(recap.levelEnd).toBe(2);
    // "reader" opened on the fifth read, in August.
    expect(recap.achievements).not.toContain("reader");
    expect(recapCounts(acts, "2026-08", NOW).achievements).toEqual(expect.arrayContaining(["firstStep", "reader"]));
  });

  it("uses the Jerusalem calendar at a month edge", () => {
    // 22:30 UTC on 31 August is 1 September in Jerusalem.
    const recap = recapCounts([at("2026-08-31T22:30:00Z")], "2026-09", NOW);
    expect(recap.acts.read).toBe(1);
  });

  it("lists months across a year boundary", () => {
    expect(monthsBack("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("department history", () => {
  it("buckets by month and counts the run of reached months ending last month", () => {
    const acts: Act[] = [
      { contentItemId: "a", act: "read", world: "know", xp: 100, at: new Date("2026-06-10T09:00:00Z") },
      { contentItemId: "b", act: "read", world: "know", xp: 100, at: new Date("2026-07-10T09:00:00Z") },
      { contentItemId: "c", act: "read", world: "know", xp: 100, at: new Date("2026-08-10T09:00:00Z") },
      { contentItemId: "d", act: "read", world: "know", xp: 500, at: new Date("2026-09-10T09:00:00Z") },
    ];
    const { history, reachedRun } = departmentHistory(acts, "2026-09", 100, 5);
    expect(history.map((month) => month.month)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]);
    expect(history.map((month) => month.reached)).toEqual([false, false, true, true, true]);
    expect(reachedRun).toBe(3);
  });

  it("never counts a month as reached against a zero target", () => {
    expect(departmentHistory([], "2026-09", 0, 2).history.every((month) => !month.reached)).toBe(true);
  });
});

describe("work anniversary", () => {
  it("shows from three days before to a week after", () => {
    expect(anniversary(new Date("2019-09-27T08:00:00Z"), NOW)).toEqual({ kind: "anniversary", years: 7, date: "2026-09-27" });
    expect(anniversary(new Date("2019-09-17T08:00:00Z"), NOW)).toEqual({ kind: "anniversary", years: 7, date: "2026-09-17" });
    expect(anniversary(new Date("2019-09-16T08:00:00Z"), NOW)).toBeNull();
    expect(anniversary(new Date("2019-09-28T08:00:00Z"), NOW)).toBeNull();
  });

  it("waits for the first full year", () => {
    expect(anniversary(new Date("2026-09-20T08:00:00Z"), NOW)).toBeNull();
    expect(anniversary(null, NOW)).toBeNull();
  });

  it("wraps across the new year", () => {
    const newYear = new Date("2027-01-02T10:00:00Z");
    expect(anniversary(new Date("2020-12-30T08:00:00Z"), newYear)).toEqual({ kind: "anniversary", years: 6, date: "2026-12-30" });
  });

  it("moves 29 February to the 28th in a common year", () => {
    expect(anniversary(new Date("2024-02-29T08:00:00Z"), new Date("2027-02-28T10:00:00Z"))).toEqual({
      kind: "anniversary",
      years: 3,
      date: "2027-02-28",
    });
  });
});
