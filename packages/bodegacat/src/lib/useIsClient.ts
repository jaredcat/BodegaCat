import { useSyncExternalStore } from "react";

function unsubscribe(): void {
  return undefined;
}

function subscribe(): () => void {
  return unsubscribe;
}

/** True after hydration. Server and the first client render stay false, so cart counts do not mismatch. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
