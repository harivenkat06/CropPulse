import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { typography, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    if (!loading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/onboarding");
        }
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated]);

  return (
    <LinearGradient colors={["#2E7D32", "#66BB6A"]} style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: "center" }}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌱</Text>
        </View>
        <Text style={styles.title}>CropPulse</Text>
        <Text style={styles.subtitle}>Smarter farming, better prices</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoEmoji: { fontSize: 48 },
  title: { ...typography.displayLg, color: "#fff", fontWeight: "700" },
  subtitle: { ...typography.body, color: "rgba(255,255,255,0.85)", marginTop: spacing.xs },
});
