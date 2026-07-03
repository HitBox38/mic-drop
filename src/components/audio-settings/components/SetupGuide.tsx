import { SETUP_STEPS } from "../constants";

export function SetupGuide() {
  return (
    <div className="rounded-xl border bg-background/50 p-4">
      <h3 className="text-sm font-medium">Call app setup</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        {SETUP_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
