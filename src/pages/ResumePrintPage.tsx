import React, { useEffect, useMemo } from "react";
import { HtmlTemplateDocument } from "../components/builder/preview/HtmlTemplateDocument";
import Seo from "../components/seo/Seo";
import { ensurePrintFontsReady } from "../lib/builder/printFonts";
import { resolveResumePrintPayload } from "../lib/builder/printPayload";
import type { ResumeData, TemplateId } from "../types/resume";

declare global {
  interface Window {
    __RESUME_PRINT_READY__?: boolean;
    __RESUME_PRINT_PAYLOAD__?: unknown;
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

    const resolved = resolveResumePrintPayload(window.__RESUME_PRINT_PAYLOAD__);
    if (resolved.error) {
      console.error("Failed to load export payload", resolved.error);
    }

    return resolved;
  }, []);

  useEffect(() => {
    window.__RESUME_PRINT_READY__ = false;
    return () => {
      delete window.__RESUME_PRINT_PAYLOAD__;
      window.__RESUME_PRINT_READY__ = false;
    };
  }, []);

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
          await ensurePrintFontsReady(document);
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
        <>
          <Seo
            title="Resume Print | ResumeeNow"
            description="Private resume print view for exports generated inside ResumeeNow."
            path="/print/resume"
            robots="noindex,nofollow"
          />
          <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
            <p className="text-sm font-medium text-gray-500">{error}</p>
          </div>
        </>
      );
    }

    if (!payload) {
      return (
        <>
          <Seo
            title="Resume Print | ResumeeNow"
            description="Private resume print view for exports generated inside ResumeeNow."
            path="/print/resume"
            robots="noindex,nofollow"
          />
          <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
            <p className="text-sm font-medium text-gray-500">Preparing export…</p>
          </div>
        </>
      );
    }

    return (
      <>
        <Seo
          title={payload.fileName || "Resume Print | ResumeeNow"}
          description="Private resume print view for exports generated inside ResumeeNow."
          path="/print/resume"
          robots="noindex,nofollow"
        />
        <div className="min-h-screen bg-white">
          <HtmlTemplateDocument
            data={payload.data}
            templateId={payload.templateId}
            zoom={1}
            pageGap={0}
            withShadow={false}
            renderMode="print"
          />
        </div>
      </>
    );
  }, [error, payload]);

  return content;
};

export default ResumePrintPage;
