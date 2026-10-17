/**
 * StatusBadge — Displays a logistics status with color-coded indicator.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";
import type { LogisticsStatus } from "@/types/logistics";
import { getStatusMeta } from "@/utils/logistics";

interface StatusBadgeProps {
  status: LogisticsStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { colors } = useTheme();
  const meta = getStatusMeta(status);
  const color = colors[meta.colorKey];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "1A",
          paddingHorizontal: size === "md" ? spacing.md : spacing.sm,
          paddingVertical: size === "md" ? 6 : 3,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={meta.icon as any}
        size={size === "md" ? 14 : 11}
        color={color}
      />
      <Text
        style={[
          size === "md" ? styles.labelMd : styles.label,
          { color },
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    gap: 3,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
  },
  labelMd: {
    ...typography.bodySm,
    fontWeight: "700",
  },
});
