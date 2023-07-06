import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  getSession,
  deleteTheme,
  setTheme,
  commitSession,
} from "~/lib/theme.server";
import type { Theme } from "~/lib/utils";
import { useHints, isTheme, useRequestInfo } from "~/lib/utils";
import { DarkModeToggle } from "~/components/ui/dark-mode-toggle";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("cookie"));
  const requestText = await request.text();
  const form = new URLSearchParams(requestText);
  const theme = form.get("theme");

  if (!isTheme(theme)) {
    return json({
      success: false,
      message: `theme value of ${theme} is not a valid theme`,
    });
  }

  if (theme === "system") {
    deleteTheme(session);
  } else {
    setTheme(session, theme);
  }

  return json(
    { success: true },
    { headers: { "Set-Cookie": await commitSession(session) } }
  );
};

export function ThemeSwitch() {
  const fetcher = useFetcher();

  const handleSelect = (themeValue: Theme) => {
    // programmatically submit a useFetcher form in Remix
    fetcher.submit(
      { theme: themeValue },
      { method: "post", action: "/action/set-theme" }
    );
  };

  return <DarkModeToggle handleThemeChange={handleSelect} />;
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
  const hints = useHints();
  const requestInfo = useRequestInfo();
  console.log("The current useTheme call ", requestInfo.session.theme);
  return requestInfo.session.theme ?? hints.theme;
}
