import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../theme";

// Slim gauge of remaining margin relative to revenue.
export default function MarginBar({ marginPct, atRisk, compact }) {
  const pct = Math.max(0, Math.min(100, Number(marginPct) || 0));
  const tone = atRisk ? colors.danger : pct < 25 ? colors.warning : colors.success;

  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tone }]} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.pct, { color: tone, fontSize: compact ? font.h2 : font.h1 }]}>
          {pct.toFixed(1)}%
        </Text>
        <Text style={styles.label}>marginal kvar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing.md,
  },
  pct: {
    fontWeight: "800",
    marginRight: spacing.sm,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: font.small,
    color: colors.textMuted,
  },
});
