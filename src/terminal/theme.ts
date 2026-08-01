export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const ITALIC = "\x1b[3m";
export const UNDERLINE = "\x1b[4m";
export const REVERSE = "\x1b[7m";

export const FG = {
  black: 30, red: 31, green: 32, yellow: 33, blue: 34,
  magenta: 35, cyan: 36, white: 37, gray: 90,
  brightRed: 91, brightGreen: 92, brightYellow: 93,
  brightBlue: 94, brightMagenta: 95, brightCyan: 96, brightWhite: 97
};

export const BG = {
  black: 40, red: 41, green: 42, yellow: 43, blue: 44,
  magenta: 45, cyan: 46, white: 47, gray: 100,
  brightRed: 101, brightGreen: 102, brightYellow: 103,
  brightBlue: 104, brightMagenta: 105, brightCyan: 106, brightWhite: 107
};

export function paint(text: string, color: number, bg?: number): string {
  const bgCode = bg !== undefined ? `;${bg}` : "";
  return `\x1b[${color}${bgCode}m${text}${RESET}`;
}

export function bold(text: string): string { return `${BOLD}${text}${RESET}`; }
export function dim(text: string): string { return `${DIM}${text}${RESET}`; }
export function italic(text: string): string { return `${ITALIC}${text}${RESET}`; }
export function underline(text: string): string { return `${UNDERLINE}${text}${RESET}`; }
export function reverse(text: string): string { return `${REVERSE}${text}${RESET}`; }

export const color = {
  red: (s: string) => paint(s, FG.red),
  green: (s: string) => paint(s, FG.green),
  yellow: (s: string) => paint(s, FG.yellow),
  blue: (s: string) => paint(s, FG.blue),
  magenta: (s: string) => paint(s, FG.magenta),
  cyan: (s: string) => paint(s, FG.cyan),
  white: (s: string) => paint(s, FG.white),
  gray: (s: string) => paint(s, FG.gray),
  brightRed: (s: string) => paint(s, FG.brightRed),
  brightGreen: (s: string) => paint(s, FG.brightGreen),
  brightYellow: (s: string) => paint(s, FG.brightYellow),
  brightBlue: (s: string) => paint(s, FG.brightBlue),
  brightMagenta: (s: string) => paint(s, FG.brightMagenta),
  brightCyan: (s: string) => paint(s, FG.brightCyan),
  brightWhite: (s: string) => paint(s, FG.brightWhite)
};

export const c = color;

export const RULER_LIGHT = "─";
export const RULER_HEAVY = "═";
export const RULER_DOUBLE = "█";

export function ruler(char: string, length: number = 58): string {
  return char.repeat(length);
}

export function pad(text: string, width: number): string {
  return text.padEnd(width);
}
