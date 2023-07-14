import React from "react";
import { useRevalidator } from "@remix-run/react";

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
  // eg: motion-preference etc
};

type ClientHintNames = keyof typeof clientHints;

// Returns the cookie value eg: 'dark' or 'light'
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

  return value ? decodeURIComponent(value) : null;
}

/**
 *
 * @param request {Request} - optional request object (only used on server)
 * @returns an object with the client hints and their values
 * Eg: { theme: 'dark' }
 */
export function getHints(request?: Request) {
  const cookieString =
    typeof document !== "undefined"
      ? document.cookie
      : typeof request !== "undefined"
      ? request.headers.get("Cookie") ?? ""
      : "";

  const hints = Object.entries(clientHints).reduce(
    (acc, [name, hint]) => {
      const hintName = name as ClientHintNames;
      // using ignore because it's not an issue with only one hint, but will
      // be with more than one...
      // @ts-ignore PR to improve these types is welcome
      const transformedHint = hint.transform(
        getCookieValue(cookieString, hintName) ?? hint.fallback
      );
      acc[hintName] = transformedHint;
      return acc;
    },
    {} as {
      [name in ClientHintNames]: ReturnType<
        (typeof clientHints)[name]["transform"]
      >;
    }
  );

  return hints;
}

/**
 * @returns inline script element that checks for client hints and sets cookies
 * if they are not set then reloads the page if any cookie was set to an
 * inaccurate value.
 */
export function ClientHintCheck({ nonce }: { nonce: string }) {
  const { revalidate } = useRevalidator();

  React.useEffect(() => {
    console.log("script component ran");
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleThemeChange() {
      document.cookie = `${clientHints.theme.cookieName}=${
        themeQuery.matches ? "dark" : "light"
      }`;
      revalidate();
    }
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
console.log('actual script ran');
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
	if (decodeURIComponent(hint.cookie) !== hint.actual) {
		cookieChanged = true;
		document.cookie = encodeURIComponent(hint.name) + '=' + encodeURIComponent(hint.actual) + ';path=/';
	}
}
if (cookieChanged && navigator.cookieEnabled) {
    console.log('cookie changed, reloading');
	window.location.reload();
}
			`,
      }}
    />
  );
}

// Use nonce for the script tag
export const NonceContext = React.createContext<string>("");
export const NonceProvider = NonceContext.Provider;
export const useNonce = () => React.useContext(NonceContext);
