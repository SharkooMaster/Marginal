import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, layout, spacing } from "../theme";

export default function NewProjectScreen({ navigation }) {
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [threshold, setThreshold] = useState("10");
  const [saving, setSaving] = useState(false);

  function fail(msg) {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("Kunde inte skapa projekt", msg);
  }

  async function save() {
    if (!name.trim()) {
      fail("Ange ett projektnamn.");
      return;
    }
    try {
      setSaving(true);
      const project = await api.createProject({
        name: name.trim(),
        customer_name: customer.trim() || "Ny kund",
        contract_value: Number(contractValue) || 0,
        margin_alert_threshold_pct: Number(threshold) || 10,
      });
      // Replace this screen so back returns to the dashboard, then open detail.
      navigation.replace("ProjectDetail", { id: project.id, name: project.name });
    } catch (e) {
      fail("Kunde inte skapa projektet: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen maxWidth={layout.formMaxWidth}>
      <View style={styles.head}>
        <Text style={styles.title}>Nytt projekt</Text>
        <Text style={styles.sub}>Lägg upp grunderna. Budgetposter lägger du till på projektet.</Text>
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
        <PrimaryButton title="Skapa projekt" onPress={save} loading={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: spacing.sm, lineHeight: 22 },
});
