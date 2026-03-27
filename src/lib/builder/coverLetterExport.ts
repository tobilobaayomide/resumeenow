import { toast } from 'sonner';
import type { ResumePersonalInfo } from '../../domain/resume';

const isInvalidFileNameCharacter = (char: string): boolean =>
  /[<>:"/\\|?*]/.test(char) || char.charCodeAt(0) < 32;

const sanitizeFileName = (value: string): string =>
  Array.from(value.trim())
    .filter((char) => !isInvalidFileNameCharacter(char))
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '');

const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    `${sanitizeFileName(fileName || 'Cover Letter') || 'Cover Letter'}.pdf`;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const PAGE_MARGIN_X = 58;
const PAGE_MARGIN_TOP = 64;
const PAGE_MARGIN_BOTTOM = 62;
const CONTENT_WIDTH = PDF_PAGE_WIDTH - PAGE_MARGIN_X * 2;
const BODY_LINE_HEIGHT = 18;
const PARAGRAPH_SPACING = 14;
const JUSTIFY_MIN_FILL_RATIO = 0.72;

const NAME_STYLE = { font: 'F2', size: 26, weight: '700' } as const;
const TITLE_STYLE = { font: 'F1', size: 12, weight: '500' } as const;
const CONTACT_STYLE = { font: 'F1', size: 10.5, weight: '400' } as const;
const META_STYLE = { font: 'F1', size: 11, weight: '400' } as const;
const BODY_STYLE = { font: 'F1', size: 11.5, weight: '400' } as const;
const SIGNATURE_STYLE = { font: 'F2', size: 12, weight: '700' } as const;

const PDF_TEXT_REPLACEMENTS: Record<string, string> = {
  '\u00a0': ' ',
  '\u2013': '-',
  '\u2014': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201c': '"',
  '\u201d': '"',
  '\u2022': '-',
  '\u2026': '...',
};

type PdfFontName = 'F1' | 'F2';

interface PdfPageState {
  commands: string[];
}

interface LayoutStyle {
  font: PdfFontName;
  size: number;
  weight: string;
  italic?: boolean;
}

let measurementContext: CanvasRenderingContext2D | null = null;

const stripUnsupportedPdfCharacters = (value: string): string =>
  Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 0x09 || code === 0x0a || code === 0x0d || (code >= 0x20 && code <= 0x7e);
    })
    .join('');

const normalizePdfText = (value: string): string =>
  stripUnsupportedPdfCharacters(
    value
      .replace(
      /[\u00a0\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026]/g,
      (character) => PDF_TEXT_REPLACEMENTS[character] ?? ' ',
    )
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, ''),
  );

const splitCoverLetterParagraphs = (coverLetterText: string): string[] =>
  coverLetterText
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const buildContactLine = (personalInfo: ResumePersonalInfo): string[] =>
  [
    personalInfo.location,
    personalInfo.phone,
    personalInfo.email,
    personalInfo.website,
  ]
    .map((item) => item.trim())
    .filter(Boolean);

const shouldAppendSignature = (
  coverLetterText: string,
  fullName: string,
): boolean => {
  if (!fullName.trim()) return false;

  const normalized = coverLetterText.trim();
  if (!/best regards,\s*$/i.test(normalized)) return false;

  return !normalized.toLowerCase().includes(fullName.trim().toLowerCase());
};

const escapePdfText = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const formatPdfNumber = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/u, '');
};

const getMeasurementContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null;
  if (measurementContext) return measurementContext;

  const canvas = document.createElement('canvas');
  measurementContext = canvas.getContext('2d');
  return measurementContext;
};

const pointsToPixels = (value: number): number => (value * 96) / 72;
const pixelsToPoints = (value: number): number => (value * 72) / 96;

const getTextWidth = (value: string, style: LayoutStyle): number => {
  const normalized = normalizePdfText(value);
  if (!normalized) return 0;

  const context = getMeasurementContext();
  if (!context) {
    return normalized.length * style.size * 0.52;
  }

  context.font = `${style.italic ? 'italic ' : ''}${style.weight} ${pointsToPixels(
    style.size,
  )}px Helvetica, Arial, sans-serif`;
  return pixelsToPoints(context.measureText(normalized).width);
};

const splitWordToFit = (
  word: string,
  maxWidth: number,
  style: LayoutStyle,
): string[] => {
  const parts: string[] = [];
  let current = '';

  for (const character of word) {
    const candidate = current + character;
    if (current && getTextWidth(candidate, style) > maxWidth) {
      parts.push(current);
      current = character;
      continue;
    }
    current = candidate;
  }

  if (current) parts.push(current);
  return parts;
};

