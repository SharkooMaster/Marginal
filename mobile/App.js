import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors, font } from "./src/theme";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { LiveProvider } from "./src/live/LiveProvider";
import AppShell from "./src/navigation/AppShell";
import LandingScreen from "./src/screens/LandingScreen";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import PricingScreen from "./src/screens/PricingScreen";

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

function RootNavigator() {
  const { isAuthenticated, booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <AppShell />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700", fontSize: font.h3 },
        headerShadowVisible: false,
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "Logga in" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Skapa konto" }} />
      <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: "Priser" }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LiveProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </LiveProvider>
    </AuthProvider>
  );
}
