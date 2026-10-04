/**
Stable JSON for a variation id → option id map. Key order does not matter.
*/
export function canonicalSelection(selection: Record<string, string>): string {
  const entries = Object.entries(selection).toSorted(([a], [b]) =>
    a.localeCompare(b),
  );
  return JSON.stringify(Object.fromEntries(entries));
}
