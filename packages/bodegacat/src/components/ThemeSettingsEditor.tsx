import { useMemo, useRef, useState } from "react";
import type {
  BodegaCatTheme,
  ThemeContent,
  ThemeLink,
  ThemeSettingField,
  ThemeVariables,
} from "../themes/types";

interface ThemeSettingsEditorProperties {
  themes: Record<string, BodegaCatTheme>;
  initialThemeId: string;
  initialBaseId: string;
  initialContent: ThemeContent;
  initialVariables: ThemeVariables;
  filesAvailable: boolean;
}

interface ThemePayload {
  themeId: string;
  customBaseId: string;
  content: ThemeContent;
  variables: ThemeVariables;
}

const themeOrder = ["bodegacat", "voidkitten", "paddleboard"] as const;

function isCssVariable(field: ThemeSettingField): field is ThemeSettingField & {
  variable: `--${string}`;
} {
  switch (field.type) {
    case "color":
    case "select": {
      return true;
    }
    case "text":
    case "textarea":
    case "url": {
      return field.variable !== undefined;
    }
    default: {
      return false;
    }
  }
}

function textValue(content: ThemeContent, id: string): string {
  const value = content[id];
  return typeof value === "string" ? value : "";
}

function linkValue(content: ThemeContent, id: string): ThemeLink[] {
  const value = content[id];
  return Array.isArray(value) ? value : [];
}

function hexOrFallback(value: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#000000";
}

export default function ThemeSettingsEditor({
  themes,
  initialThemeId,
  initialBaseId,
  initialContent,
  initialVariables,
  filesAvailable,
}: Readonly<ThemeSettingsEditorProperties>) {
  const [themeId, setThemeId] = useState(initialThemeId);
  const [baseId, setBaseId] = useState(initialBaseId);
  const [content, setContent] = useState<ThemeContent>(initialContent);
  const [variables, setVariables] = useState<ThemeVariables>(initialVariables);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState<string | undefined>(undefined);

  const fieldThemeId = themeId === "custom" ? baseId : themeId;
  const fields = themes[fieldThemeId].settings ?? [];

  const payload = useMemo<ThemePayload>(
    () => ({
      themeId,
      customBaseId: baseId,
      content,
      variables,
    }),
    [themeId, baseId, content, variables],
  );

  function selectTheme(id: string) {
    if (id === "custom") {
      setThemeId("custom");
      return;
    }
    setThemeId(id);
    setBaseId(id);
    setVariables({ ...themes[id].variables });
  }

  function editVariable(variable: `--${string}`, value: string) {
    setThemeId("custom");
    setVariables((current) => ({ ...current, [variable]: value }));
  }

  function editText(id: string, value: string) {
    setContent((current) => ({ ...current, [id]: value }));
  }

  function editLinks(id: string, links: ThemeLink[]) {
    setContent((current) => ({ ...current, [id]: links }));
  }

  async function uploadImage(id: string, file: File) {
    setUploadError(undefined);
    setUploading(id);
    try {
      const body = new FormData();
      body.set("field", id);
      body.set("file", file);
      const response = await fetch("/api/admin/theme-asset", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed");
      }
      editText(id, result.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(undefined);
    }
  }

  return (
    <div className="space-y-8">
      <input
        type="hidden"
        name="themePayload"
        value={JSON.stringify(payload)}
      />

      <div>
        <p className="mb-3 block text-sm font-medium text-gray-700">Theme</p>
        <div className="flex flex-wrap gap-4">
          {themeOrder.map((id) => (
            <label key={id} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="builtInTheme"
                value={id}
                checked={themeId === id}
                className="accent-primary"
                onChange={() => {
                  selectTheme(id);
                }}
              />
              <span className="text-sm">{themes[id].name}</span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="builtInTheme"
              value="custom"
              checked={themeId === "custom"}
              className="accent-primary"
              onChange={() => {
                selectTheme("custom");
              }}
            />
            <span className="text-sm">Custom</span>
          </label>
        </div>
      </div>

      {fields.map((field) => (
        <ThemeField
          key={`${fieldThemeId}-${field.id}`}
          field={field}
          content={content}
          variables={variables}
          filesAvailable={filesAvailable}
          uploading={uploading === field.id}
          onText={editText}
          onLinks={editLinks}
          onVariable={editVariable}
          onUpload={(file) => {
            void uploadImage(field.id, file);
          }}
        />
      ))}

      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
    </div>
  );
}

interface ThemeFieldProperties {
  field: ThemeSettingField;
  content: ThemeContent;
  variables: ThemeVariables;
  filesAvailable: boolean;
  uploading: boolean;
  onText: (id: string, value: string) => void;
  onLinks: (id: string, links: ThemeLink[]) => void;
  onVariable: (variable: `--${string}`, value: string) => void;
  onUpload: (file: File) => void;
}

function ImageField({
  fieldId,
  label,
  help,
  url,
  filesAvailable,
  uploading,
  onUpload,
}: Readonly<{
  fieldId: string;
  label: string;
  help?: string;
  url: string;
  filesAvailable: boolean;
  uploading: boolean;
  onUpload: (file: File) => void;
}>) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [failedUrl, setFailedUrl] = useState<string | undefined>(undefined);
  const isShowPreview =
    failedUrl !== url &&
    (url.startsWith("/files/") ||
      url.startsWith("http://") ||
      url.startsWith("https://"));
  const selectedFileLabel = fileName === "" ? "No file selected" : fileName;

  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium text-gray-700"
        htmlFor={fieldId}
      >
        {label}
      </label>
      {help && <p className="mb-2 text-xs text-gray-500">{help}</p>}
      {isShowPreview && (
        <img
          src={url}
          alt=""
          className="mb-3 h-16 w-16 rounded border border-gray-200 object-contain"
          onError={() => {
            setFailedUrl(url);
          }}
        />
      )}
      {filesAvailable ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-outline"
            disabled={uploading}
            onClick={() => {
              fileInput.current?.click();
            }}
          >
            Browse
          </button>
          <span className="text-sm text-gray-500">{selectedFileLabel}</span>
          <input
            ref={fileInput}
            id={fieldId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              onUpload(file);
            }}
          />
        </div>
      ) : (
        <p className="text-sm text-amber-700">
          File storage is not configured.
        </p>
      )}
      {uploading && <p className="mt-1 text-xs text-gray-500">Uploading…</p>}
    </div>
  );
}

