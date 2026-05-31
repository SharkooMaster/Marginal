import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../theme";

// Compact KPI tile for the dashboard.
export default function StatCard({ label, value, sub, tone }) {
  return (
    <View style={styles.card}>
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
  },
  label: {
    color: colors.textMuted,
    fontSize: font.tiny,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  sub: {
    color: colors.textFaint,
    fontSize: font.tiny,
    marginTop: 4,
  },
});
