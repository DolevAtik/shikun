/**
 * The four worlds are progress areas, not navigation.
 * Colors are the accent tokens already contrast-checked in tokens.css.
 * They are used as borders and fills, not as small text.
 */
export const WORLD_IDS = ["know", "feel", "develop", "participate"] as const;
export type WorldId = (typeof WORLD_IDS)[number];

export const WORLD_BORDER: Record<WorldId, string> = {
  know: "border-s-accent-teal",
  feel: "border-s-accent-amber",
  develop: "border-s-accent-violet",
  participate: "border-s-accent-green",
};
