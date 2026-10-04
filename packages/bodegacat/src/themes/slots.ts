import paddleboardHome from "./paddleboard/runtime/HomePage.astro";
import { slots as themeSlotsFromApp } from "virtual:bodegacat-theme-slots";
import type { BodegaCatTheme, ThemeSlots } from "./types";

/**
Built-in layouts. CSS-only themes are absent and use the default pages.
*/
const builtInSlots: Record<string, ThemeSlots> = {
  paddleboard: { home: paddleboardHome },
};

/**
Layout for the active theme. App slots passed to bodegacat({ themeSlots })
win, then slots on the theme object, then a built-in layout for the same id.
*/
function slotsForId(
  map: Record<string, ThemeSlots>,
  id: string,
): ThemeSlots | undefined {
  return Object.hasOwn(map, id) ? map[id] : undefined;
}

export function resolveThemeSlots(theme: BodegaCatTheme): ThemeSlots {
  const id = theme.id ?? "";
  const registered = slotsForId(themeSlotsFromApp, id);
  const builtIn = slotsForId(builtInSlots, id);
  return {
    home: registered?.home ?? theme.slots?.home ?? builtIn?.home,
    productExtra:
      registered?.productExtra ??
      theme.slots?.productExtra ??
      builtIn?.productExtra,
    shop: registered?.shop ?? theme.slots?.shop ?? builtIn?.shop,
  };
}
