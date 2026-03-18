import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import type { ResumeData } from "../../../domain/resume/types";
import type { TemplateId } from "../../../domain/templates";
import { PDFAtsPDF } from "./PDFAtsPDF";
import { PDFExecutivePDF } from "./PDFExecutivePDF";
import { PDFMonoPDF } from "./PDFMonoPDF";
import { PDFSiliconPDF } from "./PDFSiliconPDF";
import { PDFStudioPDF } from "./PDFStudioPDF";

interface PDFDocumentProps {
  data: ResumeData;
  templateId: TemplateId;
}

const TEMPLATE_MAP: Record<TemplateId, React.FC<{ data: ResumeData }>> = {
  executive: PDFExecutivePDF,
  ats: PDFAtsPDF,
  mono: PDFMonoPDF,
  silicon: PDFSiliconPDF,
  studio: PDFStudioPDF,
};

const PAGE_STYLE_MAP: Record<TemplateId, object> = {
  executive: { paddingTop: 20, paddingBottom: 20 },
  ats:       { paddingTop: 30, paddingBottom: 30 },
  mono:      { paddingTop: 30, paddingBottom: 30 },
  silicon:   { paddingTop: 30, paddingBottom: 30 },
  studio:    { paddingTop: 30,  paddingBottom: 30 },
};

export const PDFDocument: React.FC<PDFDocumentProps> = ({ data, templateId }) => {
  const TemplateComponent = TEMPLATE_MAP[templateId] ?? PDFAtsPDF;
  const pageStyle = PAGE_STYLE_MAP[templateId] ?? {};

  return (
    <Document>
      <Page
        size="A4"
        style={{
          backgroundColor: "#ffffff",
          ...pageStyle,
        }}
      >
        <TemplateComponent data={data} />
      </Page>
    </Document>
  );
};