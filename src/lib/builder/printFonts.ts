export const PRINT_FONT_LOADS = [
  '400 16px "DM Sans"',
  '500 16px "DM Sans"',
  '700 16px "DM Sans"',
  '400 16px "Ubuntu"',
  '500 16px "Ubuntu"',
  '700 16px "Ubuntu"',
  '400 16px "IBM Plex Mono"',
  '500 16px "IBM Plex Mono"',
  '700 16px "IBM Plex Mono"',
] as const;

const PRINT_FONT_SAMPLE_TEXT = 'BESbswy 0123456789';

interface FontFaceSetLike {
  load: (font: string, text?: string) => Promise<unknown>;
  ready: Promise<unknown>;
}

interface PrintFontSource {
  fonts: FontFaceSetLike;
}

export const ensurePrintFontsReady = async (
  fontSource: PrintFontSource,
): Promise<void> => {
  const fonts = fontSource.fonts;

  await Promise.allSettled(
    PRINT_FONT_LOADS.map((font) => fonts.load(font, PRINT_FONT_SAMPLE_TEXT)),
  );

  await fonts.ready;
};
