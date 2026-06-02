import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { buildPhotoForm, pickFromLibrary, takePhoto } from "../photos";
import { colors, font, layout, radius, spacing } from "../theme";

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textFaint} style={styles.input} {...props} />
    </View>
  );
}

// Worker-first reporting flow: log time/material, flag extra work, attach photos.
export default function ReportScreen({ route, navigation }) {
  const { id, name } = route.params;
  const { user } = useAuth();
  const [mode, setMode] = useState("labor");
  const [outsideScope, setOutsideScope] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [picking, setPicking] = useState(false);

  const [worker, setWorker] = useState(user?.full_name || "");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  function fail(msg) {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("Fel", msg);
  }

  async function addPhoto(useCamera) {
    try {
      setPicking(true);
      const asset = useCamera ? await takePhoto() : await pickFromLibrary();
      if (asset) setPhotos((prev) => [...prev, asset]);
    } catch (e) {
      fail(e.message);
    } finally {
      setPicking(false);
    }
  }

  function removePhoto(uri) {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  }

  async function submit() {
    try {
      setSaving(true);
      let record = null;
      let link = {};
      if (mode === "labor") {
        record = await api.logCheckIn({
          project: id,
          worker_name: worker || "Okänd",
          hours: Number(hours) || 0,
          note: outsideScope ? "Extra arbete" : "",
          outside_scope: outsideScope,
        });
        link = { checkIn: record.id };
      } else {
        record = await api.logMaterial({
          project: id,
          description: description || "Material",
          quantity: Number(quantity) || 1,
          unit_cost: Number(unitCost) || 0,
          outside_scope: outsideScope,
        });
        link = { material: record.id };
      }

      for (const asset of photos) {
        const form = await buildPhotoForm(id, asset, link);
        await api.uploadPhoto(form);
      }

      const msg = outsideScope
        ? "Rapporterat och flaggat som möjlig ÄTA för granskning."
        : "Rapporten har sparats på projektet.";
      if (Platform.OS === "web") {
        window.alert(msg);
        navigation.goBack();
      } else {
        Alert.alert("Klart", msg, [{ text: "Klar", onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      fail("Kunde inte spara: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen maxWidth={layout.formMaxWidth}>
      <Text style={styles.kicker}>Rapportera</Text>
      <Text style={styles.title}>{name || "Projekt"}</Text>
      <Text style={styles.sub}>Logga din tid eller material och bifoga foton från platsen.</Text>

      <View style={[styles.segment, { marginTop: spacing.xl }]}>
        <Pressable style={[styles.segBtn, mode === "labor" && styles.segActive]} onPress={() => setMode("labor")}>
          <Text style={[styles.segText, mode === "labor" && styles.segTextActive]}>Tid</Text>
        </Pressable>
        <Pressable style={[styles.segBtn, mode === "material" && styles.segActive]} onPress={() => setMode("material")}>
          <Text style={[styles.segText, mode === "material" && styles.segTextActive]}>Material</Text>
        </Pressable>
      </View>

      <Card>
        {mode === "labor" ? (
          <>
            <Field label="Vem arbetade?" value={worker} onChangeText={setWorker} placeholder="Namn" />
            <Field label="Antal timmar" value={hours} onChangeText={setHours} placeholder="t.ex. 8" keyboardType="numeric" />
          </>
        ) : (
          <>
            <Field label="Vad användes?" value={description} onChangeText={setDescription} placeholder="t.ex. Gipsskivor" />
            <Field label="Antal" value={quantity} onChangeText={setQuantity} placeholder="t.ex. 10" keyboardType="numeric" />
            <Field label="Pris per styck (kr)" value={unitCost} onChangeText={setUnitCost} placeholder="t.ex. 89" keyboardType="numeric" />
          </>
        )}

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={styles.switchLabel}>Extra arbete utanför kontraktet?</Text>
            <Text style={styles.switchHint}>Flaggas automatiskt som möjlig ÄTA så att inget missas vid fakturering.</Text>
          </View>
          <Switch
            value={outsideScope}
            onValueChange={setOutsideScope}
            trackColor={{ false: colors.surfaceRaised, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </Card>

      <Text style={styles.photoHeader}>Foton</Text>
      <View style={styles.photoRow}>
        {photos.map((p) => (
          <View key={p.uri} style={styles.thumbWrap}>
            <Image source={{ uri: p.uri }} style={styles.thumb} />
            <Pressable style={styles.thumbRemove} onPress={() => removePhoto(p.uri)} hitSlop={6}>
              <Text style={styles.thumbRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addPhoto} onPress={() => addPhoto(false)} disabled={picking}>
          {picking ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.addPhotoText}>＋ Bild</Text>}
        </Pressable>
        {Platform.OS !== "web" ? (
          <Pressable style={styles.addPhoto} onPress={() => addPhoto(true)} disabled={picking}>
            <Text style={styles.addPhotoText}>Kamera</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton title="Skicka rapport" onPress={submit} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.accent, fontSize: font.tiny, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 4, lineHeight: 21 },
  segment: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  segBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm - 2, alignItems: "center" },
  segActive: { backgroundColor: colors.primary },
  segText: { color: colors.textMuted, fontWeight: "700", fontSize: font.body },
  segTextActive: { color: colors.onPrimary },
  label: { color: colors.textMuted, fontSize: font.small, marginBottom: spacing.sm, fontWeight: "600" },
  input: { backgroundColor: colors.surfaceRaised, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: font.h3, borderWidth: 1, borderColor: colors.border, outlineStyle: "none" },
  switchRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  switchLabel: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  switchHint: { color: colors.textFaint, fontSize: font.tiny, marginTop: 4 },
  photoHeader: { color: colors.text, fontSize: font.h3, fontWeight: "700", marginTop: spacing.xl, marginBottom: spacing.md },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  thumbWrap: { position: "relative" },
  thumb: { width: 84, height: 84, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  thumbRemove: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" },
  thumbRemoveText: { color: "#fff", fontSize: 15, fontWeight: "900", lineHeight: 16 },
  addPhoto: { width: 84, height: 84, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  addPhotoText: { color: colors.accent, fontWeight: "700", fontSize: font.small },
});
