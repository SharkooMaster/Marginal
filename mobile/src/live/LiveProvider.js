import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

import { PUSHER_CLUSTER, PUSHER_KEY } from "../config";
import { useAuth } from "../auth/AuthContext";
import { colors, font, radius, shadow, spacing } from "../theme";

const LiveContext = createContext(null);

// Human-readable banner copy per backend event.
function bannerFor(event, data) {
  switch (event) {
    case "report.logged":
      return { text: `${data.summary || "Ny rapport"} · ${data.project || ""}`, tone: data.is_at_risk ? "danger" : "accent" };
    case "ata.detected":
      return { text: `Ny ÄTA upptäckt: ${data.title || ""} (${data.project || ""})`, tone: "warning" };
    case "ata.updated":
      return { text: `ÄTA uppdaterad`, tone: "accent" };
    case "project.updated":
      return { text: `Projekt uppdaterat: ${data.name || ""}`, tone: "accent" };
    case "project.created":
      return { text: `Nytt projekt: ${data.name || ""}`, tone: "accent" };
    case "project.deleted":
      return { text: `Projekt borttaget: ${data.name || ""}`, tone: "neutral" };
    case "photo.added":
      return { text: `Nytt foto i ${data.project || "projekt"}`, tone: "accent" };
    case "photo.deleted":
      return { text: `Foto borttaget i ${data.project || "projekt"}`, tone: "neutral" };
    default:
      return null;
  }
}

const EVENTS = [
  "report.logged",
  "ata.detected",
  "ata.updated",
  "project.updated",
  "project.created",
  "project.deleted",
  "photo.added",
  "photo.deleted",
];

export function LiveProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const companyId = user?.company_id;
  const subscribers = useRef(new Set());
  const [banner, setBanner] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  // Screens register a refresh callback so they reload on any live event.
  const subscribe = useCallback((fn) => {
    subscribers.current.add(fn);
    return () => subscribers.current.delete(fn);
  }, []);
  const value = useMemo(() => ({ subscribe }), [subscribe]);

  function showBanner(b) {
    if (!b) return;
    setBanner(b);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
        () => setBanner(null)
      );
    }, 4200);
  }

  useEffect(() => {
    // Live updates run on web (managers' big screen); native uses push + refresh.
    if (!isAuthenticated || !companyId || !PUSHER_KEY || Platform.OS !== "web") return;

    let pusher;
    let channel;
    let cancelled = false;
    (async () => {
      try {
        const Pusher = (await import("pusher-js")).default;
        if (cancelled) return;
        pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
        channel = pusher.subscribe(`company-${companyId}`);
        EVENTS.forEach((ev) => {
          channel.bind(ev, (data) => {
            subscribers.current.forEach((fn) => {
              try { fn(ev, data); } catch (_) {}
            });
            showBanner(bannerFor(ev, data || {}));
          });
        });
      } catch (_) {
        // pusher-js missing or failed to connect — silently fall back.
      }
    })();

    return () => {
      cancelled = true;
      if (channel) channel.unbind_all();
      if (pusher) pusher.disconnect();
    };
  }, [isAuthenticated, companyId]);

  const tone = banner ? (TONES[banner.tone] || TONES.accent) : TONES.accent;

  return (
    <LiveContext.Provider value={value}>
      {children}
      {banner ? (
        <Animated.View pointerEvents="none" style={[styles.banner, { opacity, borderColor: tone.border }]}>
          <View style={[styles.dot, { backgroundColor: tone.dot }]} />
          <Text style={styles.bannerText} numberOfLines={2}>{banner.text}</Text>
        </Animated.View>
      ) : null}
    </LiveContext.Provider>
  );
}

const TONES = {
  accent: { border: colors.accent, dot: colors.accent },
  danger: { border: colors.danger, dot: colors.danger },
  warning: { border: colors.warning, dot: colors.warning },
  neutral: { border: colors.borderStrong, dot: colors.textMuted },
};

// Screens call this to live-refresh when any company event arrives.
export function useLiveRefresh(fn) {
  const ctx = useContext(LiveContext);
  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, fn]);
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: spacing.lg,
    alignSelf: "center",
    maxWidth: 460,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadow(2),
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bannerText: { color: colors.text, fontSize: font.small, fontWeight: "700", flexShrink: 1 },
});
