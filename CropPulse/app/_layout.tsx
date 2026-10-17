import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "@/hooks/useTheme";
import { LogisticsProvider } from "@/context/LogisticsContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  const { colors, isDark } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LogisticsProvider>
            <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade_from_bottom",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="logistics" />
            <Stack.Screen name="logistics-create" />
            <Stack.Screen name="logistics-detail" />
            <Stack.Screen name="logistics-chat" />
            <Stack.Screen name="orders" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="settings" />
          </Stack>
        </LogisticsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
}

