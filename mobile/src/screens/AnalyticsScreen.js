import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import StatCard from "../components/StatCard";
import { api } from "../api";
import { useLiveRefresh } from "../live/LiveProvider";
import { colors, font, monoFont, radius, spacing, formatSek } from "../theme";
import { useResponsive } from "../useResponsive";

// Manager analytics: margin distribution and per-project comparison.
export default function AnalyticsScreen() {
  const { width } = useResponsive();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setProjects(await api.listProjects());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useLiveRefresh(load);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const num = (v) => Number(v) || 0;
  const healthy = projects.filter((p) => !p.is_at_risk && num(p.current_margin_pct) >= 25).length;
  const watch = projects.filter((p) => !p.is_at_risk && num(p.current_margin_pct) < 25).length;
  const risk = projects.filter((p) => p.is_at_risk).length;
  const totalContract = projects.reduce((s, p) => s + num(p.contract_value), 0);
  const avgPct =
    projects.length > 0
      ? projects.reduce((s, p) => s + num(p.current_margin_pct), 0) / projects.length
      : 0;

  const statCols = width >= 760 ? 3 : 1;
  const statWidth = `calc((100% - ${(statCols - 1) * spacing.md}px) / ${statCols})`;
  const maxContract = Math.max(1, ...projects.map((p) => num(p.contract_value)));

  return (
    <Screen onRefresh={load} refreshing={loading}>
      <Text style={styles.kicker}>Analys</Text>
      <Text style={styles.title}>Marginaltrender</Text>
      <Text style={styles.sub}>Hur portföljen presterar mot budget</Text>

      <View style={[styles.statRow, { marginTop: spacing.xl }]}>
        <View style={{ width: statWidth }}>
          <StatCard label="Snittmarginal" value={`${avgPct.toFixed(1)}%`} accent={colors.primary} />
        </View>
        <View style={{ width: statWidth }}>
          <StatCard label="Total kontraktsvolym" value={formatSek(totalContract)} accent={colors.accent} />
        </View>
        <View style={{ width: statWidth }}>
          <StatCard label="Aktiva projekt" value={`${projects.length}`} accent={colors.success} />
        </View>
      </View>

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={styles.cardTitle}>Hälsofördelning</Text>
        <DistRow label="Sund (≥25%)" value={healthy} total={projects.length} tone={colors.success} />
        <DistRow label="Bevaka (<25%)" value={watch} total={projects.length} tone={colors.warning} />
        <DistRow label="I fara" value={risk} total={projects.length} tone={colors.danger} />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardTitle}>Kontraktsvärde per projekt</Text>
        {projects.length === 0 ? (
          <Text style={styles.empty}>Inga projekt att visa ännu.</Text>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {projects.map((p) => {
              const w = `${Math.max(4, (num(p.contract_value) / maxContract) * 100)}%`;
              const tone = p.is_at_risk ? colors.danger : num(p.current_margin_pct) < 25 ? colors.warning : colors.success;
              return (
                <View key={p.id}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.barValue}>{formatSek(p.contract_value)}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: w, backgroundColor: tone }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </Screen>
  );
}

function DistRow({ label, value, total, tone }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={styles.barLabelRow}>
        <Text style={styles.distLabel}>{label}</Text>
        <Text style={[styles.distValue, { color: tone }]}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(2, pct)}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  kicker: { color: colors.accent, fontSize: font.tiny, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700", marginBottom: spacing.sm },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 },
  barName: { color: colors.text, fontSize: font.small, fontWeight: "600", flex: 1, paddingRight: spacing.md },
  barValue: { color: colors.textMuted, fontSize: font.small, fontFamily: monoFont },
  distLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
  distValue: { fontSize: font.body, fontWeight: "800", fontFamily: monoFont },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  empty: { color: colors.textFaint, fontSize: font.small, marginTop: spacing.sm },
});
