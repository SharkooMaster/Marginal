import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import StatCard from "../components/StatCard";
import MarginBar from "../components/MarginBar";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, spacing, formatSek } from "../theme";
import { useResponsive } from "../useResponsive";

export default function ProjectsScreen({ navigation }) {
  const { columns, width, isCompact } = useResponsive();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listProjects();
      setProjects(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const num = (v) => Number(v) || 0;
  const totalContract = projects.reduce((s, p) => s + num(p.contract_value), 0);
  const totalMargin = projects.reduce((s, p) => s + num(p.current_margin), 0);
  const portfolioPct = totalContract > 0 ? (totalMargin / totalContract) * 100 : 0;
  const atRiskCount = projects.filter((p) => p.is_at_risk).length;
  const openAta = projects.reduce((s, p) => s + num(p.open_ata_count), 0);

  const cardWidth =
    columns === 1 ? "100%" : `calc((100% - ${(columns - 1) * spacing.lg}px) / ${columns})`;
  const statCols = width >= 760 ? 4 : 2;
  const statWidth = `calc((100% - ${(statCols - 1) * spacing.md}px) / ${statCols})`;

  return (
    <Screen onRefresh={load} refreshing={loading}>
      <Text style={styles.title}>Översikt</Text>
      <Text style={styles.sub}>Din projektportfölj i realtid</Text>

      {isCompact ? (
        <View style={{ marginTop: spacing.lg }}>
          <PrimaryButton title="+ Nytt projekt" onPress={() => navigation.navigate("NewProject")} />
        </View>
      ) : null}

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Kunde inte nå servern</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Kontrollera att Django körs och att API-adressen i src/config.js stämmer.
          </Text>
        </Card>
      ) : null}

      <View style={[styles.statRow, { marginTop: spacing.xl }]}>
        <View style={{ width: statWidth }}>
          <StatCard label="Kontraktsvärde" value={formatSek(totalContract)} sub={`${projects.length} projekt`} />
        </View>
        <View style={{ width: statWidth }}>
          <StatCard
            label="Marginal kvar"
            value={formatSek(totalMargin)}
            tone={totalMargin >= 0 ? colors.success : colors.danger}
          />
        </View>
        <View style={{ width: statWidth }}>
          <StatCard
            label="Portföljmarginal"
            value={`${portfolioPct.toFixed(1)}%`}
            tone={atRiskCount > 0 ? colors.warning : colors.success}
          />
        </View>
        <View style={{ width: statWidth }}>
          <StatCard
            label="Kräver åtgärd"
            value={`${atRiskCount}`}
            sub={openAta > 0 ? `${openAta} öppna ÄTA` : "Inga öppna ÄTA"}
            tone={atRiskCount > 0 ? colors.danger : colors.text}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Projekt</Text>

      {projects.length === 0 && !error ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Inga projekt ännu</Text>
          <Text style={styles.emptyText}>
            Skapa ditt första projekt, lägg till budgetposter och börja följa marginalen i realtid.
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="+ Skapa projekt" onPress={() => navigation.navigate("NewProject")} />
          </View>
        </Card>
      ) : null}

      <View style={styles.grid}>
        {projects.map((item) => (
          <View key={item.id} style={{ width: cardWidth }}>
            <Card
              onPress={() =>
                navigation.navigate("ProjectDetail", { id: item.id, name: item.name })
              }
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.customer}>{item.customer_name}</Text>
                </View>
                <Pill label={item.is_at_risk ? "Risk" : "OK"} tone={item.is_at_risk ? "danger" : "success"} />
              </View>

              <View style={styles.barWrap}>
                <MarginBar marginPct={item.current_margin_pct} atRisk={item.is_at_risk} compact />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>{formatSek(item.current_margin)} kvar</Text>
                {item.open_ata_count > 0 ? (
                  <Pill label={`${item.open_ata_count} ÄTA`} tone="warning" />
                ) : null}
              </View>
            </Card>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  name: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  customer: { color: colors.textMuted, fontSize: font.small, marginTop: 3 },
  barWrap: { marginTop: spacing.xl },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  meta: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
  empty: { color: colors.textFaint, textAlign: "center", marginTop: spacing.xl },
  emptyCard: { alignItems: "flex-start", gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: font.h2, fontWeight: "700" },
  emptyText: { color: colors.textMuted, fontSize: font.body, lineHeight: 22, marginBottom: spacing.sm },
  errorCard: { borderColor: colors.danger, marginTop: spacing.xl },
  errorTitle: { color: colors.danger, fontWeight: "700", fontSize: font.body },
  errorText: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm },
  errorHint: { color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.sm },
});
