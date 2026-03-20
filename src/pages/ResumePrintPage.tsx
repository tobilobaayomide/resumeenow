import React, { useEffect, useMemo } from "react";
import { HtmlTemplateDocument } from "../components/builder/preview/HtmlTemplateDocument";
import { decodeExportPayload } from "../lib/builder/exportPayload";
import { normalizeResumeData, normalizeTemplateId } from "../types/resume";
import type { ResumeData, TemplateId } from "../types/resume";

declare global {
  interface Window {
    __RESUME_PRINT_READY__?: boolean;
  }
}

interface ExportRouteState {
  data: ResumeData;
  templateId: TemplateId;
  fileName?: string;
}

interface ExportRouteResult {
  payload: ExportRouteState | null;
  error: string;
}

const ResumePrintPage: React.FC = () => {
  const { payload, error } = useMemo<ExportRouteResult>(() => {
    if (typeof window === "undefined") {
      return { payload: null, error: "" };
    }

    try {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) {
        return { payload: null, error: "Missing export payload." };
      }

      const decoded = decodeExportPayload(hash);
      return {
        payload: {
          data: normalizeResumeData(decoded.data),
          templateId: normalizeTemplateId(decoded.templateId),
          fileName:
            typeof decoded.fileName === "string" && decoded.fileName.trim()
              ? decoded.fileName.trim()
              : "Resume",
        },
        error: "",
      };
    } catch (decodeError) {
      console.error("Failed to decode export payload", decodeError);
      return { payload: null, error: "Could not load resume export." };
    }
  }, []);

  useEffect(() => {
    window.__RESUME_PRINT_READY__ = false;
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    if (payload?.fileName) {
      document.title = payload.fileName;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [payload?.fileName]);

  useEffect(() => {
    if (!payload) return;

    let cancelled = false;

    const markReady = async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });

      if ("fonts" in document) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore font readiness failures and proceed.
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, 150));

      if (!cancelled) {
        window.__RESUME_PRINT_READY__ = true;
      }
    };

    void markReady();

    return () => {
      cancelled = true;
      window.__RESUME_PRINT_READY__ = false;
    };
  }, [payload]);

  const content = useMemo(() => {
    if (error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
          <p className="text-sm font-medium text-gray-500">{error}</p>
        </div>
      );
    }

    if (!payload) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
          <p className="text-sm font-medium text-gray-500">Preparing export…</p>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen justify-center bg-white">
        <HtmlTemplateDocument
          data={payload.data}
          templateId={payload.templateId}
          zoom={1}
          pageGap={0}
          withShadow={false}
        />
      </div>
    );
  }, [error, payload]);

  return content;
};

export default ResumePrintPage;
