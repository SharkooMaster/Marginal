import { Platform } from "react-native";

// Central dark theme. Brand palette is built around the two requested colors,
// over a deep near-black "cyber" surface system with a neon cyan accent.
export const colors = {
  // Requested brand colors
  primary: "#6b4bff",
  primaryDeep: "#2b1f63",
  primarySoft: "rgba(107,75,255,0.16)",

  // Cyber accent (neon cyan) used for highlights, glow and active states
  accent: "#34e4ea",
  accentSoft: "rgba(52,228,234,0.14)",

  // Deep near-black surfaces
  background: "#070611",
  backgroundElev: "#0b0a16",
  surface: "#100e1c",
  surfaceRaised: "#171527",
  border: "#211d36",
  borderStrong: "#2c2745",
  gridLine: "rgba(124,108,255,0.07)",

  // Text
  text: "#f4f3fb",
  textMuted: "#928cad",
  textFaint: "#5a546f",

  // Status
  success: "#3ce0a0",
  successSoft: "rgba(60,224,160,0.12)",
  warning: "#f0b54b",
  warningSoft: "rgba(240,181,75,0.12)",
  danger: "#f0556b",
  dangerSoft: "rgba(240,85,107,0.12)",

  onPrimary: "#ffffff",
};

// Monospace stack for KPI numerics (the "cyber" data feel).
export const monoFont = Platform.select({
  web: "ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, monospace",
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 36,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const font = {
  display: 30,
  h1: 24,
  h2: 19,
  h3: 16,
  body: 15,
  small: 13,
  tiny: 11,
};

export const layout = {
  contentMaxWidth: 1240,
  formMaxWidth: 560,
  sidebarWidth: 248,
};

// Subtle elevation. Uses CSS box-shadow on web, native shadow elsewhere.
export function shadow(level = 1) {
  if (Platform.OS === "web") {
    const y = level * 6;
    const blur = level * 18;
    return { boxShadow: `0 ${y}px ${blur}px rgba(0,0,0,0.45)` };
  }
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: level * 4 },
    shadowOpacity: 0.35,
    shadowRadius: level * 8,
    elevation: level * 3,
  };
}

// Neon glow effect (web only) for the cyber accent highlights.
export function glow(color = colors.accent, strength = 0.5) {
  if (Platform.OS === "web") {
    return { boxShadow: `0 0 18px ${hexAlpha(color, strength)}` };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: strength,
    shadowRadius: 12,
    elevation: 6,
  };
}

function hexAlpha(hex, alpha) {
  if (!hex.startsWith("#")) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Format a number as Swedish kronor, e.g. 185000 -> "185 000 kr".
export function formatSek(value) {
  const n = Math.round(Number(value) || 0);
  const str = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${str} kr`;
}
