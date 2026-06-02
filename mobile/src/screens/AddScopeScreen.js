import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, layout, radius, spacing } from "../theme";

export default function AddScopeScreen({ route, navigation }) {
  const { id, item } = route.params;
  const editing = !!item;
  const [itemType, setItemType] = useState(item?.item_type || "labor"); // "labor" | "material"
  const [description, setDescription] = useState(item?.description || "");
  const [quantity, setQuantity] = useState(item ? String(Number(item.quantity)) : "");
  const [unitCost, setUnitCost] = useState(item ? String(Number(item.unit_cost)) : "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLabor = itemType === "labor";

  function fail(msg) {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("Kunde inte spara", msg);
  }

  async function save() {
    if (!description.trim()) {
      fail("Beskriv budgetposten.");
      return;
    }
    const payload = {
      project: id,
      item_type: itemType,
      description: description.trim(),
      quantity: Number(quantity) || 1,
      unit: isLabor ? "h" : "st",
      unit_cost: Number(unitCost) || 0,
    };
    try {
      setSaving(true);
      if (editing) {
        await api.updateScopeItem(item.id, payload);
      } else {
        await api.createScopeItem(payload);
      }
      navigation.goBack();
    } catch (e) {
      fail("Kunde inte spara: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      setDeleting(true);
      await api.deleteScopeItem(item.id);
      navigation.goBack();
    } catch (e) {
      fail("Kunde inte ta bort: " + e.message);
    } finally {
      setDeleting(false);
    }
  }

  function confirmRemove() {
    if (Platform.OS === "web") {
      if (window.confirm("Ta bort denna budgetpost?")) remove();
    } else {
      Alert.alert("Ta bort budgetpost?", "Detta går inte att ångra.", [
        { text: "Avbryt", style: "cancel" },
        { text: "Ta bort", style: "destructive", onPress: remove },
      ]);
    }
  }

  return (
    <Screen maxWidth={layout.formMaxWidth}>
      <View style={styles.head}>
        <Text style={styles.title}>{editing ? "Redigera budgetpost" : "Lägg till budgetpost"}</Text>
        <Text style={styles.sub}>
          {editing
            ? "Rätta felaktiga värden. Marginal och ÄTA räknas om direkt."
            : "Budgeten är grunden för marginalberäkning och ÄTA-upptäckt."}
        </Text>
      </View>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segBtn, isLabor && styles.segActive]}
          onPress={() => setItemType("labor")}
        >
          <Text style={[styles.segText, isLabor && styles.segTextActive]}>Arbete</Text>
        </Pressable>
        <Pressable
          style={[styles.segBtn, !isLabor && styles.segActive]}
          onPress={() => setItemType("material")}
        >
          <Text style={[styles.segText, !isLabor && styles.segTextActive]}>Material</Text>
        </Pressable>
      </View>

      <Card>
        <TextField
          label="Beskrivning"
          value={description}
          onChangeText={setDescription}
          placeholder={isLabor ? "t.ex. Snickeri" : "t.ex. Köksluckor"}
        />
        <TextField
          label={isLabor ? "Antal timmar" : "Antal"}
          value={quantity}
          onChangeText={setQuantity}
          placeholder={isLabor ? "t.ex. 120" : "t.ex. 1"}
          keyboardType="numeric"
        />
        <TextField
          label={isLabor ? "Timpris (kr)" : "Pris per styck (kr)"}
          value={unitCost}
          onChangeText={setUnitCost}
          placeholder={isLabor ? "t.ex. 550" : "t.ex. 64000"}
          keyboardType="numeric"
        />
        <PrimaryButton
          title={editing ? "Spara ändringar" : "Lägg till i budget"}
          onPress={save}
          loading={saving}
        />
        {editing ? (
          <>
            <View style={{ height: spacing.sm }} />
            <PrimaryButton
              title="Ta bort budgetpost"
              variant="danger"
              onPress={confirmRemove}
              loading={deleting}
            />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: spacing.sm, lineHeight: 22 },
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
});
