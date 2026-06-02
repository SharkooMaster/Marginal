import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../auth/AuthContext";
import { colors, font, spacing } from "../theme";

export default function SignInScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Fyll i e-post och lösenord.");
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      // Navigation switches to the dashboard automatically once authenticated.
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen maxWidth={440}>
      <View style={styles.head}>
        <Text style={styles.title}>Välkommen tillbaka</Text>
        <Text style={styles.sub}>Logga in för att se dina projekt och marginaler.</Text>
      </View>
      <Card>
        <TextField
          label="E-post"
          value={email}
          onChangeText={setEmail}
          placeholder="namn@foretag.se"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField
          label="Lösenord"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          onSubmitEditing={submit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="Logga in" onPress={submit} loading={loading} />
      </Card>
      <Pressable onPress={() => navigation.navigate("SignUp")} style={styles.linkRow} hitSlop={8}>
        <Text style={styles.linkMuted}>Inget konto? </Text>
        <Text style={styles.link}>Skapa ett</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: spacing.sm, lineHeight: 22 },
  error: { color: colors.danger, fontSize: font.small, marginBottom: spacing.md },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  linkMuted: { color: colors.textMuted, fontSize: font.body },
  link: { color: "#b6a6f5", fontSize: font.body, fontWeight: "700" },
});
