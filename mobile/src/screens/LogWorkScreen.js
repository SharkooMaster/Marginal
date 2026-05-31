import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, radius, spacing } from "../theme";

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export default function LogWorkScreen({ route, navigation }) {
  const { id } = route.params;
  const [mode, setMode] = useState("labor"); // "labor" | "material"
  const [outsideScope, setOutsideScope] = useState(false);
  const [saving, setSaving] = useState(false);

  // Labor fields
  const [worker, setWorker] = useState("");
  const [hours, setHours] = useState("");
  // Material fields
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

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
      Alert.alert(
        "Sparat",
        outsideScope
          ? "Loggat och flaggat som möjlig ÄTA för granskning."
          : "Arbetet har loggats på projektet.",
        [{ text: "Klar", onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert("Kunde inte spara", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
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
            <Text style={[styles.segText, mode === "material" && styles.segTextActive]}>
              Material
            </Text>
          </Pressable>
        </View>

        <Card>
          {mode === "labor" ? (
            <>
              <Field
                label="Vem arbetade?"
                value={worker}
                onChangeText={setWorker}
                placeholder="Namn"
              />
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

        <PrimaryButton title="Spara" onPress={submit} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: "center" },
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
  },
  switchRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  switchLabel: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  switchHint: { color: colors.textFaint, fontSize: font.tiny, marginTop: 4 },
});
