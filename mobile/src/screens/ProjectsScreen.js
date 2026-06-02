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
import { colors, font, spacing, formatSek } from "../theme";
import { useResponsive } from "../useResponsive";

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
          <Pressable onPress={() => navigation.navigate("NewProject")} hitSlop={8}>
            <Text style={styles.addLink}>+ Nytt projekt</Text>
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
  addLink: { color: colors.primary, fontSize: font.small, fontWeight: "800" },
  mutedLink: { color: colors.textMuted, fontSize: font.small, fontWeight: "700" },
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
