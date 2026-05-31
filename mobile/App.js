import React from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors, font, spacing } from "./src/theme";
import LandingScreen from "./src/screens/LandingScreen";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import PricingScreen from "./src/screens/PricingScreen";
import ProjectsScreen from "./src/screens/ProjectsScreen";
import ProjectDetailScreen from "./src/screens/ProjectDetailScreen";
import NewProjectScreen from "./src/screens/NewProjectScreen";
import AddScopeScreen from "./src/screens/AddScopeScreen";
import LogWorkScreen from "./src/screens/LogWorkScreen";
import AtaScreen from "./src/screens/AtaScreen";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

function DashboardHeaderRight({ navigation }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
      <Pressable onPress={() => navigation.navigate("NewProject")} hitSlop={8}>
        <Text style={{ color: colors.primary, fontSize: font.small, fontWeight: "800" }}>
          + Nytt projekt
        </Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.reset({ index: 0, routes: [{ name: "Landing" }] })}
        hitSlop={8}
      >
        <Text style={{ color: colors.textMuted, fontSize: font.small, fontWeight: "600" }}>
          Logga ut
        </Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700", fontSize: font.h3 },
          headerShadowVisible: false,
          headerTitleAlign: "center",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "Logga in" }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Skapa konto" }} />
        <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: "Priser" }} />
        <Stack.Screen
          name="Projects"
          component={ProjectsScreen}
          options={({ navigation }) => ({
            title: "Marginal",
            headerBackVisible: false,
            headerRight: () => <DashboardHeaderRight navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{ title: "Projekt" }}
        />
        <Stack.Screen
          name="NewProject"
          component={NewProjectScreen}
          options={{ title: "Nytt projekt" }}
        />
        <Stack.Screen
          name="AddScope"
          component={AddScopeScreen}
          options={{ title: "Budgetpost" }}
        />
        <Stack.Screen name="LogWork" component={LogWorkScreen} options={{ title: "Logga arbete" }} />
        <Stack.Screen name="Ata" component={AtaScreen} options={{ title: "ÄTA" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
