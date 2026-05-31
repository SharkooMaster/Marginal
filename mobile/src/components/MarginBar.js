import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../theme";

// Visual gauge: how much margin is left relative to revenue.
export default function MarginBar({ marginPct, atRisk }) {
  const pct = Math.max(0, Math.min(100, Number(marginPct) || 0));
  const tone = atRisk ? colors.danger : pct < 25 ? colors.warning : colors.success;

  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tone }]} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.pct, { color: tone }]}>{pct.toFixed(1)}%</Text>
        <Text style={styles.label}>marginal kvar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 14,
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
    marginTop: spacing.sm,
  },
  pct: {
    fontSize: font.h2,
    fontWeight: "800",
    marginRight: spacing.sm,
  },
  label: {
    fontSize: font.small,
    color: colors.textMuted,
  },
});
