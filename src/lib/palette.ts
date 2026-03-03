/**
 * Centralised color palette for the entire scene.
 * Every hardcoded color in the app should reference a value from here.
 *
 * Naming convention follows Tailwind-style shades:
 *   100 = lightest / most desaturated
 *   900 = darkest / most saturated
 */

// ── Neutral / background ────────────────────────────────────────────
export const neutral = {
  50: "#f5f5f7",
  100: "#e0e0e0",
  200: "#c0c0c0",
  300: "#a8a8a8",
  400: "#8888aa",
  500: "#888899",
  600: "#6a6a7a",
  700: "#2a2a3a",
  800: "#1a1a26",
  900: "#12121a",
  950: "#0a0a0f",
} as const;

export const neutralHex = {
  50: 0xf5f5f7,
  100: 0xe0e0e0,
  200: 0xc0c0c0,
  300: 0xa8a8a8,
  400: 0x8888aa,
  500: 0x888899,
  600: 0x6a6a7a,
  700: 0x2a2a3a,
  800: 0x1a1a26,
  900: 0x12121a,
  950: 0x0a0a0f,
} as const;

// ── Blue ────────────────────────────────────────────────────────────
export const blue = {
  100: "#c5def5",
  200: "#bfd4f2",
  300: "#7eb8f7",
  400: "#4a9de8",
  500: "#1d76db",
  600: "#0052cc",
  700: "#003d99",
  800: "#002d73",
  900: "#001f4d",
} as const;

export const blueHex = {
  100: 0xc5def5,
  200: 0xbfd4f2,
  300: 0x7eb8f7,
  400: 0x4a9de8,
  500: 0x1d76db,
  600: 0x0052cc,
  700: 0x003d99,
  800: 0x002d73,
  900: 0x001f4d,
} as const;

// ── Green ───────────────────────────────────────────────────────────
export const green = {
  100: "#c2e0c6",
  200: "#89e051",
  300: "#56d364",
  400: "#3fb950",
  500: "#0e8a16",
  600: "#00ff88", // neon accent
  700: "#066d0e",
  800: "#044d0a",
  900: "#023306",
} as const;

export const greenHex = {
  100: 0xc2e0c6,
  200: 0x89e051,
  300: 0x56d364,
  400: 0x3fb950,
  500: 0x0e8a16,
  600: 0x00ff88,
  700: 0x066d0e,
  800: 0x044d0a,
  900: 0x023306,
} as const;

// ── Red ─────────────────────────────────────────────────────────────
export const red = {
  100: "#f9d0c4",
  200: "#f85149",
  300: "#ff6b6b",
  400: "#d93f0b",
  500: "#cc342d",
  600: "#b60205",
  700: "#8b0000",
  800: "#5c0002",
  900: "#330001",
} as const;

export const redHex = {
  100: 0xf9d0c4,
  200: 0xf85149,
  300: 0xff6b6b,
  400: 0xd93f0b,
  500: 0xcc342d,
  600: 0xb60205,
  700: 0x8b0000,
  800: 0x5c0002,
  900: 0x330001,
} as const;

// ── Orange ──────────────────────────────────────────────────────────
export const orange = {
  100: "#fef2c0",
  200: "#ffc680",
  300: "#ffa500",
  400: "#ff6b35",
  500: "#e38c00",
  600: "#d93f0b",
  700: "#b07219",
  800: "#8b5e3c",
  900: "#5c3d1f",
} as const;

export const orangeHex = {
  100: 0xfef2c0,
  200: 0xffc680,
  300: 0xffa500,
  400: 0xff6b35,
  500: 0xe38c00,
  600: 0xd93f0b,
  700: 0xb07219,
  800: 0x8b5e3c,
  900: 0x5c3d1f,
} as const;

// ── Purple / Violet ─────────────────────────────────────────────────
export const purple = {
  100: "#d4c5f9",
  200: "#c4b5e9",
  300: "#a97bff",
  400: "#7c3aed",
  500: "#5319e7",
  600: "#4010b0",
  700: "#300c80",
  800: "#200850",
  900: "#100428",
} as const;

export const purpleHex = {
  100: 0xd4c5f9,
  200: 0xc4b5e9,
  300: 0xa97bff,
  400: 0x7c3aed,
  500: 0x5319e7,
  600: 0x4010b0,
  700: 0x300c80,
  800: 0x200850,
  900: 0x100428,
} as const;

// ── Teal / Cyan ─────────────────────────────────────────────────────
export const teal = {
  100: "#bfdadc",
  200: "#7ecfd4",
  300: "#00add8",
  400: "#00919e",
  500: "#006b75",
  600: "#00555d",
  700: "#004047",
  800: "#002b30",
  900: "#001a1d",
} as const;

export const tealHex = {
  100: 0xbfdadc,
  200: 0x7ecfd4,
  300: 0x00add8,
  400: 0x00919e,
  500: 0x006b75,
  600: 0x00555d,
  700: 0x004047,
  800: 0x002b30,
  900: 0x001a1d,
} as const;

