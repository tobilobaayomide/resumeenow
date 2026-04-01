export interface AppFontDefinition {
  family: string;
  weights: readonly number[];
  usage: readonly string[];
}

export const FONT_STACKS = {
  sans: '"DM Sans", sans-serif',
  accent: '"Ubuntu", sans-serif',
  mono:
    '"IBM Plex Mono", ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
} as const;

export const APP_FONT_REGISTRY = [
  {
    family: "DM Sans",
    weights: [400, 500, 700],
    usage: ["App shell", "Default resume templates"],
  },
  {
    family: "Ubuntu",
    weights: [400, 500, 700],
    usage: ["Accent and alternate template typography"],
  },
  {
    family: "IBM Plex Mono",
    weights: [400, 500, 700],
    usage: ["Mono and Silicon templates"],
  },
] as const satisfies readonly AppFontDefinition[];

export const buildPrintFontLoads = (
  registry: readonly AppFontDefinition[] = APP_FONT_REGISTRY,
  fontSizePx = 16,
): string[] =>
  registry.flatMap((font) =>
    font.weights.map((weight) => `${weight} ${fontSizePx}px "${font.family}"`),
  );
