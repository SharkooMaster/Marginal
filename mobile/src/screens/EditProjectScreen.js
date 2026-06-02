import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, layout, spacing } from "../theme";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "";
}

export default function EditProjectScreen({ route, navigation }) {
  const { id } = route.params;
  const [name, setName] = useState(route.params.name || "");
  const [customer, setCustomer] = useState(route.params.customer_name || "");
  const [contractValue, setContractValue] = useState(num(route.params.contract_value));
  const [threshold, setThreshold] = useState(num(route.params.margin_alert_threshold_pct) || "10");
  const [saving, setSaving] = useState(false);

  function fail(msg) {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("Kunde inte spara", msg);
  }

  async function save() {
    if (!name.trim()) {
      fail("Ange ett projektnamn.");
      return;
    }
    try {
      setSaving(true);
      await api.updateProject(id, {
        name: name.trim(),
        customer_name: customer.trim() || "Ny kund",
        contract_value: Number(contractValue) || 0,
        margin_alert_threshold_pct: Number(threshold) || 10,
      });
      navigation.goBack();
    } catch (e) {
      fail("Kunde inte spara ändringarna: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen maxWidth={layout.formMaxWidth}>
      <View style={styles.head}>
        <Text style={styles.title}>Redigera projekt</Text>
        <Text style={styles.sub}>Uppdatera namn, kund och kontraktsvärde.</Text>
      </View>
      <Card>
        <TextField
          label="Projektnamn"
          value={name}
          onChangeText={setName}
          placeholder="t.ex. Köksrenovering Storgatan 4"
        />
        <TextField
          label="Kund"
          value={customer}
          onChangeText={setCustomer}
          placeholder="t.ex. Familjen Svensson"
        />
        <TextField
          label="Kontraktsvärde (kr)"
          value={contractValue}
          onChangeText={setContractValue}
          placeholder="t.ex. 185000"
          keyboardType="numeric"
        />
        <TextField
          label="Marginallarm under (%)"
          value={threshold}
          onChangeText={setThreshold}
          placeholder="10"
          keyboardType="numeric"
        />
        <PrimaryButton title="Spara ändringar" onPress={save} loading={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: spacing.sm, lineHeight: 22 },
});
