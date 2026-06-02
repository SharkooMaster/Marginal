import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { colors, font, layout, monoFont, radius, shadow, spacing } from "../theme";

// Manager team management: list members, invite, and edit/remove existing members.
export default function TeamScreen() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  // Edit modal state
  const [editing, setEditing] = useState(null);
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState("worker");
  const [ePassword, setEPassword] = useState("");
  const [eError, setEError] = useState(null);
  const [eSaving, setESaving] = useState(false);
  const [eDeleting, setEDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMembers(await api.listTeam());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function invite() {
    setError(null);
    setOk(null);
    if (!email.trim() || !password) {
      setError("Fyll i e-post och ett tillfälligt lösenord.");
      return;
    }
    try {
      setSaving(true);
      await api.addMember({ full_name: name.trim(), email: email.trim(), password, role });
      setOk(`${email.trim()} tillagd.`);
      setName(""); setEmail(""); setPassword("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(m) {
    setEditing(m);
    setEName(m.full_name || "");
    setEEmail(m.email || "");
    setERole(m.role || "worker");
    setEPassword("");
    setEError(null);
  }

  function closeEdit() {
    if (eSaving || eDeleting) return;
    setEditing(null);
  }

  async function saveEdit() {
    setEError(null);
    if (!eEmail.trim()) {
      setEError("E-post krävs.");
      return;
    }
    const payload = { full_name: eName.trim(), email: eEmail.trim(), role: eRole };
    if (ePassword) payload.password = ePassword;
    try {
      setESaving(true);
      await api.updateMember(editing.id, payload);
      setEditing(null);
      await load();
    } catch (e) {
      setEError(e.message);
    } finally {
      setESaving(false);
    }
  }

  async function doDelete() {
    try {
      setEDeleting(true);
      await api.deleteMember(editing.id);
      setEditing(null);
      await load();
    } catch (e) {
      setEError(e.message);
    } finally {
      setEDeleting(false);
    }
  }

  function confirmDelete() {
    const label = editing.full_name || editing.email;
    if (Platform.OS === "web") {
      if (window.confirm(`Ta bort ${label} från teamet?`)) doDelete();
    } else {
      Alert.alert("Ta bort medlem?", `${label} tas bort från företaget.`, [
        { text: "Avbryt", style: "cancel" },
        { text: "Ta bort", style: "destructive", onPress: doDelete },
      ]);
    }
  }

  const isSelf = editing && user && editing.id === user.id;

  return (
    <Screen maxWidth={layout.formMaxWidth}>
      <Text style={styles.kicker}>Team</Text>
      <Text style={styles.title}>Medlemmar</Text>
      <Text style={styles.sub}>Bjud in hantverkare och chefer till företaget</Text>

      <Card style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Text style={styles.cardTitle}>Lägg till medlem</Text>
        <TextField label="Namn" value={name} onChangeText={setName} placeholder="Anna Andersson" />
        <TextField label="E-post" value={email} onChangeText={setEmail} placeholder="anna@foretag.se" autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Tillfälligt lösenord" value={password} onChangeText={setPassword} placeholder="Minst 8 tecken" secureTextEntry />
        <View style={styles.roleRow}>
          <RolePick label="Hantverkare" active={role === "worker"} onPress={() => setRole("worker")} />
          <RolePick label="Chef" active={role === "manager"} onPress={() => setRole("manager")} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {ok ? <Text style={styles.ok}>{ok}</Text> : null}
        <PrimaryButton title="Lägg till medlem" onPress={invite} loading={saving} />
      </Card>

      <Text style={styles.sectionTitle}>Nuvarande team</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {members.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => openEdit(m)}
              style={({ pressed, hovered }) => [(pressed || hovered) && styles.memberPressed]}
            >
              <Card style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(m.full_name || m.email)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.full_name || m.email}</Text>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                </View>
                <Pill label={m.role === "manager" ? "Chef" : "Hantverkare"} tone={m.role === "manager" ? "brand" : "accent"} />
                <Text style={styles.memberEdit}>›</Text>
              </Card>
            </Pressable>
          ))}
          <Text style={styles.hint}>Tryck på en medlem för att redigera eller ta bort.</Text>
        </View>
      )}

      <Modal transparent visible={!!editing} animationType="fade" onRequestClose={closeEdit}>
        <Pressable style={styles.overlay} onPress={closeEdit}>
          <Pressable style={styles.editCard} onPress={() => {}}>
            <Text style={styles.editTitle}>Redigera medlem</Text>
            <TextField label="Namn" value={eName} onChangeText={setEName} placeholder="För- och efternamn" />
            <TextField label="E-post" value={eEmail} onChangeText={setEEmail} placeholder="namn@foretag.se" autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.fieldLabel}>Roll</Text>
            <View style={styles.roleRow}>
              <RolePick label="Hantverkare" active={eRole === "worker"} onPress={() => setERole("worker")} />
              <RolePick label="Chef" active={eRole === "manager"} onPress={() => setERole("manager")} />
            </View>
            <TextField label="Nytt lösenord (valfritt)" value={ePassword} onChangeText={setEPassword} placeholder="Lämna tomt för att behålla" secureTextEntry />
            {eError ? <Text style={styles.error}>{eError}</Text> : null}
            <PrimaryButton title="Spara ändringar" onPress={saveEdit} loading={eSaving} />
            {!isSelf ? (
              <>
                <View style={{ height: spacing.sm }} />
                <PrimaryButton title="Ta bort medlem" variant="danger" onPress={confirmDelete} loading={eDeleting} />
              </>
            ) : (
              <Text style={styles.selfNote}>Du kan inte ta bort ditt eget konto.</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function RolePick({ label, active, onPress }) {
  return (
    <Text
      onPress={onPress}
      style={[styles.rolePick, active && styles.rolePickActive]}
    >
      {label}
    </Text>
  );
}

function initials(s) {
  const parts = String(s).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

const styles = StyleSheet.create({
  kicker: { color: colors.accent, fontSize: font.tiny, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
  cardTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  rolePick: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: "700",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  rolePickActive: { color: colors.accent, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  error: { color: colors.danger, fontSize: font.small },
  ok: { color: colors.success, fontSize: font.small },
  sectionTitle: { color: colors.text, fontSize: font.h2, fontWeight: "700", marginTop: spacing.xxl, marginBottom: spacing.md },
  memberCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong },
  avatarText: { color: "#c3b4ff", fontWeight: "800", fontSize: font.small, fontFamily: monoFont },
  memberName: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  memberEmail: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  memberPressed: { opacity: 0.85 },
  memberEdit: { color: colors.textFaint, fontSize: font.h3, fontWeight: "800", marginLeft: spacing.sm },
  hint: { color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.sm },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  editCard: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow(3),
  },
  editTitle: { color: colors.text, fontSize: font.h2, fontWeight: "800", letterSpacing: -0.3 },
  fieldLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: "600", marginBottom: -spacing.xs },
  selfNote: { color: colors.textFaint, fontSize: font.tiny, textAlign: "center", marginTop: spacing.sm },
});
