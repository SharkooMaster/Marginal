import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Card from "../components/Card";
import Pill from "../components/Pill";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, spacing, formatSek } from "../theme";

const NEXT_LABEL = {
  detected: "Skicka till granskning",
  pending_review: "Godkänn internt",
  approved_internal: "Skicka till kund",
  sent_to_customer: "Markera godkänd av kund",
};

function toneFor(status) {
  if (status === "customer_approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export default function AtaScreen({ route }) {
  const { id } = route.params;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const all = await api.listAta();
    setItems(all.filter((a) => a.project === id));
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function advance(itemId) {
    setBusyId(itemId);
    try {
      await api.advanceAta(itemId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(itemId) {
    setBusyId(itemId);
    try {
      await api.rejectAta(itemId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        ÄTA-arbete (ändrings-, tilläggs- och avgående arbeten) fångas upp automatiskt och
        följer en tydlig godkännandekedja.
      </Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>Inga ÄTA registrerade på projektet.</Text>
      ) : (
        items.map((a) => {
          const nextLabel = NEXT_LABEL[a.status];
          const done = a.status === "customer_approved" || a.status === "rejected";
          return (
            <Card key={a.id}>
              <View style={styles.headRow}>
                <Text style={styles.title}>{a.title}</Text>
                <Pill label={a.status_display} tone={toneFor(a.status)} />
              </View>
              {a.description ? <Text style={styles.desc}>{a.description}</Text> : null}
              <Text style={styles.cost}>{formatSek(a.estimated_cost)}</Text>
              {a.notify_deadline ? (
                <Text style={styles.deadline}>Notifiera kund senast: {a.notify_deadline}</Text>
              ) : null}

              {!done ? (
                <View style={styles.actions}>
                  {nextLabel ? (
                    <PrimaryButton
                      title={nextLabel}
                      loading={busyId === a.id}
                      onPress={() => advance(a.id)}
                    />
                  ) : null}
                  <View style={{ height: spacing.sm }} />
                  <PrimaryButton title="Avvisa" variant="ghost" onPress={() => reject(a.id)} />
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { color: colors.textMuted, fontSize: font.small, marginBottom: spacing.lg, lineHeight: 20 },
  empty: { color: colors.textFaint, textAlign: "center", marginTop: spacing.xl },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.text, fontSize: font.h3, fontWeight: "700", flex: 1, paddingRight: spacing.md },
  desc: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm, lineHeight: 19 },
  cost: { color: colors.warning, fontSize: font.h3, fontWeight: "800", marginTop: spacing.md },
  deadline: { color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.sm },
  actions: { marginTop: spacing.lg },
});
