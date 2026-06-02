import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { colors, font, layout, monoFont, radius, spacing } from "../theme";

// Manager team management: list members + invite a worker (name, email, temp password).
export default function TeamScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

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
            <Card key={m.id} style={styles.memberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(m.full_name || m.email)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.full_name || m.email}</Text>
                <Text style={styles.memberEmail}>{m.email}</Text>
              </View>
              <Pill label={m.role === "manager" ? "Chef" : "Hantverkare"} tone={m.role === "manager" ? "brand" : "accent"} />
            </Card>
          ))}
        </View>
      )}
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
});
