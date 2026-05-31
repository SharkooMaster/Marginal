import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, font, radius, spacing } from "../theme";

export default function PrimaryButton({ title, onPress, loading, variant = "primary", style }) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed, hovered }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        hovered && (isGhost ? styles.ghostHover : styles.primaryHover),
        pressed && { opacity: 0.88 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.text : colors.onPrimary} />
      ) : (
        <Text style={[styles.text, isGhost && styles.ghostText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
  },
  primary: { backgroundColor: colors.primary },
  primaryHover: { backgroundColor: "#6b50e0" },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghostHover: { backgroundColor: colors.surfaceRaised, borderColor: colors.primary },
  text: {
    color: colors.onPrimary,
    fontSize: font.h3,
    fontWeight: "700",
  },
  ghostText: { color: colors.text },
});