// ── Yellow ──────────────────────────────────────────────────────────
export const yellow = {
  100: "#fef2c0",
  200: "#fce588",
  300: "#fbca04",
  400: "#f7df1e",
  500: "#e0c800",
  600: "#b8a000",
  700: "#8a7800",
  800: "#5c5000",
  900: "#2e2800",
} as const;

export const yellowHex = {
  100: 0xfef2c0,
  200: 0xfce588,
  300: 0xfbca04,
  400: 0xf7df1e,
  500: 0xe0c800,
  600: 0xb8a000,
  700: 0x8a7800,
  800: 0x5c5000,
  900: 0x2e2800,
} as const;

// ── Pink ────────────────────────────────────────────────────────────
export const pink = {
  100: "#f9d0c4",
  200: "#e99695",
  300: "#cc6699",
  400: "#b05080",
  500: "#993366",
  600: "#80264d",
  700: "#661a3a",
  800: "#4d0f28",
  900: "#330a1a",
} as const;

export const pinkHex = {
  100: 0xf9d0c4,
  200: 0xe99695,
  300: 0xcc6699,
  400: 0xb05080,
  500: 0x993366,
  600: 0x80264d,
  700: 0x661a3a,
  800: 0x4d0f28,
  900: 0x330a1a,
} as const;

// ── Special / semantic ──────────────────────────────────────────────
export const white = { hex: 0xffffff, css: "#ffffff" } as const;

export const scene = {
  background: neutral[950], // "#0a0a0f"
  backgroundHex: neutralHex[950],
  floor: "#0a0a12",
  floorHex: 0x0a0a12,
  rim: neutral[800], // "#1a1a26"
  rimHex: 0x1a1a2e, // slightly bluer variant used for medallion rims
  fog: neutral[950],
} as const;

export const accent = {
  neonGreen: green[600], // "#00ff88"
  neonGreenHex: greenHex[600],
  purple: purple[400], // "#7c3aed"
  purpleHex: purpleHex[400],
  warmSpot: orange[400], // "#ff6b35"
} as const;

export const stat = {
  added: greenHex[400], // 0x3fb950
  addedCss: green[400],
  removed: redHex[200], // 0xf85149
  removedCss: red[200],
  grey: 0x8b949e,
  greyCss: "#8b949e",
} as const;

export const time = {
  fresh: { hex: 0x44ff44, css: "#44ff44" }, // < 1h — green
  recent: { hex: 0xfce588, css: "#fce588" }, // 1-2h — yellow
  stale: { hex: 0xffa500, css: "#ffa500" }, // > 2h — orange
} as const;

// ── File-extension brand colors ─────────────────────────────────────
export const extColors: Record<string, number> = {
  ts: blueHex[500], // 0x3178c6 – manually set below
  tsx: 0x3178c6,
  js: yellowHex[400], // 0xf7df1e
  jsx: yellowHex[400],
  vue: 0x42b883,
  sql: orangeHex[500], // 0xe38c00
  css: 0x264de4,
  scss: pinkHex[300], // 0xcc6699
  html: 0xe34f26,
  json: neutralHex[300], // 0xa8a8a8
  md: neutralHex[300],
  yml: 0xcb171e,
  yaml: 0xcb171e,
  py: 0x3776ab,
  rs: 0xdea584,
  go: tealHex[300], // 0x00add8
  java: orangeHex[700], // 0xb07219
  kt: purpleHex[300], // 0xa97bff
  swift: 0xf05138,
  rb: redHex[500], // 0xcc342d
  sh: greenHex[200], // 0x89e051
  prisma: 0x5a67d8,
};
// Override ts to exact brand blue
extColors.ts = 0x3178c6;

// ── Author palette (cycles through these) ───────────────────────────
export const authorPalette = [
  { hex: blueHex[500], css: blue[500] }, // blue
  { hex: greenHex[500], css: green[500] }, // green
  { hex: orangeHex[600], css: orange[600] }, // orange
  { hex: purpleHex[500], css: purple[500] }, // purple
  { hex: yellowHex[300], css: yellow[300] }, // yellow
  { hex: tealHex[500], css: teal[500] }, // teal
  { hex: redHex[600], css: red[600] }, // red
  { hex: blueHex[600], css: blue[600] }, // dark blue
  { hex: pinkHex[200], css: pink[200] }, // pink
  { hex: blueHex[100], css: blue[100] }, // light blue
  { hex: purpleHex[100], css: purple[100] }, // lavender
  { hex: greenHex[100], css: green[100] }, // light green
  { hex: redHex[100], css: red[100] }, // peach
  { hex: tealHex[100], css: teal[100] }, // light teal
  { hex: yellowHex[100], css: yellow[100] }, // light yellow
  { hex: blueHex[200], css: blue[200] }, // periwinkle
] as const;