const wrapText = (
  value: string,
  maxWidth: number,
  style: LayoutStyle,
): string[] => {
  const normalized = normalizePdfText(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;

    if (getTextWidth(word, style) > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      lines.push(...splitWordToFit(word, maxWidth, style));
      continue;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && getTextWidth(candidate, style) > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }
    currentLine = candidate;
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

const buildTextCommand = (
  x: number,
  y: number,
  text: string,
  style: LayoutStyle,
  color: [number, number, number],
  wordSpacing = 0,
): string =>
  [
    'BT',
    `${formatPdfNumber(color[0])} ${formatPdfNumber(color[1])} ${formatPdfNumber(
      color[2],
    )} rg`,
    `/${style.font} ${formatPdfNumber(style.size)} Tf`,
    `${formatPdfNumber(wordSpacing)} Tw`,
    `1 0 0 1 ${formatPdfNumber(x)} ${formatPdfNumber(y)} Tm`,
    `(${escapePdfText(normalizePdfText(text))}) Tj`,
    'ET',
  ].join('\n');

const buildLineCommand = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: [number, number, number],
  width = 1,
): string =>
  [
    `${formatPdfNumber(color[0])} ${formatPdfNumber(color[1])} ${formatPdfNumber(
      color[2],
    )} RG`,
    `${formatPdfNumber(width)} w`,
    `${formatPdfNumber(startX)} ${formatPdfNumber(startY)} m`,
    `${formatPdfNumber(endX)} ${formatPdfNumber(endY)} l`,
    'S',
  ].join('\n');

const buildPdfDocument = (pages: PdfPageState[]): ArrayBuffer => {
  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  const contentObjectIds = pages.map((_, index) => 6 + index * 2);
  const maxObjectId = 4 + pages.length * 2;
  const encoder = new TextEncoder();
  const objects = new Map<number, string>();

  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objects.set(
    2,
    `<< /Type /Pages /Kids [${pageObjectIds
      .map((objectId) => `${objectId} 0 R`)
      .join(' ')}] /Count ${pages.length} >>`,
  );
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.set(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  pages.forEach((page, index) => {
    const content = page.commands.join('\n');
    const contentObjectId = contentObjectIds[index];
    const pageObjectId = pageObjectIds[index];

    objects.set(
      contentObjectId,
      `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`,
    );
    objects.set(
      pageObjectId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatPdfNumber(
        PDF_PAGE_WIDTH,
      )} ${formatPdfNumber(PDF_PAGE_HEIGHT)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = new Array(maxObjectId + 1).fill(0);

  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    offsets[objectId] = encoder.encode(pdf).length;
    pdf += `${objectId} 0 obj\n${objects.get(objectId) ?? ''}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${maxObjectId + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    pdf += `${String(offsets[objectId]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const bytes = encoder.encode(pdf);
  const output = new Uint8Array(bytes.length);
  output.set(bytes);
  return output.buffer;
};

const getWordCount = (value: string): number =>
  normalizePdfText(value)
    .split(' ')
    .filter(Boolean).length;

const getJustifiedWordSpacing = (
  value: string,
  targetWidth: number,
  style: LayoutStyle,
): number => {
  const wordCount = getWordCount(value);
  if (wordCount < 2) return 0;

  const textWidth = getTextWidth(value, style);
  if (!textWidth || textWidth / targetWidth < JUSTIFY_MIN_FILL_RATIO) return 0;

  const extraWidth = targetWidth - textWidth;
  if (extraWidth <= 0.5) return 0;

  return extraWidth / (wordCount - 1);
};

const createCoverLetterPdfBlob = (
  coverLetterText: string,
  personalInfo: ResumePersonalInfo,
  role?: string,
  company?: string,
  hiringManager?: string,
): Blob => {
  const pages: PdfPageState[] = [{ commands: [] }];
  let currentPage = pages[0];
  let currentY = PDF_PAGE_HEIGHT - PAGE_MARGIN_TOP;

  const startNewPage = () => {
    currentPage = { commands: [] };
    pages.push(currentPage);
    currentY = PDF_PAGE_HEIGHT - PAGE_MARGIN_TOP;
  };

  const ensureSpace = (requiredHeight: number) => {
    if (currentY - requiredHeight < PAGE_MARGIN_BOTTOM) {
      startNewPage();
    }
  };

  const drawTextLine = (
    text: string,
    x: number,
    y: number,
    style: LayoutStyle,
    color: [number, number, number],
    wordSpacing = 0,
  ) => {
    currentPage.commands.push(
      buildTextCommand(x, y, text, style, color, wordSpacing),
    );
  };

  const headerStartY = currentY;
  const leftHeaderWidth = 300;
  const name = personalInfo.fullName.trim() || 'Cover Letter';
  const roleLabel = (personalInfo.jobTitle || role || '').trim();
  const contactLines = buildContactLine(personalInfo);

  let leftY = headerStartY;
  for (const line of wrapText(name, leftHeaderWidth, NAME_STYLE)) {
    drawTextLine(line, PAGE_MARGIN_X, leftY, NAME_STYLE, [0.07, 0.1, 0.15]);
    leftY -= 31;
  }

  if (roleLabel) {
    drawTextLine(roleLabel, PAGE_MARGIN_X, leftY + 4, TITLE_STYLE, [0.42, 0.46, 0.52]);
    leftY -= 22;
  }

  let rightY = headerStartY;
  for (const line of contactLines) {
    const lineWidth = getTextWidth(line, CONTACT_STYLE);
    const x = PDF_PAGE_WIDTH - PAGE_MARGIN_X - lineWidth;
    drawTextLine(line, x, rightY, CONTACT_STYLE, [0.42, 0.46, 0.52]);
    rightY -= 15;
  }

  currentY = Math.min(leftY, rightY || leftY) - 2;

  const metaLines = [
    DATE_FORMATTER.format(new Date()),
    company?.trim() || '',
    hiringManager?.trim() || '',
    role?.trim() ? `Re: ${role.trim()}` : '',
  ].filter(Boolean);

  for (const line of metaLines) {
    ensureSpace(16);
    drawTextLine(line, PAGE_MARGIN_X, currentY, META_STYLE, [0.32, 0.36, 0.42]);
    currentY -= 16;
  }

  currentY -= 6;
  currentPage.commands.push(
    buildLineCommand(
      PAGE_MARGIN_X,
      currentY,
      PDF_PAGE_WIDTH - PAGE_MARGIN_X,
      currentY,
      [0.86, 0.88, 0.9],
    ),
  );
  currentY -= 28;

  const paragraphs = splitCoverLetterParagraphs(coverLetterText);
  for (const paragraph of paragraphs) {
    const segments = paragraph
      .split('\n')
      .map((segment) => segment.trim())
      .filter(Boolean);

    for (const segment of segments) {
      const lines = wrapText(segment, CONTENT_WIDTH, BODY_STYLE);

      for (const [index, line] of lines.entries()) {
        ensureSpace(BODY_LINE_HEIGHT);
        drawTextLine(
          line,
          PAGE_MARGIN_X,
          currentY,
          BODY_STYLE,
          [0.13, 0.16, 0.2],
          index === lines.length - 1
            ? 0
            : getJustifiedWordSpacing(line, CONTENT_WIDTH, BODY_STYLE),
        );
        currentY -= BODY_LINE_HEIGHT;
      }
    }

    currentY -= PARAGRAPH_SPACING;
  }

  if (shouldAppendSignature(coverLetterText, personalInfo.fullName)) {
    currentY -= 8;
    ensureSpace(24);
    drawTextLine(
      personalInfo.fullName.trim(),
      PAGE_MARGIN_X,
      currentY,
      SIGNATURE_STYLE,
      [0.07, 0.1, 0.15],
    );
  }

  return new Blob([buildPdfDocument(pages)], { type: 'application/pdf' });
};

export const downloadCoverLetterAsPdf = async (
  fileName: string,
  coverLetterText: string,
  personalInfo: ResumePersonalInfo,
  role?: string,
  company?: string,
  hiringManager?: string,
): Promise<void> => {
  const toastId = toast.loading('Preparing cover letter PDF...');

  try {
    const pdfBlob = createCoverLetterPdfBlob(
      coverLetterText,
      personalInfo,
      role,
      company,
      hiringManager,
    );
    triggerBlobDownload(pdfBlob, fileName);
    toast.success('Cover letter PDF ready.', { id: toastId });
  } catch (error) {
    console.error('Cover letter export error:', error);
    toast.error('Failed to export cover letter PDF.', { id: toastId });
  }
};
