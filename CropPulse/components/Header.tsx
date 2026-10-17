import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightPress?: () => void;
  transparent?: boolean;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
  transparent = false,
}: HeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: transparent ? "transparent" : colors.background },
      ]}
    >
      <View style={styles.side}>
        {showBack && (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceVariant }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
          </Pressable>
        )}
      </View>

      <View style={styles.center}>
        {title && (
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.side}>
        {rightIcon && (
          <Pressable
            onPress={onRightPress}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceVariant }]}
          >
            <MaterialCommunityIcons name={rightIcon} size={20} color={colors.onSurface} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  side: { width: 40, alignItems: "flex-start" },
  center: { flex: 1, alignItems: "center" },
  title: { ...typography.title },
  subtitle: { ...typography.caption, marginTop: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
