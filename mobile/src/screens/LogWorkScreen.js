import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, layout, radius, spacing } from "../theme";

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textFaint} style={styles.input} {...props} />
    </View>
  );
}

export default function LogWorkScreen({ route, navigation }) {
  const { id } = route.params;
  const [mode, setMode] = useState("labor"); // "labor" | "material"
  const [outsideScope, setOutsideScope] = useState(false);
  const [saving, setSaving] = useState(false);

  const [worker, setWorker] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  function notify(title, message) {
    // Alert isn't visible on web; fall back to the browser dialog there.
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      window.alert(`${title}\n\n${message}`);
      navigation.goBack();
    } else {
      Alert.alert(title, message, [{ text: "Klar", onPress: () => navigation.goBack() }]);
    }
  }

  async function submit() {
    try {
      setSaving(true);
      if (mode === "labor") {
        await api.logCheckIn({
          project: id,
          worker_name: worker || "Okänd",
          hours: Number(hours) || 0,
          note: outsideScope ? "Extra arbete" : "",
          outside_scope: outsideScope,
        });
      } else {
        await api.logMaterial({
          project: id,
          description: description || "Material",
          quantity: Number(quantity) || 1,
          unit_cost: Number(unitCost) || 0,
          outside_scope: outsideScope,
        });
      }
      notify(
        "Sparat",
        outsideScope
          ? "Loggat och flaggat som möjlig ÄTA för granskning."
          : "Arbetet har loggats på projektet."
      );
    } catch (e) {
      if (Platform.OS === "web") window.alert("Kunde inte spara\n\n" + e.message);
      else Alert.alert("Kunde inte spara", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen maxWidth={layout.formMaxWidth}>
      <View style={styles.segment}>
        <Pressable
          style={[styles.segBtn, mode === "labor" && styles.segActive]}
          onPress={() => setMode("labor")}
        >
          <Text style={[styles.segText, mode === "labor" && styles.segTextActive]}>Arbete</Text>
        </Pressable>
        <Pressable
          style={[styles.segBtn, mode === "material" && styles.segActive]}
          onPress={() => setMode("material")}
        >
          <Text style={[styles.segText, mode === "material" && styles.segTextActive]}>Material</Text>
        </Pressable>
      </View>

      <Card>
        {mode === "labor" ? (
          <>
            <Field label="Vem arbetade?" value={worker} onChangeText={setWorker} placeholder="Namn" />
            <Field
              label="Antal timmar"
              value={hours}
              onChangeText={setHours}
              placeholder="t.ex. 8"
              keyboardType="numeric"
            />
          </>
        ) : (
          <>
            <Field
              label="Vad användes?"
              value={description}
              onChangeText={setDescription}
              placeholder="t.ex. Gipsskivor"
            />
            <Field
              label="Antal"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="t.ex. 10"
              keyboardType="numeric"
            />
            <Field
              label="Pris per styck (kr)"
              value={unitCost}
              onChangeText={setUnitCost}
              placeholder="t.ex. 89"
              keyboardType="numeric"
            />
          </>
        )}

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={styles.switchLabel}>Extra arbete utanför kontraktet?</Text>
            <Text style={styles.switchHint}>
              Flaggas automatiskt som möjlig ÄTA så att du inte missar att fakturera det.
            </Text>
          </View>
          <Switch
            value={outsideScope}
            onValueChange={setOutsideScope}
            trackColor={{ false: colors.surfaceRaised, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </Card>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton title="Spara" onPress={submit} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm - 2, alignItems: "center" },
  segActive: { backgroundColor: colors.primary },
  segText: { color: colors.textMuted, fontWeight: "700", fontSize: font.body },
  segTextActive: { color: colors.onPrimary },
  label: { color: colors.textMuted, fontSize: font.small, marginBottom: spacing.sm, fontWeight: "600" },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: font.h3,
    borderWidth: 1,
    borderColor: colors.border,
    outlineStyle: "none",
  },
  switchRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  switchLabel: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  switchHint: { color: colors.textFaint, fontSize: font.tiny, marginTop: 4 },
});
