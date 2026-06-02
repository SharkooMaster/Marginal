import React, { useCallback, useLayoutEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Screen from "../components/Screen";
import Card from "../components/Card";
import Pill from "../components/Pill";
import MarginBar from "../components/MarginBar";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useLiveRefresh } from "../live/LiveProvider";
import { colors, font, radius, spacing, formatSek, shadow } from "../theme";
import { useResponsive } from "../useResponsive";

function Row({ label, value, tone, strong }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong, tone && { color: tone }]}>
        {value}
      </Text>
    </View>
  );
}

function BudgetBlock({ title, budget, actual, emphasis }) {
  const b = Number(budget) || 0;
  const a = Number(actual) || 0;
  const over = a > b;
  const rawPct = b > 0 ? (a / b) * 100 : a > 0 ? 100 : 0;
  const barPct = Math.min(100, rawPct);
  const diff = b - a;

  const pctLabel = b > 0 ? `${Math.round(rawPct)}% av budget` : "Ingen budget satt";
  const diffLabel =
    b > 0
      ? over
        ? `${formatSek(Math.abs(diff))} över`
        : `${formatSek(diff)} kvar`
      : a > 0
      ? `${formatSek(a)} oplanerat`
      : "—";
  const diffTone = over ? colors.danger : b > 0 ? colors.success : colors.textMuted;

  return (
    <View style={[styles.budgetBlock, emphasis && styles.budgetBlockTotal]}>
      <View style={styles.budgetHead}>
        <Text style={[styles.budgetTitle, emphasis && styles.budgetTitleTotal]}>{title}</Text>
        <Text
          style={[
            styles.budgetNums,
            emphasis && styles.budgetNumsTotal,
            over && { color: colors.danger },
          ]}
        >
          {formatSek(actual)} / {formatSek(budget)}
        </Text>
      </View>
      <View style={[styles.miniTrack, emphasis && styles.miniTrackTotal]}>
        <View
          style={[
            styles.miniFill,
            { width: `${barPct}%`, backgroundColor: over ? colors.danger : colors.primary },
          ]}
        />
      </View>
      <View style={styles.budgetFoot}>
        <Text style={styles.budgetPct}>{pctLabel}</Text>
        <Text style={[styles.budgetDiff, { color: diffTone }]}>{diffLabel}</Text>
      </View>
    </View>
  );
}

