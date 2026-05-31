// Central dark theme. Brand palette is built around the two requested colors.
export const colors = {
  // Requested brand colors
  primary: "#5b3fd3",
  primaryDeep: "#2b1f63",

  // Derived dark surfaces
  background: "#15121f",
  surface: "#1d1830",
  surfaceRaised: "#251f3d",
  border: "#322a52",

  // Text
  text: "#f4f2fb",
  textMuted: "#a79fc9",
  textFaint: "#6f6890",

  // Status
  success: "#3fd39a",
  warning: "#f0b54b",
  danger: "#f0556b",

  // On-primary
  onPrimary: "#ffffff",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const font = {
  h1: 26,
  h2: 20,
  h3: 17,
  body: 15,
  small: 13,
  tiny: 11,
};

// Format a number as Swedish kronor, e.g. 185000 -> "185 000 kr".
export function formatSek(value) {
  const n = Math.round(Number(value) || 0);
  const str = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${str} kr`;
}
