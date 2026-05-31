import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, font, radius, spacing } from "../theme";

export default function TextField({ label, style, ...props }) {
  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.textFaint} style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: font.small,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
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
});
