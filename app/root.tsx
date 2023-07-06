import styles from "./tailwind.css";
import { cssBundleHref } from "@remix-run/css-bundle";
import {
  json,
  type DataFunctionArgs,
  type LinksFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  // useLoaderData,
} from "@remix-run/react";
import clsx from "clsx";
import { ThemeSwitch, useTheme } from "./routes/action.set-theme";
import { getTheme } from "./lib/theme.server";
import { ClientHintCheck, getHints, useNonce } from "./lib/utils";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export async function loader({ request }: DataFunctionArgs) {
  return json({
    requestInfo: {
      hints: getHints(request),
      session: {
        theme: await getTheme(request),
      },
    },
  });
}

export default function App() {
  const nonce = useNonce();
  const theme = useTheme();

  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeSwitch />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}