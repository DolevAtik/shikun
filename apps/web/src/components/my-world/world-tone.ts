import type { WorldId } from "@moch/ui";

/** Soft world accents. Feel is a muted red, not the amber used on older cards. */
export const WORLD_COLOR: Record<WorldId, string> = {
  know: "var(--accent-teal)",
  feel: "var(--accent-red)",
  develop: "var(--accent-violet)",
  participate: "var(--accent-green)",
};

export const WORLD_BAR: Record<WorldId, string> = {
  know: "bg-accent-teal",
  feel: "bg-accent-red",
  develop: "bg-accent-violet",
  participate: "bg-accent-green",
};

export function worldTint(world: WorldId): { color: string; backgroundColor: string } {
  const color = WORLD_COLOR[world];
  return {
    color,
    backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
  };
}

/** A card wash. The world color is a tint, never the text color by itself. */
export function worldWash(world: WorldId): string {
  return `color-mix(in srgb, ${WORLD_COLOR[world]} 8%, var(--surface))`;
}
