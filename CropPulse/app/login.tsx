import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius } from "@/constants/theme";
import { Animated } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { opacity, translateY } = useFadeIn(80);

  const handleLogin = async () => {
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!normalizedPhone || !password) {
      setError("Enter both your phone number and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(normalizedPhone, password);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      setError(
        error.message === "Network request failed" || error.message === "Failed to fetch"
          ? "Couldn't reach CropPulse. Make sure the backend is running and your device is on the same network."
          : error.message || "Invalid phone number or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryContainer }]}>
              <Text style={styles.logoEmoji}>🌱</Text>
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Log in to check today's prices and offers
            </Text>

            <View style={{ marginTop: spacing.xl }}>
              <Input
                label="Phone Number"
                placeholder="98765 43210"
                keyboardType="phone-pad"
                icon="phone-outline"
                value={phone}
                onChangeText={setPhone}
                autoComplete="tel"
                returnKeyType="next"
              />
              <Input
                label="Password"
                placeholder="••••••••"
                isPassword
                icon="lock-outline"
                value={password}
                onChangeText={setPassword}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password?</Text>

              <Button label="Log In" onPress={handleLogin} loading={loading} fullWidth size="lg" style={{ marginTop: spacing.sm }} />
              {error ? (
                <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                  {error}
                </Text>
              ) : null}

              <View style={styles.dividerRow}>
                <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
                <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>or</Text>
                <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
              </View>

              <Button
                label="Continue as Guest"
                variant="outline"
                fullWidth
                size="lg"
                onPress={() => router.replace("/(tabs)/home")}
              />
            </View>

            <View style={styles.signupRow}>
              <Text style={{ color: colors.onSurfaceVariant, ...typography.body }}>New to CropPulse? </Text>
              <Text
                onPress={() => router.push("/signup")}
                style={{ color: colors.primary, ...typography.body, fontWeight: "700" }}
              >
                Sign up
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoEmoji: { fontSize: 32 },
  title: { ...typography.displayMd },
  subtitle: { ...typography.body, marginTop: spacing.xs },
  forgot: { ...typography.bodySm, textAlign: "right", fontWeight: "600", marginBottom: spacing.lg },
  error: { ...typography.bodySm, marginTop: spacing.md, textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.lg },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: spacing.md, ...typography.caption },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
});
