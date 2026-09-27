/**
 * How the app looks: which design, and light or dark. Both are the viewer's own
 * choice, kept in localStorage and applied to <html> — the design as
 * `data-design`, dark mode as the `dark` class. See the header of tokens.css.
 *
 * Design 2, "בונים עתיד", is the default and has no attribute; only an explicit
 * choice of the classic design sets one.
 */
export type Design = "mosaic" | "classic";

export const DESIGN_KEY = "design";
export const THEME_KEY = "theme";

/**
 * The browser chrome color for each combination — the top of the header, so the
 * status bar runs into it. Kept here, beside the script that applies it, because
 * a viewport export is static and cannot know the choice.
 */
export const THEME_COLOR: Record<Design, { light: string; dark: string }> = {
  mosaic: { light: "#ffffff", dark: "#131e36" },
  classic: { light: "#2c2118", dark: "#140f0c" },
};

/** Applies a design and mode to the page and remembers them. */
export function applyAppearance(design: Design, dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  if (design === "classic") root.setAttribute("data-design", "classic");
  else root.removeAttribute("data-design");

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[design][dark ? "dark" : "light"]);

  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    localStorage.setItem(DESIGN_KEY, design);
  } catch {
    // Private mode or blocked storage: the choice holds for this page only.
  }
}

export function currentDesign(): Design {
  return document.documentElement.getAttribute("data-design") === "classic" ? "classic" : "mosaic";
}

/**
 * The same thing as `applyAppearance`, as an inline script that runs before
 * first paint — so a saved choice never flashes the default first.
 */
export const APPEARANCE_SCRIPT = `
  try {
    var root = document.documentElement;
    var dark = localStorage.getItem(${JSON.stringify(THEME_KEY)}) === 'dark';
    var design = localStorage.getItem(${JSON.stringify(DESIGN_KEY)}) === 'classic' ? 'classic' : 'mosaic';
    if (dark) root.classList.add('dark');
    if (design === 'classic') root.setAttribute('data-design', 'classic');
    var colors = ${JSON.stringify(THEME_COLOR)};
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[design][dark ? 'dark' : 'light']);
  } catch (e) {}
`;
