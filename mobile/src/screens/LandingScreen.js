import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { colors, font, layout, radius, spacing } from "../theme";
import { useResponsive } from "../useResponsive";

const FEATURES = [
  {
    title: "Automatisk ÄTA-upptäckt",
    body: "Arbete utanför kontraktet flaggas direkt som möjlig ÄTA — med deadline, så du aldrig missar att fakturera.",
  },
  {
    title: "Marginal i realtid",
    body: "Budget mot verkligt för arbete och material, uppdaterat vid varje loggning. Varning innan projektet går back.",
  },
  {
    title: "Samlad dokumentation",
    body: "Incheckningar, foton, material och rapporter knyts automatiskt till projektet — redo för faktura eller tvist.",
  },
];

export default function LandingScreen({ navigation }) {
  const { isCompact } = useResponsive();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={[styles.column, { maxWidth: layout.contentMaxWidth }]}>
        <View style={styles.nav}>
          <Text style={styles.brand}>Marginal</Text>
          <View style={styles.navLinks}>
            {!isCompact ? (
              <Pressable onPress={() => navigation.navigate("Pricing")} hitSlop={8}>
                <Text style={styles.navLink}>Priser</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => navigation.navigate("SignIn")} hitSlop={8}>
              <Text style={styles.navLink}>Logga in</Text>
            </Pressable>
            <PrimaryButton
              title="Skapa konto"
              onPress={() => navigation.navigate("SignUp")}
              style={styles.navCta}
            />
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FÖR BYGGFÖRETAG</Text>
          </View>
          <Text style={[styles.h1, isCompact && { fontSize: 34 }]}>
            Kontroll över marginalen — från förfrågan till faktura.
          </Text>
          <Text style={styles.lead}>
            Marginal spårar varje projekt, upptäcker ÄTA automatiskt och varnar innan
            lönsamheten försvinner. Färre tvister, bättre dokumentation, tightare marginaler.
          </Text>
          <View style={[styles.heroCtas, isCompact && { flexDirection: "column" }]}>
            <PrimaryButton
              title="Kom igång gratis"
              onPress={() => navigation.navigate("SignUp")}
              style={styles.heroBtn}
            />
            <PrimaryButton
              title="Se priser"
              variant="ghost"
              onPress={() => navigation.navigate("Pricing")}
              style={styles.heroBtn}
            />
          </View>
        </View>

        <View style={[styles.features, { flexDirection: isCompact ? "column" : "row" }]}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureWrap}>
              <Card style={styles.featureCard}>
                <View style={styles.featureDot} />
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </Card>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>AB 04 / ABT 06-anpassad · Byggd för svenska byggföretag</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { alignItems: "center" },
  column: { width: "100%", paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
    flexWrap: "wrap",
    gap: spacing.md,
  },
  brand: { color: colors.text, fontSize: font.h2, fontWeight: "800", letterSpacing: -0.3 },
  navLinks: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  navLink: { color: colors.textMuted, fontSize: font.body, fontWeight: "600" },
  navCta: { height: 42, paddingHorizontal: spacing.lg },

  hero: { paddingTop: spacing.xxl, paddingBottom: spacing.xl, maxWidth: 760 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  badgeText: { color: "#b6a6f5", fontSize: font.tiny, fontWeight: "800", letterSpacing: 1 },
  h1: { color: colors.text, fontSize: 46, fontWeight: "800", letterSpacing: -1, lineHeight: 52 },
  lead: {
    color: colors.textMuted,
    fontSize: font.h3,
    lineHeight: 26,
    marginTop: spacing.lg,
    maxWidth: 620,
  },
  heroCtas: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  heroBtn: { minWidth: 180 },

  features: { gap: spacing.lg, marginTop: spacing.xxl },
  featureWrap: { flex: 1 },
  featureCard: { height: "100%" },
  featureDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  featureTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700", marginBottom: spacing.sm },
  featureBody: { color: colors.textMuted, fontSize: font.small, lineHeight: 21 },

  footer: { color: colors.textFaint, fontSize: font.small, textAlign: "center", marginTop: spacing.xxl },
});
