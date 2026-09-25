import { describe, expect, it } from "vitest";
import { type Act, compute, currentStreak } from "./compute";
import { levelFor, readMinutes, worldForChannel, xpForLevel } from "./rules";

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
