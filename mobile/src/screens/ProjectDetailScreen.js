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
import MarginBar from "../components/MarginBar";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, spacing, formatSek } from "../theme";

function Row({ label, value, tone }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, tone && { color: tone }]}>{value}</Text>
    </View>
  );
}

function BudgetBlock({ title, budget, actual }) {
  const over = Number(actual) > Number(budget);
  const pct = Number(budget) > 0 ? Math.min(100, (Number(actual) / Number(budget)) * 100) : 0;
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={styles.budgetHead}>
        <Text style={styles.budgetTitle}>{title}</Text>
        <Text style={[styles.budgetNums, over && { color: colors.danger }]}>
          {formatSek(actual)} / {formatSek(budget)}
        </Text>
      </View>
      <View style={styles.miniTrack}>
        <View
          style={[
            styles.miniFill,
            { width: `${pct}%`, backgroundColor: over ? colors.danger : colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

export default function ProjectDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getProject(id);
      setProject(data);
      navigation.setOptions({ title: data.name });
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const openAta = project.ata_items.filter(
    (a) => !["customer_approved", "rejected"].includes(a.status)
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.headRow}>
          <Text style={styles.customer}>{project.customer_name}</Text>
          {project.is_at_risk ? (
            <Pill label="Marginal i fara" tone="danger" />
          ) : (
            <Pill label="Frisk marginal" tone="success" />
          )}
        </View>
        <View style={{ marginTop: spacing.lg }}>
          <MarginBar marginPct={project.current_margin_pct} atRisk={project.is_at_risk} />
        </View>
        <View style={styles.divider} />
        <Row label="Kontraktsvärde" value={formatSek(project.contract_value)} />
        <Row label="Godkänd ÄTA" value={formatSek(project.approved_ata)} />
        <Row label="Faktisk kostnad" value={formatSek(project.actual_total)} />
        <Row
          label="Marginal kvar"
          value={formatSek(project.current_margin)}
          tone={project.is_at_risk ? colors.danger : colors.success}
        />
      </Card>

      <Text style={styles.sectionTitle}>Budget mot verkligt</Text>
      <Card>
        <BudgetBlock title="Arbete" budget={project.budgeted_labor} actual={project.actual_labor} />
        <BudgetBlock
          title="Material"
          budget={project.budgeted_materials}
          actual={project.actual_materials}
        />
      </Card>

      {openAta.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>ÄTA att hantera</Text>
          {openAta.map((a) => (
            <Card key={a.id} style={{ borderColor: colors.warning }}>
              <View style={styles.headRow}>
                <Text style={styles.ataTitle}>{a.title}</Text>
                <Pill label={a.status_display} tone="warning" />
              </View>
              <Text style={styles.ataCost}>{formatSek(a.estimated_cost)}</Text>
            </Card>
          ))}
        </>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          title="Logga arbete / material"
          onPress={() => navigation.navigate("LogWork", { id: project.id, name: project.name })}
        />
        <View style={{ height: spacing.md }} />
        <PrimaryButton
          title={`Visa ÄTA (${project.ata_items.length})`}
          variant="ghost"
          onPress={() => navigation.navigate("Ata", { id: project.id, name: project.name })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customer: { color: colors.textMuted, fontSize: font.body, flex: 1, paddingRight: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  rowLabel: { color: colors.textMuted, fontSize: font.body },
  rowValue: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: "800",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  budgetHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  budgetTitle: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  budgetNums: { color: colors.textMuted, fontSize: font.small, fontWeight: "700" },
  miniTrack: { height: 10, borderRadius: 999, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  miniFill: { height: "100%", borderRadius: 999 },
  ataTitle: { color: colors.text, fontSize: font.body, fontWeight: "700", flex: 1, paddingRight: spacing.md },
  ataCost: { color: colors.warning, fontSize: font.body, fontWeight: "700", marginTop: spacing.sm },
  actions: { marginTop: spacing.lg },
});
