import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";
import { formatCurrency, formatPercent } from "@/utils/format";
import { CropPrice } from "@/types";

interface PriceCardProps {
  item: CropPrice;
}

const trendMeta = {
  up: { icon: "trending-up" as const, colorKey: "success" as const },
  down: { icon: "trending-down" as const, colorKey: "danger" as const },
  flat: { icon: "trending-neutral" as const, colorKey: "onSurfaceVariant" as const },
};

export function PriceCard({ item }: PriceCardProps) {
  const { colors } = useTheme();
  const meta = trendMeta[item.trend];
  const trendColor = colors[meta.colorKey];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.outlineVariant }]}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={[styles.trendPill, { backgroundColor: trendColor + "22" }]}>
          <MaterialCommunityIcons name={meta.icon} size={12} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>{formatPercent(item.changePercent)}</Text>
        </View>
      </View>
      <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
        {item.cropName}
      </Text>
      <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(item.pricePerUnit)}</Text>
      <Text style={[styles.unit, { color: colors.onSurfaceVariant }]}>per {item.unit}</Text>
      <Text style={[styles.market, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
        {item.market}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  icon: { fontSize: 22 },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  trendText: { ...typography.caption, marginLeft: 2, fontWeight: "700" },
  name: { ...typography.titleSm, marginTop: spacing.sm },
  price: { ...typography.title, fontWeight: "700", marginTop: 2 },
  unit: { ...typography.caption },
  market: { ...typography.caption, marginTop: spacing.xs },
});
