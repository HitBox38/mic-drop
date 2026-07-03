import { createFileRoute } from "@tanstack/react-router";

import { Soundboard } from "@/components/soundboard";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <Soundboard />;
}
