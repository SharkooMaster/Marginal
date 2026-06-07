import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { colors, font, radius, spacing, formatSek } from "../theme";

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

function confirmDelete(title, onYes) {
  const msg = `Ta bort ÄTA "${title}"? Detta går inte att ångra.`;
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert("Ta bort ÄTA", msg, [
      { text: "Avbryt", style: "cancel" },
      { text: "Ta bort", style: "destructive", onPress: onYes },
    ]);
  }
}

// Renders an ÄTA description. Auto-flagged items carry structured "Label: value"
// lines (type of work, who did it, hours/quantity, etc.) which we lay out as a
// detail table so the chef sees exactly what was logged before approving.
function AtaDetails({ text }) {
  const lines = String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <View style={styles.detailBox}>
      {lines.map((line, i) => {
        const idx = line.indexOf(": ");
        if (idx > 0 && idx < 24) {
          return (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{line.slice(0, idx)}</Text>
              <Text style={styles.detailValue}>{line.slice(idx + 2)}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.detailPlain}>
            {line}
          </Text>
        );
      })}
    </View>
  );
}

export default function AtaScreen({ route }) {
  const { id } = route.params;
  const { isManager } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

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

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCost("");
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(a) {
    setEditing(a);
    setTitle(a.title || "");
    setDescription(a.description || "");
    setCost(String(a.estimated_cost ?? ""));
    setFormError(null);
    setFormOpen(true);
  }

  async function save() {
    if (!title.trim()) {
      setFormError("Ange en titel.");
      return;
    }
    const payload = {
      project: id,
      title: title.trim(),
      description: description.trim(),
      estimated_cost: Number(String(cost).replace(",", ".")) || 0,
    };
    try {
      setSaving(true);
      setFormError(null);
      if (editing) {
        await api.updateAta(editing.id, payload);
      } else {
        await api.createAta(payload);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function remove(a) {
    confirmDelete(a.title, async () => {
      setBusyId(a.id);
      try {
        await api.deleteAta(a.id);
        await load();
      } catch (e) {
        const msg = "Kunde inte ta bort: " + e.message;
        if (Platform.OS === "web") window.alert(msg);
        else Alert.alert("Fel", msg);
      } finally {
        setBusyId(null);
      }
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen maxWidth={720} onRefresh={load} refreshing={loading}>
      <Text style={styles.intro}>
        ÄTA-arbete (ändrings-, tilläggs- och avgående arbeten) fångas upp automatiskt och följer
        en tydlig godkännandekedja. Chefen kan även registrera ÄTA manuellt.
      </Text>

      {isManager ? (
        <View style={{ marginBottom: spacing.lg }}>
          <PrimaryButton title="+ Ny ÄTA" onPress={openCreate} />
        </View>
      ) : null}

      {items.length === 0 ? (
        <Text style={styles.empty}>Inga ÄTA registrerade på projektet.</Text>
      ) : (
        items.map((a) => {
          const nextLabel = NEXT_LABEL[a.status];
          const done = a.status === "customer_approved" || a.status === "rejected";
          const manual = a.trigger_type === "manual";
          return (
            <Card key={a.id} style={styles.card}>
              <View style={styles.headRow}>
                <Text style={styles.title}>{a.title}</Text>
                <Pill label={a.status_display} tone={toneFor(a.status)} />
              </View>
              {manual ? <Text style={styles.manualTag}>Manuellt registrerad</Text> : null}
              {a.description ? <AtaDetails text={a.description} /> : null}
              <Text style={styles.costLabel}>Uppskattad kostnad</Text>
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

              {isManager ? (
                <View style={styles.manageRow}>
                  <Pressable onPress={() => openEdit(a)} hitSlop={8}>
                    <Text style={styles.manageLink}>Redigera</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(a)} hitSlop={8}>
                    <Text style={styles.manageDanger}>Ta bort</Text>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          );
        })
      )}

      <Modal
        transparent
        visible={formOpen}
        animationType="fade"
        onRequestClose={() => !saving && setFormOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => !saving && setFormOpen(false)}>
          <Pressable style={styles.formCard} onPress={() => {}}>
            <Text style={styles.formTitle}>{editing ? "Redigera ÄTA" : "Ny ÄTA"}</Text>

            <Text style={styles.label}>Titel</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="t.ex. Extra rivning i kök"
              placeholderTextColor={colors.textFaint}
            />

            <Text style={styles.label}>Beskrivning</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="Vad omfattar arbetet?"
              placeholderTextColor={colors.textFaint}
              multiline
            />

            <Text style={styles.label}>Uppskattad kostnad (kr)</Text>
            <TextInput
              style={styles.input}
              value={cost}
              onChangeText={setCost}
              placeholder="0"
              placeholderTextColor={colors.textFaint}
              keyboardType="numeric"
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <View style={styles.formActions}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title="Avbryt"
                  variant="ghost"
                  onPress={() => setFormOpen(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title={editing ? "Spara" : "Skapa"}
                  onPress={save}
                  loading={saving}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  intro: { color: colors.textMuted, fontSize: font.body, marginBottom: spacing.lg, lineHeight: 22 },
  empty: { color: colors.textFaint, textAlign: "center", marginTop: spacing.xl },
  card: { marginBottom: spacing.lg },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.text, fontSize: font.h3, fontWeight: "700", flex: 1, paddingRight: spacing.md },
  manualTag: { color: colors.accent, fontSize: font.tiny, fontWeight: "700", marginTop: spacing.xs },
  desc: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm, lineHeight: 20 },
  detailBox: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  detailLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
  detailValue: { color: colors.text, fontSize: font.small, fontWeight: "700", flex: 1, textAlign: "right" },
  detailPlain: { color: colors.textMuted, fontSize: font.small, lineHeight: 19, paddingVertical: spacing.xs },
  costLabel: { color: colors.textFaint, fontSize: font.tiny, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginTop: spacing.md },
  cost: { color: colors.warning, fontSize: font.h2, fontWeight: "800", marginTop: 2 },
  deadline: { color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.sm },
  actions: { marginTop: spacing.lg },
  manageRow: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  manageLink: { color: colors.accent, fontSize: font.small, fontWeight: "700" },
  manageDanger: { color: colors.danger, fontSize: font.small, fontWeight: "700" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  formCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  formTitle: { color: colors.text, fontSize: font.h2, fontWeight: "800", letterSpacing: -0.3, marginBottom: spacing.md },
  label: { color: colors.textMuted, fontSize: font.small, fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: font.body,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  formError: { color: colors.danger, fontSize: font.small, marginTop: spacing.md },
  formActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
});
