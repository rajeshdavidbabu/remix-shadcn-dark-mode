import type { V2_MetaFunction } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import { DarkModeToggle } from "~/components/dark-mode-toggle";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Home() {
  return (
    <div>
      <div>
        <DarkModeToggle />
      </div>
      <Button>Click me</Button>
    </div>
  );
}
