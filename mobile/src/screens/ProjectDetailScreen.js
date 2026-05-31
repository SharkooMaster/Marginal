import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import MarginBar from "../components/MarginBar";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, spacing, formatSek } from "../theme";
import { useResponsive } from "../useResponsive";

function Row({ label, value, tone, strong }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong, tone && { color: tone }]}>
        {value}
      </Text>
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
  const { isWide } = useResponsive();
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

  const overview = (
    <Card>
      <View style={styles.headRow}>
        <Text style={styles.customer}>{project.customer_name}</Text>
        <Pill
          label={project.is_at_risk ? "Marginal i fara" : "Frisk marginal"}
          tone={project.is_at_risk ? "danger" : "success"}
        />
      </View>
      <View style={{ marginTop: spacing.xl }}>
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
        strong
      />
    </Card>
  );

  const hasScope = project.scope_items && project.scope_items.length > 0;

  const budget = (
    <>
      <Text style={styles.sectionTitle}>Budget mot verkligt</Text>
      <Card>
        {hasScope ? (
          <>
            <BudgetBlock title="Arbete" budget={project.budgeted_labor} actual={project.actual_labor} />
            <BudgetBlock
              title="Material"
              budget={project.budgeted_materials}
              actual={project.actual_materials}
            />
            <View style={styles.divider} />
            {project.scope_items.map((s) => (
              <View key={s.id} style={styles.scopeRow}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={styles.scopeDesc} numberOfLines={1}>
                    {s.description}
                  </Text>
                  <Text style={styles.scopeMeta}>
                    {s.item_type === "labor" ? "Arbete" : "Material"} · {Number(s.quantity)} {s.unit}
                  </Text>
                </View>
                <Text style={styles.scopeCost}>{formatSek(s.line_total)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.scopeEmpty}>
            Ingen budget ännu. Lägg till budgetposter för att följa marginal och fånga ÄTA.
          </Text>
        )}
        <View style={{ height: spacing.md }} />
        <PrimaryButton
          title="+ Lägg till budgetpost"
          variant="ghost"
          onPress={() => navigation.navigate("AddScope", { id: project.id, name: project.name })}
        />
      </Card>
    </>
  );

  const actions = (
    <Card>
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
    </Card>
  );

  const ata =
    openAta.length > 0 ? (
      <>
        <Text style={styles.sectionTitle}>ÄTA att hantera</Text>
        {openAta.map((a) => (
          <Card key={a.id} style={styles.ataCard}>
            <View style={styles.headRow}>
              <Text style={styles.ataTitle}>{a.title}</Text>
              <Pill label={a.status_display} tone="warning" />
            </View>
            <Text style={styles.ataCost}>{formatSek(a.estimated_cost)}</Text>
          </Card>
        ))}
      </>
    ) : null;

  if (isWide) {
    return (
      <Screen>
        <View style={styles.twoCol}>
          <View style={styles.colMain}>
            {overview}
            {budget}
          </View>
          <View style={styles.colSide}>
            {actions}
            {ata}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {overview}
      {budget}
      {ata}
      <View style={{ marginTop: spacing.lg }}>{actions}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  twoCol: { flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" },
  colMain: { flex: 1.4 },
  colSide: { flex: 1, minWidth: 300 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customer: { color: colors.textMuted, fontSize: font.body, flex: 1, paddingRight: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  rowLabel: { color: colors.textMuted, fontSize: font.body },
  rowValue: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  rowValueStrong: { fontSize: font.h3, fontWeight: "800" },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  budgetHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  budgetTitle: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  budgetNums: { color: colors.textMuted, fontSize: font.small, fontWeight: "700" },
  miniTrack: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  miniFill: { height: "100%", borderRadius: 999 },
  scopeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  scopeDesc: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  scopeMeta: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  scopeCost: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  scopeEmpty: { color: colors.textMuted, fontSize: font.small, lineHeight: 20 },
  ataCard: { borderColor: colors.warningSoft, marginBottom: spacing.md },
  ataTitle: { color: colors.text, fontSize: font.body, fontWeight: "700", flex: 1, paddingRight: spacing.md },
  ataCost: { color: colors.warning, fontSize: font.h3, fontWeight: "800", marginTop: spacing.sm },
});
