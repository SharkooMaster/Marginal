import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useLiveRefresh } from "../live/LiveProvider";
import { colors, font, spacing } from "../theme";

// Worker landing: "what do I do now" — pick a project and report.
export default function WorkerHomeScreen({ navigation }) {
  const { user, company } = useAuth();
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

  const firstName = (user?.full_name || "").split(" ")[0] || "";

  return (
    <Screen onRefresh={load} refreshing={loading}>
      <Text style={styles.kicker}>{company}</Text>
      <Text style={styles.title}>Hej{firstName ? ` ${firstName}` : ""}</Text>
      <Text style={styles.sub}>Välj ett projekt och rapportera tid, material eller foton.</Text>

      <Text style={styles.sectionTitle}>Mina projekt</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
      ) : projects.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>Inga projekt ännu</Text>
          <Text style={styles.emptyText}>Din chef lägger till projekt som du kan rapportera på.</Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {projects.map((p) => (
            <Card key={p.id}>
              <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.customer}>{p.customer_name}</Text>
              <View style={styles.actions}>
                <ReportBtn label="Rapportera" primary onPress={() => navigation.navigate("Report", { id: p.id, name: p.name })} />
                <ReportBtn label="Detaljer" onPress={() => navigation.navigate("ProjectDetail", { id: p.id, name: p.name })} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function ReportBtn({ label, primary, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.btn,
        primary ? styles.btnPrimary : styles.btnGhost,
        hovered && (primary ? styles.btnPrimaryHover : styles.btnGhostHover),
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={[styles.btnText, !primary && styles.btnGhostText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.accent, fontSize: font.tiny, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 4, lineHeight: 22 },
  sectionTitle: { color: colors.text, fontSize: font.h2, fontWeight: "700", marginTop: spacing.xxl, marginBottom: spacing.md },
  name: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  customer: { color: colors.textMuted, fontSize: font.small, marginTop: 3 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryHover: { backgroundColor: "#7c5cff" },
  btnGhost: { borderWidth: 1, borderColor: colors.borderStrong },
  btnGhostHover: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  btnText: { color: colors.onPrimary, fontSize: font.body, fontWeight: "700" },
  btnGhostText: { color: colors.text },
  emptyTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  emptyText: { color: colors.textMuted, fontSize: font.body, marginTop: 4, lineHeight: 22 },
});