function ThemeField({
  field,
  content,
  variables,
  filesAvailable,
  uploading,
  onText,
  onLinks,
  onVariable,
  onUpload,
}: Readonly<ThemeFieldProperties>) {
  if (isCssVariable(field) && field.type === "color") {
    const value = variables[field.variable] ?? "";
    return (
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor={field.id}
        >
          {field.label}
        </label>
        <div className="flex max-w-sm items-center gap-2">
          <input
            type="color"
            value={hexOrFallback(value)}
            className="h-9 w-10 cursor-pointer rounded border"
            aria-label={`${field.label} picker`}
            onChange={(event) => {
              onVariable(field.variable, event.target.value);
            }}
          />
          <input
            id={field.id}
            type="text"
            value={value}
            className="input flex-1 font-mono text-sm"
            onChange={(event) => {
              onVariable(field.variable, event.target.value);
            }}
          />
        </div>
      </div>
    );
  }

  if (isCssVariable(field) && field.type === "select") {
    const value = variables[field.variable] ?? "";
    const isKnown = field.options.some((option) => option.value === value);
    return (
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor={field.id}
        >
          {field.label}
        </label>
        <select
          id={field.id}
          className="input max-w-xs"
          value={value}
          onChange={(event) => {
            onVariable(field.variable, event.target.value);
          }}
        >
          {!isKnown && value && <option value={value}>{value}</option>}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (isCssVariable(field)) {
    const value = variables[field.variable] ?? "";
    return (
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor={field.id}
        >
          {field.label}
        </label>
        <input
          id={field.id}
          type="text"
          value={value}
          className="input font-mono text-sm"
          onChange={(event) => {
            onVariable(field.variable, event.target.value);
          }}
        />
      </div>
    );
  }

  if (field.type === "links") {
    return (
      <LinkRows
        fieldId={field.id}
        label={field.label}
        help={field.help}
        links={linkValue(content, field.id)}
        onChange={(links) => {
          onLinks(field.id, links);
        }}
      />
    );
  }

  if (field.type === "image") {
    return (
      <ImageField
        fieldId={field.id}
        label={field.label}
        help={field.help}
        url={textValue(content, field.id)}
        filesAvailable={filesAvailable}
        uploading={uploading}
        onUpload={onUpload}
      />
    );
  }

  const inputType = field.type === "url" ? "url" : "text";
  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium text-gray-700"
        htmlFor={field.id}
      >
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={field.id}
          rows={4}
          className="input"
          placeholder={field.placeholder}
          value={textValue(content, field.id)}
          onChange={(event) => {
            onText(field.id, event.target.value);
          }}
        />
      ) : (
        <input
          id={field.id}
          type={inputType}
          className="input"
          placeholder={field.placeholder}
          value={textValue(content, field.id)}
          onChange={(event) => {
            onText(field.id, event.target.value);
          }}
        />
      )}
      {field.help && <p className="mt-1 text-xs text-gray-500">{field.help}</p>}
    </div>
  );
}

function LinkRows({
  fieldId,
  label,
  help,
  links,
  onChange,
}: Readonly<{
  fieldId: string;
  label: string;
  help?: string;
  links: ThemeLink[];
  onChange: (links: ThemeLink[]) => void;
}>) {
  function update(index: number, key: keyof ThemeLink, value: string) {
    onChange(
      links.map((link, index_) =>
        index_ === index ? { ...link, [key]: value } : link,
      ),
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
      {help && <p className="mb-2 text-xs text-gray-500">{help}</p>}
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={`${fieldId}-${String(index)}`} className="flex gap-3">
            <input
              type="text"
              value={link.label}
              placeholder="Label"
              aria-label={`${label} label ${String(index + 1)}`}
              className="input flex-1"
              onChange={(event) => {
                update(index, "label", event.target.value);
              }}
            />
            <input
              type="text"
              value={link.href}
              placeholder="/page or https://"
              aria-label={`${label} link ${String(index + 1)}`}
              className="input flex-1"
              onChange={(event) => {
                update(index, "href", event.target.value);
              }}
            />
            <button
              type="button"
              className="btn btn-outline px-3 text-red-500"
              onClick={() => {
                onChange(links.filter((_, index_) => index_ !== index));
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-outline mt-4"
        onClick={() => {
          onChange([...links, { label: "", href: "" }]);
        }}
      >
        + Add link
      </button>
    </div>
  );
}
