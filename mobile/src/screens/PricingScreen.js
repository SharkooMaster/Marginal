import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { colors, font, radius, spacing } from "../theme";
import { useResponsive } from "../useResponsive";

const PLANS = [
  {
    name: "Start",
    price: "0 kr",
    period: "/ mån",
    tagline: "För enmansföretag som vill testa.",
    features: ["1 aktivt projekt", "ÄTA-upptäckt", "Marginal i realtid", "Mobilapp"],
    cta: "Kom igång",
    featured: false,
  },
  {
    name: "Proffs",
    price: "499 kr",
    period: "/ mån",
    tagline: "För växande byggföretag.",
    features: [
      "Obegränsade projekt",
      "Automatiska ÄTA-deadlines",
      "Budget mot verkligt",
      "Foton & arbetsrapporter",
      "Upp till 10 användare",
    ],
    cta: "Välj Proffs",
    featured: true,
  },
  {
    name: "Företag",
    price: "Offert",
    period: "",
    tagline: "För större organisationer.",
    features: ["Allt i Proffs", "Obegränsade användare", "Egen onboarding", "Prioriterad support", "SSO & roller"],
    cta: "Kontakta oss",
    featured: false,
  },
];

export default function PricingScreen({ navigation }) {
  const { isCompact } = useResponsive();

  return (
    <Screen>
      <View style={styles.head}>
        <Text style={styles.title}>Enkla priser</Text>
        <Text style={styles.sub}>Betala för det du behöver. Byt plan när som helst.</Text>
      </View>

      <View style={[styles.row, { flexDirection: isCompact ? "column" : "row" }]}>
        {PLANS.map((p) => (
          <View key={p.name} style={styles.col}>
            <Card style={[styles.plan, p.featured && styles.planFeatured]}>
              {p.featured ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>POPULÄRAST</Text>
                </View>
              ) : null}
              <Text style={styles.planName}>{p.name}</Text>
              <Text style={styles.tagline}>{p.tagline}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{p.price}</Text>
                <Text style={styles.period}>{p.period}</Text>
              </View>
              <View style={styles.features}>
                {p.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={styles.check}>✓</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <PrimaryButton
                title={p.cta}
                variant={p.featured ? "primary" : "ghost"}
                onPress={() => navigation.navigate("SignUp")}
              />
            </Card>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: spacing.xl, alignItems: "center" },
  title: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: font.body, marginTop: spacing.sm, textAlign: "center" },
  row: { gap: spacing.lg, alignItems: "stretch" },
  col: { flex: 1 },
  plan: { height: "100%" },
  planFeatured: { borderColor: colors.primary },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  tagText: { color: colors.onPrimary, fontSize: font.tiny, fontWeight: "800", letterSpacing: 0.6 },
  planName: { color: colors.text, fontSize: font.h2, fontWeight: "800" },
  tagline: { color: colors.textMuted, fontSize: font.small, marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: spacing.lg },
  price: { color: colors.text, fontSize: font.display, fontWeight: "800", letterSpacing: -1 },
  period: { color: colors.textMuted, fontSize: font.body, marginLeft: 6 },
  features: { marginVertical: spacing.lg, gap: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center" },
  check: { color: colors.success, fontSize: font.body, fontWeight: "800", width: 22 },
  featureText: { color: colors.textMuted, fontSize: font.small, flex: 1 },
});
