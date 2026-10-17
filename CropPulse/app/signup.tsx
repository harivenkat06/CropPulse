import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius } from "@/constants/theme";
import { Animated } from "react-native";

export default function SignupScreen() {
  const { colors } = useTheme();
  const { register } = useAuth();
  const { opacity, translateY } = useFadeIn(80);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"FARMER" | "BUYER" | "LOGISTICS_PROVIDER">("FARMER");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [village, setVillage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !phone || !password || !district || !village) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await register({
        role,
        name,
        phone,
        password,
        district,
        state,
        village,
      });
      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <Text style={[styles.title, { color: colors.onSurface }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Join the CropPulse community
            </Text>

            {/* Role selector chips */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant, marginTop: spacing.lg }]}>I AM A</Text>
            <View style={styles.roleContainer}>
              {(["FARMER", "BUYER", "LOGISTICS_PROVIDER"] as const).map((r) => {
                const active = role === r;
                const label = r === "LOGISTICS_PROVIDER" ? "Logistics" : r.charAt(0) + r.slice(1).toLowerCase();
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceVariant,
                        borderColor: active ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    <Text style={[styles.roleText, { color: active ? colors.onPrimary : colors.onSurface }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                icon="account-outline"
                value={name}
                onChangeText={setName}
              />
              <Input
                label="Phone Number"
                placeholder="98765 43210"
                keyboardType="phone-pad"
                icon="phone-outline"
                value={phone}
                onChangeText={setPhone}
              />
              <Input
                label="Password"
                placeholder="••••••••"
                isPassword
                icon="lock-outline"
                value={password}
                onChangeText={setPassword}
              />
              
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="District"
                    placeholder="Coimbatore"
                    icon="map-marker-outline"
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
                <View style={{ width: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Input
                    label="Village / Area"
                    placeholder="Sulur"
                    icon="home-outline"
                    value={village}
                    onChangeText={setVillage}
                  />
                </View>
              </View>

              <Button
                label="Sign Up"
                onPress={handleSignup}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.lg }}
              />
            </View>

            <View style={styles.loginRow}>
              <Text style={{ color: colors.onSurfaceVariant, ...typography.body }}>Already have an account? </Text>
              <Text
                onPress={() => router.replace("/login")}
                style={{ color: colors.primary, ...typography.body, fontWeight: "700" }}
              >
                Log in
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
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { ...typography.displayMd },
  subtitle: { ...typography.body, marginTop: spacing.xs },
  label: { ...typography.label, marginBottom: spacing.xs, letterSpacing: 0.5 },
  roleContainer: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  roleChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  roleText: { ...typography.bodySm, fontWeight: "700" },
  row: { flexDirection: "row" },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
});
