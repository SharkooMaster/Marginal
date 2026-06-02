import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font, monoFont, radius, spacing } from "../theme";

// Compact KPI tile for the dashboard, with a "cyber" accent edge and
// monospace numerics for a data-terminal feel.
export default function StatCard({ label, value, sub, tone, accent = colors.accent }) {
  return (
    <View style={styles.card}>
      <View style={[styles.edge, { backgroundColor: accent }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tone && { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    overflow: "hidden",
  },
  edge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.85,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.tiny,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: "800",
    fontFamily: monoFont,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  sub: {
    color: colors.textFaint,
    fontSize: font.tiny,
    marginTop: 4,
  },
});
