import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { colors, layout, spacing } from "../theme";
import { useResponsive } from "../useResponsive";

// A scrollable page that centers its content in a max-width column,
// so the layout stays readable on wide desktop screens instead of stretching.
export default function Screen({ children, maxWidth = layout.contentMaxWidth, onRefresh, refreshing }) {
  const { isCompact } = useResponsive();
  const pad = isCompact ? spacing.lg : spacing.xl;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        <View style={[styles.column, { maxWidth, paddingHorizontal: pad, paddingTop: pad }]}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { alignItems: "center" },
  column: {
    width: "100%",
    paddingBottom: spacing.xxl,
  },
});
