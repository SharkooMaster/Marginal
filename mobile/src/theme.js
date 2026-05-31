import { Platform } from "react-native";

// Central dark theme. Brand palette is built around the two requested colors,
// kept as accents over a minimal near-black surface system.
export const colors = {
  // Requested brand colors
  primary: "#5b3fd3",
  primaryDeep: "#2b1f63",
  primarySoft: "rgba(91,63,211,0.14)",

  // Minimal dark surfaces
  background: "#0d0b14",
  surface: "#16131f",
  surfaceRaised: "#1d1929",
  border: "#241f33",
  borderStrong: "#2f2942",

  // Text
  text: "#f6f5fb",
  textMuted: "#9a93b3",
  textFaint: "#5f5977",

  // Status
  success: "#43d39a",
  successSoft: "rgba(67,211,154,0.12)",
  warning: "#f0b54b",
  warningSoft: "rgba(240,181,75,0.12)",
  danger: "#f0556b",
  dangerSoft: "rgba(240,85,107,0.12)",

  onPrimary: "#ffffff",
};

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
  contentMaxWidth: 1080,
  formMaxWidth: 560,
};

// Subtle elevation. Uses CSS box-shadow on web, native shadow elsewhere.
export function shadow(level = 1) {
  if (Platform.OS === "web") {
    const y = level * 6;
    const blur = level * 18;
    return { boxShadow: `0 ${y}px ${blur}px rgba(0,0,0,0.35)` };
  }
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: level * 4 },
    shadowOpacity: 0.3,
    shadowRadius: level * 8,
    elevation: level * 3,
  };
}

// Format a number as Swedish kronor, e.g. 185000 -> "185 000 kr".
export function formatSek(value) {
  const n = Math.round(Number(value) || 0);
  const str = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${str} kr`;
}
