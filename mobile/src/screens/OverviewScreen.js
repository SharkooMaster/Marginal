import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import StatCard from "../components/StatCard";
import MarginBar from "../components/MarginBar";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useLiveRefresh } from "../live/LiveProvider";
import { colors, font, spacing, formatSek } from "../theme";
import { useResponsive } from "../useResponsive";

// Manager landing: a focused, at-a-glance command center for the company.
export default function OverviewScreen({ navigation }) {
  const { width } = useResponsive();
  const { company } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProjects(await api.listProjects());
    } catch (e) {
      setError(e.message);
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
  const totalContract = projects.reduce((s, p) => s + num(p.contract_value), 0);
  const totalMargin = projects.reduce((s, p) => s + num(p.current_margin), 0);
  const portfolioPct = totalContract > 0 ? (totalMargin / totalContract) * 100 : 0;
  const atRisk = projects.filter((p) => p.is_at_risk);
  const openAta = projects.reduce((s, p) => s + num(p.open_ata_count), 0);

  const statCols = width >= 760 ? 4 : 2;
  const statWidth = `calc((100% - ${(statCols - 1) * spacing.md}px) / ${statCols})`;

  return (
    <Screen onRefresh={load} refreshing={loading}>
      <Text style={styles.kicker}>{company || "Marginal"}</Text>
      <Text style={styles.title}>Översikt</Text>
      <Text style={styles.sub}>Företagets projektportfölj i realtid</Text>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Kunde inte nå servern</Text>
          <Text style={styles.errorText}>{error}</Text>
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
            accent={colors.success}
          />
        </View>
        <View style={{ width: statWidth }}>
          <StatCard
            label="Portföljmarginal"
            value={`${portfolioPct.toFixed(1)}%`}
            tone={atRisk.length > 0 ? colors.warning : colors.success}
            accent={colors.primary}
          />
        </View>
        <View style={{ width: statWidth }}>
          <StatCard
            label="Kräver åtgärd"
            value={`${atRisk.length}`}
            sub={openAta > 0 ? `${openAta} öppna ÄTA` : "Inga öppna ÄTA"}
            tone={atRisk.length > 0 ? colors.danger : colors.text}
            accent={atRisk.length > 0 ? colors.danger : colors.accent}
          />
        </View>
      </View>

      <View style={styles.quickRow}>
        <QuickAction label="Nytt projekt" hint="Skapa & budgetera" onPress={() => navigation.navigate("NewProject")} />
        <QuickAction label="Alla projekt" hint="Hantera portfölj" onPress={() => navigation.navigate("Projects")} />
        <QuickAction label="Analys" hint="Marginaltrender" onPress={() => navigation.navigate("Analytics")} />
        <QuickAction label="Team" hint="Bjud in hantverkare" onPress={() => navigation.navigate("Team")} />
      </View>

      <Text style={styles.sectionTitle}>Projekt i fara</Text>
      {atRisk.length === 0 ? (
        <Card>
          <Text style={styles.calmTitle}>Allt under kontroll</Text>
          <Text style={styles.calmText}>Inga projekt ligger under sin marginalgräns just nu.</Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {atRisk.map((p) => (
            <Card key={p.id} onPress={() => navigation.navigate("ProjectDetail", { id: p.id, name: p.name })}>
              <View style={styles.riskTop}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={styles.riskName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.riskCustomer}>{p.customer_name}</Text>
                </View>
                <Pill label="Risk" tone="danger" />
              </View>
              <View style={{ marginTop: spacing.lg }}>
                <MarginBar marginPct={p.current_margin_pct} atRisk={p.is_at_risk} compact />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function QuickAction({ label, hint, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.quick,
        hovered && styles.quickHover,
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  kicker: { color: colors.accent, fontSize: font.tiny, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl },
  quick: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  quickHover: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  quickLabel: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  quickHint: { color: colors.textMuted, fontSize: font.small, marginTop: 3 },
  sectionTitle: { color: colors.text, fontSize: font.h2, fontWeight: "700", letterSpacing: -0.3, marginTop: spacing.xxl, marginBottom: spacing.md },
  calmTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  calmText: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
  riskTop: { flexDirection: "row", alignItems: "flex-start" },
  riskName: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  riskCustomer: { color: colors.textMuted, fontSize: font.small, marginTop: 3 },
  errorCard: { borderColor: colors.danger, marginTop: spacing.xl },
  errorTitle: { color: colors.danger, fontWeight: "700", fontSize: font.body },
  errorText: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm },
});
