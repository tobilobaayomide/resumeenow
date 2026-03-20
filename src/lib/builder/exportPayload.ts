import type { ResumeData } from "../../domain/resume";
import type { TemplateId } from "../../domain/templates";

interface ExportPayload {
  data: ResumeData;
  templateId: TemplateId;
  fileName?: string;
}

const getBase64Encoder = (): ((value: string) => string) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa.bind(window);
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa.bind(globalThis);
  }

  throw new Error("Base64 encoding is unavailable in this environment.");
};

const getBase64Decoder = (): ((value: string) => string) => {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob.bind(window);
  }

  if (typeof globalThis.atob === "function") {
    return globalThis.atob.bind(globalThis);
  }

  throw new Error("Base64 decoding is unavailable in this environment.");
};

const toBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return getBase64Encoder()(binary);
};

const fromBase64 = (value: string): string => {
  const binary = getBase64Decoder()(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const toBase64Url = (value: string): string =>
  value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
};

export const encodeExportPayload = (payload: ExportPayload): string =>
  toBase64Url(toBase64(JSON.stringify(payload)));

export const decodeExportPayload = (value: string): ExportPayload =>
  JSON.parse(fromBase64(fromBase64Url(value))) as ExportPayload;
