import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFadeIn } from "@/hooks/useFadeIn";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { spacing, typography, radius } from "@/constants/theme";
import { Animated } from "react-native";

interface PlaceholderScreenProps {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  message: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  showBack?: boolean;
}

export function PlaceholderScreen({
  title,
  icon,
  message,
  primaryLabel = "Back to Home",
  onPrimaryPress,
  showBack = true,
}: PlaceholderScreenProps) {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(60);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <Header title={title} showBack={showBack} onBack={() => router.back()} />
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
          <MaterialCommunityIcons name={icon} size={44} color={colors.primary} />
        </View>
        <View style={[styles.badge, { backgroundColor: colors.accent + "33" }]}>
          <MaterialCommunityIcons name="hammer-wrench" size={13} color={colors.onSurface} />
          <Text style={[styles.badgeText, { color: colors.onSurface }]}>Coming soon</Text>
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>
        <Button
          label={primaryLabel}
          onPress={onPrimaryPress ?? (() => router.replace("/(tabs)/home"))}
          style={{ marginTop: spacing.xl, minWidth: 200 }}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  badgeText: { ...typography.caption, fontWeight: "700" },
  title: { ...typography.headline, textAlign: "center", marginBottom: spacing.sm },
  message: { ...typography.body, textAlign: "center", lineHeight: 22 },
});
