import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useAuth } from "../auth/AuthContext";
import { colors, font, glow, layout, monoFont, spacing } from "../theme";
import { useResponsive } from "../useResponsive";

import OverviewScreen from "../screens/OverviewScreen";
import ProjectsScreen from "../screens/ProjectsScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import TeamScreen from "../screens/TeamScreen";
import ArchiveScreen from "../screens/ArchiveScreen";
import WorkerHomeScreen from "../screens/WorkerHomeScreen";
import ProjectDetailScreen from "../screens/ProjectDetailScreen";
import NewProjectScreen from "../screens/NewProjectScreen";
import EditProjectScreen from "../screens/EditProjectScreen";
import AddScopeScreen from "../screens/AddScopeScreen";
import LogWorkScreen from "../screens/LogWorkScreen";
import ReportScreen from "../screens/ReportScreen";
import AtaScreen from "../screens/AtaScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const SIDEBAR_BREAKPOINT = 900;

const stackOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "700", fontSize: font.h3 },
  headerShadowVisible: false,
  headerTitleAlign: "center",
  contentStyle: { backgroundColor: colors.background },
};

// Drill-down screens shared by every section's stack so the sidebar/tabs stay
// mounted while the content area navigates.
function detailScreens() {
  return (
    <>
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: "Projekt" }} />
      <Stack.Screen name="NewProject" component={NewProjectScreen} options={{ title: "Nytt projekt" }} />
      <Stack.Screen name="EditProject" component={EditProjectScreen} options={{ title: "Redigera projekt" }} />
      <Stack.Screen name="AddScope" component={AddScopeScreen} options={{ title: "Budgetpost" }} />
      <Stack.Screen name="LogWork" component={LogWorkScreen} options={{ title: "Logga arbete" }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: "Rapportera" }} />
      <Stack.Screen name="Ata" component={AtaScreen} options={{ title: "ÄTA" }} />
    </>
  );
}

function makeStack(rootName, rootComponent, rootTitle) {
  return function SectionStack() {
    return (
      <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
          name={rootName}
          component={rootComponent}
          options={{ title: rootTitle, headerShown: false }}
        />
        {detailScreens()}
      </Stack.Navigator>
    );
  };
}

const OverviewStack = makeStack("OverviewMain", OverviewScreen, "Översikt");
const ProjectsStack = makeStack("ProjectsMain", ProjectsScreen, "Projekt");
const AnalyticsStack = makeStack("AnalyticsMain", AnalyticsScreen, "Analys");
const TeamStack = makeStack("TeamMain", TeamScreen, "Team");
const ArchiveStack = makeStack("ArchiveMain", ArchiveScreen, "Arkiv");
const WorkerHomeStack = makeStack("WorkerHomeMain", WorkerHomeScreen, "Hem");

const MANAGER_TABS = [
  { name: "Overview", title: "Översikt", icon: "grid-outline", component: OverviewStack },
  { name: "Projects", title: "Projekt", icon: "albums-outline", component: ProjectsStack },
  { name: "Analytics", title: "Analys", icon: "stats-chart-outline", component: AnalyticsStack },
  { name: "Team", title: "Team", icon: "people-outline", component: TeamStack },
  { name: "Archive", title: "Arkiv", icon: "archive-outline", component: ArchiveStack },
];

const WORKER_TABS = [
  { name: "Home", title: "Hem", icon: "home-outline", component: WorkerHomeStack },
  { name: "Projects", title: "Projekt", icon: "albums-outline", component: ProjectsStack },
  { name: "Archive", title: "Arkiv", icon: "archive-outline", component: ArchiveStack },
];

export default function AppShell() {
  const { isManager } = useAuth();
  const { width } = useResponsive();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  const tabs = isManager ? MANAGER_TABS : WORKER_TABS;

  return (
    <Tab.Navigator
      tabBar={(props) => <ShellTabBar {...props} tabs={tabs} isWide={isWide} />}
      screenOptions={{ headerShown: false }}
      sceneContainerStyle={{
        backgroundColor: colors.background,
        paddingLeft: isWide ? layout.sidebarWidth : 0,
      }}
    >
      {tabs.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ title: t.title }} />
      ))}
    </Tab.Navigator>
  );
}