export default function ProjectDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { isWide } = useResponsive();
  const { isManager } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [photoConfirm, setPhotoConfirm] = useState(false);
  const [photoDeleting, setPhotoDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getProject(id);
      setProject(data);
      navigation.setOptions({ title: data.name });
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useLiveRefresh(load);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isManager
        ? () => (
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.menuTrigger}>
              <Text style={styles.menuTriggerIcon}>⋮</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, isManager]);

  const deleteProject = useCallback(async () => {
    try {
      setDeleting(true);
      await api.deleteProject(id);
      setConfirmOpen(false);
      navigation.navigate("Projects");
    } catch (e) {
      const msg = "Kunde inte ta bort projektet: " + e.message;
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Fel", msg);
    } finally {
      setDeleting(false);
    }
  }, [id, navigation]);

  function openConfirm() {
    setMenuOpen(false);
    setConfirmOpen(true);
  }

  function openEdit() {
    setMenuOpen(false);
    navigation.navigate("EditProject", {
      id: project.id,
      name: project.name,
      customer_name: project.customer_name,
      contract_value: project.contract_value,
      margin_alert_threshold_pct: project.margin_alert_threshold_pct,
    });
  }

  async function toggleArchive() {
    setMenuOpen(false);
    try {
      await api.setArchived(id, !project.archived);
      navigation.goBack();
    } catch (e) {
      const msg = "Kunde inte uppdatera arkivstatus: " + e.message;
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Fel", msg);
    }
  }

  function closeViewer() {
    setViewerIndex(null);
    setPhotoConfirm(false);
  }

  async function removePhoto() {
    if (viewerIndex == null) return;
    const photo = (project.photos || [])[viewerIndex];
    if (!photo) return;
    try {
      setPhotoDeleting(true);
      await api.deletePhoto(photo.id);
      closeViewer();
      await load();
    } catch (e) {
      const msg = "Kunde inte ta bort fotot: " + e.message;
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Fel", msg);
    } finally {
      setPhotoDeleting(false);
    }
  }

  if (loading || !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const openAta = project.ata_items.filter(
    (a) => !["customer_approved", "rejected"].includes(a.status)
  );

  const overview = (
    <Card>
      <View style={styles.headRow}>
        <Text style={styles.customer}>{project.customer_name}</Text>
        <Pill
          label={project.is_at_risk ? "Marginal i fara" : "Frisk marginal"}
          tone={project.is_at_risk ? "danger" : "success"}
        />
      </View>
      <View style={{ marginTop: spacing.xl }}>
        <MarginBar marginPct={project.current_margin_pct} atRisk={project.is_at_risk} />
      </View>
      <View style={styles.divider} />
      <Row label="Kontraktsvärde" value={formatSek(project.contract_value)} />
      <Row label="Godkänd ÄTA" value={formatSek(project.approved_ata)} />
      <Row label="Faktisk kostnad" value={formatSek(project.actual_total)} />
      <Row
        label="Marginal kvar"
        value={formatSek(project.current_margin)}
        tone={project.is_at_risk ? colors.danger : colors.success}
        strong
      />
    </Card>
  );

  const hasScope = project.scope_items && project.scope_items.length > 0;
  const hasActuals = Number(project.actual_total) > 0;

  const budget = (
    <>
      <Text style={styles.sectionTitle}>Budget mot verkligt</Text>
      <Text style={styles.sectionHelp}>
        Planerad kostnad jämfört med vad som loggats. Grön = inom budget, röd = över.
      </Text>
      <Card>
        {hasScope || hasActuals ? (
          <>
            <BudgetBlock title="Arbete" budget={project.budgeted_labor} actual={project.actual_labor} />
            <BudgetBlock
              title="Material"
              budget={project.budgeted_materials}
              actual={project.actual_materials}
            />
            <View style={styles.divider} />
            <BudgetBlock
              title="Totalt"
              budget={project.budgeted_total}
              actual={project.actual_total}
              emphasis
            />
            {hasScope ? (
              <>
                <View style={styles.divider} />
                {project.scope_items.map((s) => {
                  const inner = (
                    <>
                      <View style={{ flex: 1, paddingRight: spacing.md }}>
                        <Text style={styles.scopeDesc} numberOfLines={1}>
                          {s.description}
                        </Text>
                        <Text style={styles.scopeMeta}>
                          {s.item_type === "labor" ? "Arbete" : "Material"} · {Number(s.quantity)} {s.unit}
                          {s.is_ata ? " · ÄTA" : ""}
                        </Text>
                      </View>
                      <Text style={styles.scopeCost}>{formatSek(s.line_total)}</Text>
                      {isManager ? <Text style={styles.scopeEdit}>›</Text> : null}
                    </>
                  );
                  return isManager ? (
                    <Pressable
                      key={s.id}
                      onPress={() =>
                        navigation.navigate("AddScope", { id: project.id, name: project.name, item: s })
                      }
                      style={({ pressed, hovered }) => [
                        styles.scopeRow,
                        (pressed || hovered) && styles.scopeRowActive,
                      ]}
                    >
                      {inner}
                    </Pressable>
                  ) : (
                    <View key={s.id} style={styles.scopeRow}>
                      {inner}
                    </View>
                  );
                })}
                {isManager ? (
                  <Text style={styles.scopeEditHint}>Tryck på en budgetpost för att redigera eller ta bort.</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.scopeHint}>
                Inga budgetposter ännu – siffrorna ovan visar loggat utfall. Lägg till budget för att jämföra.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.scopeEmpty}>
            Ingen budget eller loggat utfall ännu. Lägg till budgetposter för att följa marginal och fånga ÄTA.
          </Text>
        )}
        {isManager ? (
          <>
            <View style={{ height: spacing.md }} />
            <PrimaryButton
              title="+ Lägg till budgetpost"
              variant="ghost"
              onPress={() => navigation.navigate("AddScope", { id: project.id, name: project.name })}
            />
          </>
        ) : null}
      </Card>
    </>
  );

  const photoList = project.photos || [];
  const photos =
    photoList.length > 0 ? (
      <>
        <Text style={styles.sectionTitle}>Foton ({photoList.length})</Text>
        <Card>
          <View style={styles.photoGrid}>
            {photoList.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setPhotoConfirm(false);
                  setViewerIndex(i);
                }}
                style={({ pressed, hovered }) => [
                  styles.galleryThumb,
                  (pressed || hovered) && styles.galleryThumbActive,
                ]}
              >
                <Image source={{ uri: p.image }} style={styles.galleryImg} />
              </Pressable>
            ))}
          </View>
        </Card>
      </>
    ) : null;

  const actions = (
    <Card>
      <PrimaryButton
        title="Rapportera tid / material"
        onPress={() => navigation.navigate("Report", { id: project.id, name: project.name })}
      />
      <View style={{ height: spacing.md }} />
      <PrimaryButton
        title={`Visa ÄTA (${project.ata_items.length})`}
        variant="ghost"
        onPress={() => navigation.navigate("Ata", { id: project.id, name: project.name })}
      />
    </Card>
  );

  const ata =
    openAta.length > 0 ? (
      <>
        <Text style={styles.sectionTitle}>ÄTA att hantera</Text>
        {openAta.map((a) => (
          <Card key={a.id} style={styles.ataCard}>
            <View style={styles.headRow}>
              <Text style={styles.ataTitle}>{a.title}</Text>
              <Pill label={a.status_display} tone="warning" />
            </View>
            <Text style={styles.ataCost}>{formatSek(a.estimated_cost)}</Text>
          </Card>
        ))}
      </>
    ) : null;

  const menu = (
    <Modal
      transparent
      visible={menuOpen}
      animationType="fade"
      onRequestClose={() => setMenuOpen(false)}
    >
      <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
        <View style={styles.menu}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={openEdit}
          >
            <Text style={styles.menuItemText}>Redigera projekt</Text>
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={toggleArchive}
          >
            <Text style={styles.menuItemText}>
              {project.archived ? "Återställ från arkiv" : "Arkivera projekt"}
            </Text>
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={openConfirm}
          >
            <Text style={styles.menuItemDanger}>Ta bort projekt</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  const confirm = (
    <Modal
      transparent
      visible={confirmOpen}
      animationType="fade"
      onRequestClose={() => !deleting && setConfirmOpen(false)}
    >
      <Pressable
        style={styles.confirmOverlay}
        onPress={() => !deleting && setConfirmOpen(false)}
      >
        <Pressable style={styles.confirmCard} onPress={() => {}}>
          <Text style={styles.confirmTitle}>Ta bort projekt?</Text>
          <Text style={styles.confirmText}>
            Detta tar bort “{project.name}” permanent, inklusive budget, loggar och ÄTA. Det går inte att ångra.
          </Text>
          <View style={styles.confirmActions}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Avbryt"
                variant="ghost"
                onPress={() => setConfirmOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Ta bort" variant="danger" onPress={deleteProject} loading={deleting} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const current = viewerIndex != null ? photoList[viewerIndex] : null;
  const win = Dimensions.get("window");
  const showPrev = () =>
    setViewerIndex((i) => (i > 0 ? i - 1 : photoList.length - 1));
  const showNext = () =>
    setViewerIndex((i) => (i < photoList.length - 1 ? i + 1 : 0));

  const viewer = (
    <Modal
      transparent
      visible={current != null}
      animationType="fade"
      onRequestClose={closeViewer}
    >
      <View style={styles.viewerOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeViewer} />
        <Pressable style={styles.viewerClose} onPress={closeViewer} hitSlop={12}>
          <Text style={styles.viewerCloseText}>✕</Text>
        </Pressable>

        {current ? (
          <View style={styles.viewerContent} pointerEvents="box-none">
            <Image
              source={{ uri: current.image }}
              style={{
                width: Math.min(win.width - spacing.lg * 2, 1100),
                height: win.height * 0.62,
                borderRadius: radius.md,
              }}
              resizeMode="contain"
            />

            {photoList.length > 1 ? (
              <>
                <Pressable style={[styles.viewerNav, styles.viewerNavLeft]} onPress={showPrev} hitSlop={10}>
                  <Text style={styles.viewerNavText}>‹</Text>
                </Pressable>
                <Pressable style={[styles.viewerNav, styles.viewerNavRight]} onPress={showNext} hitSlop={10}>
                  <Text style={styles.viewerNavText}>›</Text>
                </Pressable>
              </>
            ) : null}

            <View style={styles.viewerBar} pointerEvents="box-none">
              <View style={{ flex: 1 }}>
                {current.caption ? (
                  <Text style={styles.viewerCaption} numberOfLines={2}>{current.caption}</Text>
                ) : null}
                <Text style={styles.viewerMeta}>
                  {(current.uploaded_by_name || "Okänd") +
                    " · " +
                    new Date(current.created_at).toLocaleDateString("sv-SE") +
                    `  (${viewerIndex + 1}/${photoList.length})`}
                </Text>
              </View>
              {current.can_delete ? (
                <Pressable
                  style={({ pressed }) => [styles.viewerDelete, pressed && { opacity: 0.7 }]}
                  onPress={() => setPhotoConfirm(true)}
                  disabled={photoDeleting}
                >
                  <Text style={styles.viewerDeleteText}>Ta bort</Text>
                </Pressable>
              ) : null}
            </View>

            {photoConfirm ? (
              <View style={styles.photoConfirm}>
                <Text style={styles.photoConfirmText}>Ta bort detta foto permanent?</Text>
                <View style={styles.photoConfirmActions}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Avbryt"
                      variant="ghost"
                      onPress={() => setPhotoConfirm(false)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Ta bort"
                      variant="danger"
                      onPress={removePhoto}
                      loading={photoDeleting}
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );

  if (isWide) {
    return (
      <Screen>
        <View style={styles.twoCol}>
          <View style={styles.colMain}>
            {overview}
            {budget}
            {photos}
          </View>
          <View style={styles.colSide}>
            {actions}
            {ata}
          </View>
        </View>
        {menu}
        {confirm}
        {viewer}
      </Screen>
    );
  }

  return (
    <Screen>
      {overview}
      {budget}
      {photos}
      {ata}
      <View style={{ marginTop: spacing.lg }}>{actions}</View>
      {menu}
      {confirm}
      {viewer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  menuTrigger: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  menuTriggerIcon: { color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 24 },
  menuOverlay: { flex: 1, alignItems: "flex-end", paddingTop: Platform.OS === "web" ? 56 : 90, paddingRight: spacing.md },
  menu: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    minWidth: 200,
    ...shadow(2),
  },
  menuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  menuItemPressed: { backgroundColor: colors.surface },
  menuItemText: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  menuItemDanger: { color: colors.danger, fontSize: font.body, fontWeight: "700" },
  menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadow(3),
  },
  confirmTitle: { color: colors.text, fontSize: font.h2, fontWeight: "800", letterSpacing: -0.3 },
  confirmText: { color: colors.textMuted, fontSize: font.body, lineHeight: 22, marginTop: spacing.md },
  confirmActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  twoCol: { flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" },
  colMain: { flex: 1.4 },
  colSide: { flex: 1, minWidth: 300 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customer: { color: colors.textMuted, fontSize: font.body, flex: 1, paddingRight: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  rowLabel: { color: colors.textMuted, fontSize: font.body },
  rowValue: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  rowValueStrong: { fontSize: font.h3, fontWeight: "800" },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionHelp: {
    color: colors.textMuted,
    fontSize: font.small,
    lineHeight: 19,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  budgetBlock: { marginBottom: spacing.lg },
  budgetBlockTotal: { marginBottom: spacing.sm },
  budgetHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  budgetTitle: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  budgetTitleTotal: { fontWeight: "800", fontSize: font.h3 },
  budgetNums: { color: colors.textMuted, fontSize: font.small, fontWeight: "700" },
  budgetNumsTotal: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  miniTrack: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  miniTrackTotal: { height: 12 },
  miniFill: { height: "100%", borderRadius: 999 },
  budgetFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  budgetPct: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700" },
  budgetDiff: { fontSize: font.tiny, fontWeight: "800" },
  scopeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm, marginHorizontal: -spacing.sm },
  scopeRowActive: { backgroundColor: colors.surfaceRaised },
  scopeEdit: { color: colors.textFaint, fontSize: font.h3, fontWeight: "800", marginLeft: spacing.md },
  scopeEditHint: { color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.sm },
  scopeDesc: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  scopeMeta: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  scopeCost: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  scopeEmpty: { color: colors.textMuted, fontSize: font.small, lineHeight: 20 },
  scopeHint: { color: colors.textFaint, fontSize: font.tiny, lineHeight: 18, marginTop: spacing.md },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  galleryThumb: { borderRadius: radius.sm, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  galleryThumbActive: { borderColor: colors.accent },
  galleryImg: { width: 96, height: 96 },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  viewerContent: { width: "100%", maxWidth: 1100, alignItems: "center" },
  viewerClose: {
    position: "absolute",
    top: Platform.OS === "web" ? spacing.lg : spacing.xxl,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCloseText: { color: colors.text, fontSize: 18, fontWeight: "800" },
  viewerNav: {
    position: "absolute",
    top: "44%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(20,18,34,0.7)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerNavLeft: { left: 0 },
  viewerNavRight: { right: 0 },
  viewerNavText: { color: colors.text, fontSize: 28, fontWeight: "800", lineHeight: 30 },
  viewerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    width: "100%",
    maxWidth: 720,
  },
  viewerCaption: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  viewerMeta: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  viewerDelete: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  viewerDeleteText: { color: colors.danger, fontSize: font.small, fontWeight: "800" },
  photoConfirm: {
    marginTop: spacing.lg,
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  photoConfirmText: { color: colors.text, fontSize: font.body, fontWeight: "700", textAlign: "center" },
  photoConfirmActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  ataCard: { borderColor: colors.warningSoft, marginBottom: spacing.md },
  ataTitle: { color: colors.text, fontSize: font.body, fontWeight: "700", flex: 1, paddingRight: spacing.md },
  ataCost: { color: colors.warning, fontSize: font.h3, fontWeight: "800", marginTop: spacing.sm },
});
