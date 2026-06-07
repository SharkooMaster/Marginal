import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import MarginBar from "../components/MarginBar";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useLiveRefresh } from "../live/LiveProvider";
import { colors, font, glow, radius, spacing, formatSek } from "../theme";
import { useResponsive } from "../useResponsive";

function CardBudget({ budget, actual }) {
  const b = Number(budget) || 0;
  const a = Number(actual) || 0;
  const over = a > b;
  const rawPct = b > 0 ? (a / b) * 100 : a > 0 ? 100 : 0;
  const barPct = Math.min(100, rawPct);
  const diff = b - a;

  const pctLabel = b > 0 ? `${Math.round(rawPct)}% av budget` : "Ingen budget";
  const diffLabel =
    b > 0
      ? over
        ? `${formatSek(Math.abs(diff))} över`
        : `${formatSek(diff)} kvar`
      : a > 0
      ? `${formatSek(a)} oplanerat`
      : "—";
  const diffTone = over ? colors.danger : b > 0 ? colors.success : colors.textMuted;

  return (
    <View style={styles.budgetWrap}>
      <View style={styles.budgetTrack}>
        <View
          style={[
            styles.budgetFill,
            { width: `${barPct}%`, backgroundColor: over ? colors.danger : colors.primary },
          ]}
        />
      </View>
      <View style={styles.budgetFoot}>
        <Text style={styles.budgetPct}>{pctLabel}</Text>
        <Text style={[styles.budgetDiff, { color: diffTone }]}>{diffLabel}</Text>
      </View>
    </View>
  );
}

export default function ProjectsScreen({ navigation }) {
  const { columns, isCompact } = useResponsive();
  const { isManager } = useAuth();
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
  useLiveRefresh(load);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const cardWidth =
    columns === 1 ? "100%" : `calc((100% - ${(columns - 1) * spacing.lg}px) / ${columns})`;

  return (
    <Screen onRefresh={load} refreshing={loading}>
      <View style={[styles.sectionHeader, isCompact && styles.sectionHeaderCompact]}>
        <View>
          <Text style={styles.kicker}>Portfölj</Text>
          <Text style={styles.title}>Projekt</Text>
        </View>
        {isManager && projects.length > 0 ? (
          <Pressable
            onPress={() => navigation.navigate("NewProject")}
            hitSlop={8}
            style={({ pressed, hovered }) => [
              styles.addBtn,
              hovered && styles.addBtnHover,
              pressed && styles.addBtnPressed,
              isCompact && styles.addBtnCompact,
            ]}
          >
            <Text style={styles.addBtnText}>+ Nytt projekt</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Kunde inte nå servern</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Kontrollera att Django körs och att API-adressen i src/config.js stämmer.
          </Text>
        </Card>
      ) : null}

      {projects.length === 0 && !error ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Inga projekt ännu</Text>
          <Text style={styles.emptyText}>
            {isManager
              ? "Skapa ditt första projekt, lägg till budgetposter och börja följa marginalen i realtid."
              : "Din chef lägger till projekt som du kan rapportera på."}
          </Text>
          {isManager ? (
            <View style={{ width: "100%" }}>
              <PrimaryButton title="+ Skapa projekt" onPress={() => navigation.navigate("NewProject")} />
            </View>
          ) : null}
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
                {(() => {
                  const pct = Number(item.current_margin_pct) || 0;
                  if (item.is_at_risk) return <Pill label="Risk" tone="danger" />;
                  if (pct < 25) return <Pill label="Bevaka" tone="warning" />;
                  return <Pill label="Frisk" tone="success" />;
                })()}
              </View>

              <View style={styles.barWrap}>
                <MarginBar marginPct={item.current_margin_pct} atRisk={item.is_at_risk} compact />
              </View>

              <CardBudget budget={item.budgeted_total} actual={item.actual_total} />

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
  kicker: { color: colors.accent, fontSize: font.tiny, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  sectionHeaderCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionActions: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  addBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    ...glow(colors.primary, 0.45),
  },
  addBtnHover: { backgroundColor: colors.primaryDeep, borderColor: colors.primary },
  addBtnPressed: { opacity: 0.85 },
  addBtnCompact: { alignSelf: "stretch", alignItems: "center" },
  addBtnText: { color: colors.onPrimary, fontSize: font.small, fontWeight: "800", letterSpacing: 0.2 },
  mutedLink: { color: colors.textMuted, fontSize: font.small, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  name: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  customer: { color: colors.textMuted, fontSize: font.small, marginTop: 3 },
  barWrap: { marginTop: spacing.xl },
  budgetWrap: { marginTop: spacing.lg },
  budgetTrack: { height: 6, borderRadius: 999, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  budgetFill: { height: "100%", borderRadius: 999 },
  budgetFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  budgetPct: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700" },
  budgetDiff: { fontSize: font.tiny, fontWeight: "800" },
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
