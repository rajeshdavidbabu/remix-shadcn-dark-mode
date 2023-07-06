import { Button } from "~/components/ui/button";

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <div>
        <Button>Click me</Button>
      </div>
    </div>
  );
}
