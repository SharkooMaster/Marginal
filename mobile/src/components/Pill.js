import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius } from "../theme";

export default function Pill({ label, tone = "neutral" }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {t.dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const TONES = {
  neutral: { bg: colors.surfaceRaised, fg: colors.textMuted, dot: false },
  brand: { bg: colors.primarySoft, fg: "#b6a6f5", dot: true },
  success: { bg: colors.successSoft, fg: colors.success, dot: true },
  warning: { bg: colors.warningSoft, fg: colors.warning, dot: true },
  danger: { bg: colors.dangerSoft, fg: colors.danger, dot: true },
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: font.tiny,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
