import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, shadow, spacing } from "../theme";

// A surface card. If `onPress` is provided it becomes interactive with a
// subtle hover/press state (nice on desktop web).
export default function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed, hovered }) => [
          styles.card,
          hovered && styles.hovered,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(1),
  },
  hovered: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
  },
  pressed: {
    opacity: 0.9,
  },
});
