import { createCookieSessionStorage } from "@remix-run/node";

const themeKey = "theme";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: themeKey,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: ["sec3ret"], // Use process.env.SESSION_SECRET
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

type Session = Awaited<ReturnType<typeof getSession>>;

export async function getTheme(
  request: Request
): Promise<"dark" | "light" | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const theme = session.get(themeKey);
  if (theme === "dark" || theme === "light") return theme;
  return null;
}

export function setTheme(session: Session, theme: "dark" | "light") {
  session.set(themeKey, theme);
}

export function deleteTheme(session: Session) {
  session.unset(themeKey);
}
