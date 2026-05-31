import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../theme";

export default function Pill({ label, tone = "neutral" }) {
  const toneStyle = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: toneStyle.bg }]}>
      <Text style={[styles.text, { color: toneStyle.fg }]}>{label}</Text>
    </View>
  );
}

const TONES = {
  neutral: { bg: colors.surfaceRaised, fg: colors.textMuted },
  brand: { bg: colors.primary, fg: colors.onPrimary },
  success: { bg: "rgba(63,211,154,0.15)", fg: colors.success },
  warning: { bg: "rgba(240,181,75,0.16)", fg: colors.warning },
  danger: { bg: "rgba(240,85,107,0.16)", fg: colors.danger },
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: font.tiny,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
