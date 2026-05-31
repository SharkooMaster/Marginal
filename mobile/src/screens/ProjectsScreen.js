import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Card from "../components/Card";
import Pill from "../components/Pill";
import MarginBar from "../components/MarginBar";
import { api } from "../api";
import { colors, font, spacing, formatSek } from "../theme";

export default function ProjectsScreen({ navigation }) {
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

  return (
    <FlatList
      data={projects}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.greeting}>Dina projekt</Text>
          <Text style={styles.sub}>Håll koll på marginalen i realtid</Text>
          {error ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorTitle}>Kunde inte nå servern</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorHint}>
                Kontrollera att Django körs och att API-adressen i src/config.js stämmer.
              </Text>
            </Card>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !error ? (
          <Text style={styles.empty}>Inga projekt ännu.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate("ProjectDetail", { id: item.id, name: item.name })}
        >
          <Card>
            <View style={styles.cardTop}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.customer}>{item.customer_name}</Text>
              </View>
              {item.is_at_risk ? (
                <Pill label="Risk" tone="danger" />
              ) : (
                <Pill label="OK" tone="success" />
              )}
            </View>

            <View style={styles.barWrap}>
              <MarginBar marginPct={item.current_margin_pct} atRisk={item.is_at_risk} />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatSek(item.current_margin)} marginal</Text>
              {item.open_ata_count > 0 ? (
                <Pill label={`${item.open_ata_count} ÄTA att hantera`} tone="warning" />
              ) : null}
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.sm },
  greeting: { color: colors.text, fontSize: font.h1, fontWeight: "800" },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 2, marginBottom: spacing.lg },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  name: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  customer: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  barWrap: { marginTop: spacing.lg },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  meta: { color: colors.textMuted, fontSize: font.small },
  empty: { color: colors.textFaint, textAlign: "center", marginTop: spacing.xl },
  errorCard: { borderColor: colors.danger },
  errorTitle: { color: colors.danger, fontWeight: "700", fontSize: font.body },
  errorText: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm },
  errorHint: { color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.sm },
});
