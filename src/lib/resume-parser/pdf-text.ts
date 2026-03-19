import type { PdfTextItem } from '../../types/parser/index.js';
import { cleanLine, isNoiseLine } from './text.js';

export const toPdfTextItem = (item: unknown): PdfTextItem | null => {
  if (typeof item !== 'object' || item === null) return null;

  const raw = item as Partial<PdfTextItem>;
  if (typeof raw.str !== 'string' || !Array.isArray(raw.transform)) return null;

  return {
    str: raw.str,
    transform: raw.transform,
    width: typeof raw.width === 'number' ? raw.width : 0,
    hasEOL: raw.hasEOL,
  };
};

export const extractPdfPageLines = (items: PdfTextItem[]): string[] => {
  const sorted = [...items].sort((a, b) => {
    const yA = a.transform[5] ?? 0;
    const yB = b.transform[5] ?? 0;
    const yDiff = yB - yA;

    if (Math.abs(yDiff) > 2.5) return yDiff;

    const xA = a.transform[4] ?? 0;
    const xB = b.transform[4] ?? 0;
    return xA - xB;
  });

  const lines: string[] = [];
  let currentLine = '';
  let currentY: number | null = null;
  let lastX = 0;

  const pushCurrentLine = () => {
    const line = cleanLine(currentLine);
    if (line && !isNoiseLine(line)) {
      lines.push(line);
    }
    currentLine = '';
    currentY = null;
    lastX = 0;
  };

  for (const item of sorted) {
    const text = cleanLine(item.str);
    if (!text) continue;

    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;

    if (currentY === null || Math.abs(y - currentY) > 2.5) {
      if (currentLine) pushCurrentLine();
      currentY = y;
      currentLine = text;
      lastX = x + Math.max(item.width, text.length * 4);
      if (item.hasEOL) pushCurrentLine();
      continue;
    }

    if (x > lastX + 1.5) {
      currentLine += ' ';
    }

    currentLine += text;
    lastX = x + Math.max(item.width, text.length * 4);

    if (item.hasEOL) {
      pushCurrentLine();
    }
  }

  if (currentLine) pushCurrentLine();

  return lines;
};