function ShellTabBar({ state, navigation, tabs, isWide }) {
  const meta = (name) => tabs.find((t) => t.name === name) || {};
  const onPress = (route, focused) => {
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  if (isWide) {
    return (
      <View style={styles.sidebar}>
        <Brand />
        <View style={styles.navList}>
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const m = meta(route.name);
            return (
              <Pressable
                key={route.key}
                onPress={() => onPress(route, focused)}
                style={({ hovered }) => [
                  styles.navItem,
                  hovered && styles.navItemHover,
                  focused && styles.navItemActive,
                ]}
              >
                {focused ? <View style={styles.activeEdge} /> : null}
                <Ionicons
                  name={m.icon}
                  size={20}
                  color={focused ? colors.accent : colors.textMuted}
                />
                <Text style={[styles.navLabel, focused && styles.navLabelActive]}>{m.title}</Text>
              </Pressable>
            );
          })}
        </View>
        <UserFooter />
      </View>
    );
  }

  return (
    <View style={styles.bottomBar}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const m = meta(route.name);
        return (
          <Pressable key={route.key} onPress={() => onPress(route, focused)} style={styles.bottomItem}>
            <Ionicons name={m.icon} size={22} color={focused ? colors.accent : colors.textMuted} />
            <Text style={[styles.bottomLabel, focused && { color: colors.accent }]}>{m.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Brand() {
  const { company } = useAuth();
  return (
    <View style={styles.brand}>
      <View style={styles.logoMark}>
        <Text style={styles.logoGlyph}>M</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.brandName}>Marginal</Text>
        <Text style={styles.brandCompany} numberOfLines={1}>{company || "—"}</Text>
      </View>
    </View>
  );
}

function UserFooter() {
  const { user, isManager, signOut } = useAuth();
  const label = user?.full_name || user?.email || "";
  return (
    <View style={styles.footer}>
      <View style={styles.footerUser}>
        <View style={styles.footerAvatar}>
          <Text style={styles.footerAvatarText}>{(label[0] || "?").toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerName} numberOfLines={1}>{label}</Text>
          <Text style={styles.footerRole}>{isManager ? "Chef" : "Hantverkare"}</Text>
        </View>
      </View>
      <Pressable
        onPress={signOut}
        style={({ hovered }) => [styles.logout, hovered && styles.logoutHover]}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.textMuted} />
        <Text style={styles.logoutText}>Logga ut</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: layout.sidebarWidth,
    backgroundColor: colors.backgroundElev,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.sm, marginBottom: spacing.xxl },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...glow(colors.primary, 0.55),
  },
  logoGlyph: { color: "#fff", fontSize: 20, fontWeight: "900", fontFamily: monoFont },
  brandName: { color: colors.text, fontSize: font.h3, fontWeight: "800", letterSpacing: 0.3 },
  brandCompany: { color: colors.textMuted, fontSize: font.tiny, marginTop: 1 },
  navList: { flex: 1, gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: 11,
    overflow: "hidden",
  },
  navItemHover: { backgroundColor: colors.surface },
  navItemActive: { backgroundColor: colors.surfaceRaised },
  activeEdge: { position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: colors.accent },
  navLabel: { color: colors.textMuted, fontSize: font.body, fontWeight: "600" },
  navLabelActive: { color: colors.text, fontWeight: "700" },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg, gap: spacing.md },
  footerUser: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.sm },
  footerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong },
  footerAvatarText: { color: colors.accent, fontWeight: "800", fontFamily: monoFont },
  footerName: { color: colors.text, fontSize: font.small, fontWeight: "700" },
  footerRole: { color: colors.textMuted, fontSize: font.tiny, marginTop: 1 },
  logout: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: 10 },
  logoutHover: { backgroundColor: colors.surface },
  logoutText: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: colors.backgroundElev,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.sm,
  },
  bottomItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 },
  bottomLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "600" },
});
