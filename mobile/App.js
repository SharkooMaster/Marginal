import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors, font } from "./src/theme";
import ProjectsScreen from "./src/screens/ProjectsScreen";
import ProjectDetailScreen from "./src/screens/ProjectDetailScreen";
import LogWorkScreen from "./src/screens/LogWorkScreen";
import AtaScreen from "./src/screens/AtaScreen";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.primaryDeep,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primaryDeep },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800", fontSize: font.h3 },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Projects"
          component={ProjectsScreen}
          options={{ title: "Marginal" }}
        />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{ title: "Projekt" }}
        />
        <Stack.Screen
          name="LogWork"
          component={LogWorkScreen}
          options={{ title: "Logga arbete" }}
        />
        <Stack.Screen
          name="Ata"
          component={AtaScreen}
          options={{ title: "ÄTA" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
