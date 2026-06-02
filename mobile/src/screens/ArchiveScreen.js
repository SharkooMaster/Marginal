import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import MarginBar from "../components/MarginBar";
import { api } from "../api";
import { colors, font, spacing, formatSek } from "../theme";
import { useResponsive } from "../useResponsive";

export default function ArchiveScreen({ navigation }) {
  const { columns } = useResponsive();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.listProjects({ archived: true });
      setProjects(data);
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

  const cardWidth =
    columns === 1 ? "100%" : `calc((100% - ${(columns - 1) * spacing.lg}px) / ${columns})`;

  return (
    <Screen onRefresh={load} refreshing={loading}>
      <Text style={styles.title}>Arkiv</Text>
      <Text style={styles.sub}>Arkiverade projekt. Öppna ett för att återställa det.</Text>

      {projects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Arkivet är tomt</Text>
          <Text style={styles.emptyText}>
            Projekt du arkiverar hamnar här. De räknas inte med i översikten.
          </Text>
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
                <Pill label="Arkiverad" tone="neutral" />
              </View>
              <View style={styles.barWrap}>
                <MarginBar marginPct={item.current_margin_pct} atRisk={item.is_at_risk} compact />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{formatSek(item.current_margin)} kvar</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  name: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  customer: { color: colors.textMuted, fontSize: font.small, marginTop: 3 },
  barWrap: { marginTop: spacing.xl },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  meta: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
  emptyCard: { marginTop: spacing.xl, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: font.h2, fontWeight: "700" },
  emptyText: { color: colors.textMuted, fontSize: font.body, lineHeight: 22 },
});
