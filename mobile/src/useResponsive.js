import { useWindowDimensions } from "react-native";

// Breakpoint helpers so the same screens read well on phone and desktop.
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isCompact: width < 600,
    isMedium: width >= 600 && width < 1000,
    isWide: width >= 1000,
    // Project grid columns scale with available width.
    columns: width >= 1240 ? 3 : width >= 720 ? 2 : 1,
  };
}
