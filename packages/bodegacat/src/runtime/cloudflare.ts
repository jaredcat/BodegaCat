import { env } from "cloudflare:workers";
import { getEffectiveConfig } from "../config/site";
import type { EditableSettings } from "../lib/settings";
import { getStoredSettings, saveSettings } from "../lib/settings";
import { getCloudflareAdminIdentity } from "./cloudflare-access";
import type { BodegaCatRuntime, FileStore, SettingsStore } from "./types";

function cloudflareSettings(): SettingsStore {
  const kv = env.SETTINGS_KV;
  return {
    available: Boolean(kv),
    get(): Promise<EditableSettings> {
      return getStoredSettings(kv);
    },
    save(settings: EditableSettings): Promise<void> {
      return saveSettings(kv, settings);
    },
  };
}

function cloudflareFiles(): FileStore {
  const bucket = env.FILES;
  return {
    available: Boolean(bucket),
    async put(key, body, contentType) {
      if (!bucket) {
        throw new Error("File storage is not configured");
      }
      await bucket.put(
        key,
        body,
        contentType ? { httpMetadata: { contentType } } : undefined,
      );
    },
    async get(key) {
      if (!bucket) return null;
      const object = await bucket.get(key);
      if (!object) return null;
      return {
        body: object.body,
        contentType: object.httpMetadata?.contentType,
      };
    },
  };
}

/** The only runtime adapter this pass ships. */
export function getCloudflareRuntime(): BodegaCatRuntime {
  return {
    settings: cloudflareSettings(),
    files: cloudflareFiles(),
    getAdminIdentity(request) {
      const identity = getCloudflareAdminIdentity(request);
      return identity ? { email: identity.email } : null;
    },
  };
}

export async function loadEffectiveConfig() {
  return getEffectiveConfig(getCloudflareRuntime().settings);
}
