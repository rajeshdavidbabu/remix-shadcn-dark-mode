/**
 * This file contains utilities for using client hints for user preference which
 * are needed by the server, but are only known by the browser.
 */
import * as React from "react";
import { type SerializeFrom } from "@remix-run/node";
import { useRouteLoaderData, useRevalidator } from "@remix-run/react";
import { type loader as rootLoader } from "~/root";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @returns the request info from the root loader
 */
export function useRequestInfo() {
  const data = useRouteLoaderData("root") as SerializeFrom<typeof rootLoader>;
  return data.requestInfo;
}

export const clientHints = {
  theme: {
    cookieName: "CH-prefers-color-scheme",
    getValueCode: `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`,
    fallback: "light",
    transform(value: string | null) {
      return value === "dark" ? "dark" : "light";
    },
  },
  // add other hints here
};

type ClientHintNames = keyof typeof clientHints;

function getCookieValue(cookieString: string, name: ClientHintNames) {
  const hint = clientHints[name];
  if (!hint) {
    throw new Error(`Unknown client hint: ${name}`);
  }
  const value = cookieString
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(hint.cookieName + "="))
    ?.split("=")[1];

  return value ?? null;
}

/**
 *
 * @param request {Request} - optional request object (only used on server)
 * @returns an object with the client hints and their values
 */
export function getHints(request?: Request) {
  const cookieString =
    typeof document !== "undefined"
      ? document.cookie
      : typeof request !== "undefined"
      ? request.headers.get("Cookie") ?? ""
      : "";

  return Object.entries(clientHints).reduce(
    (acc, [name, hint]) => {
      const hintName = name as ClientHintNames;
      // using ignore because it's not an issue with only one hint, but will
      // be with more than one...
      // @ts-ignore PR to improve these types is welcome
      acc[hintName] = hint.transform(getCookieValue(cookieString, hintName));
      return acc;
    },
    {} as {
      [name in ClientHintNames]: ReturnType<
        (typeof clientHints)[name]["transform"]
      >;
    }
  );
}

/**
 * @returns an object with the client hints and their values
 */
export function useHints() {
  const requestInfo = useRequestInfo();
  return requestInfo.hints;
}

/**
 * @returns inline script element that checks for client hints and sets cookies
 * if they are not set then reloads the page if any cookie was set to an
 * inaccurate value.
 */
export function ClientHintCheck({ nonce }: { nonce: string }) {
  const { revalidate } = useRevalidator();

  React.useEffect(() => {
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleThemeChange() {
      document.cookie = `${clientHints.theme.cookieName}=${
        themeQuery.matches ? "dark" : "light"
      }`;
      revalidate();
    }
    console.log(
      "client hint check ran ",
      themeQuery.matches ? "dark" : "light"
    );
    themeQuery.addEventListener("change", handleThemeChange);
    return () => {
      themeQuery.removeEventListener("change", handleThemeChange);
    };
  }, [revalidate]);

  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `
const cookies = document.cookie.split(';').map(c => c.trim()).reduce((acc, cur) => {
	const [key, value] = cur.split('=');
	acc[key] = value;
	return acc;
}, {});
let cookieChanged = false;
const hints = [
${Object.values(clientHints)
  .map((hint) => {
    const cookieName = JSON.stringify(hint.cookieName);
    return `{ name: ${cookieName}, actual: String(${hint.getValueCode}), cookie: cookies[${cookieName}] }`;
  })
  .join(",\n")}
];
for (const hint of hints) {
	if (hint.cookie !== hint.actual) {
		cookieChanged = true;
		document.cookie = hint.name + '=' + hint.actual;
	}
}
if (cookieChanged) {
	window.location.reload();
}
			`,
      }}
    />
  );
}

export enum Theme {
  DARK = "dark",
  LIGHT = "light",
  SYSTEM = "system",
}

export const themes: Array<Theme> = Object.values(Theme);

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && themes.includes(value as Theme);
}

export const NonceContext = React.createContext<string>("");
export const NonceProvider = NonceContext.Provider;
export const useNonce = () => React.useContext(NonceContext);
