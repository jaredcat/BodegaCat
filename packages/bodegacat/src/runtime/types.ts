import type { EditableSettings } from "../lib/settings";

/** Settings the admin UI reads and writes. Not Stripe secrets. */
export interface SettingsStore {
  /** False when the host has no settings binding (local `astro dev` uses memory). */
  readonly available: boolean;
  get(): Promise<EditableSettings>;
  save(settings: EditableSettings): Promise<void>;
}

export interface StoredFile {
  body: ReadableStream;
  contentType?: string;
}

/** Object storage for product files. Cloudflare uses R2. */
export interface FileStore {
  readonly available: boolean;
  put(
    key: string,
    body: ArrayBuffer | ReadableStream,
    contentType?: string,
  ): Promise<void>;
  get(key: string): Promise<StoredFile | null>;
}

export interface AdminIdentity {
  email: string;
}

/**
 * What a host provides to admin, preview, and checkout.
 * Static shop pages do not use this.
 * Another host (Lambda, Docker) implements this interface; it does not fork routes.
 */
export interface BodegaCatRuntime {
  settings: SettingsStore;
  files: FileStore;
  getAdminIdentity(request: Request): AdminIdentity | null;
}
