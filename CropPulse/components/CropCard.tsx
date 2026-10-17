import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { MarketplaceListing } from "@/types";

interface CropCardProps {
  listing: MarketplaceListing;
  onPress?: () => void;
}

export function CropCard({ listing, onPress }: CropCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.secondaryContainer }]}>
        <Text style={styles.icon}>{listing.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
          {listing.cropName}
        </Text>
        <View style={styles.row}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={[styles.meta, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {listing.location} · {listing.quantityAvailable}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.sellerAvatar, { backgroundColor: listing.seller.avatarColor }]}>
            <Text style={styles.sellerInitials}>{listing.seller.initials}</Text>
          </View>
          <Text style={[styles.sellerName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {listing.seller.name}
          </Text>
          {listing.seller.verified && (
            <MaterialCommunityIcons name="check-decagram" size={13} color={colors.primary} style={{ marginLeft: 2 }} />
          )}
          <MaterialCommunityIcons name="star" size={12} color={colors.accent} style={{ marginLeft: spacing.sm }} />
          <Text style={[styles.rating, { color: colors.onSurfaceVariant }]}>{listing.seller.rating}</Text>
        </View>
      </View>

      <View style={styles.priceCol}>
        <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(listing.pricePerUnit)}</Text>
        <Text style={[styles.unit, { color: colors.onSurfaceVariant }]}>/{listing.unit}</Text>
        <View style={[styles.freshBadge, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.freshText, { color: colors.onPrimaryContainer }]}>{listing.freshness}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  icon: { fontSize: 26 },
  name: { ...typography.titleSm },
  row: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  meta: { ...typography.caption, marginLeft: 3 },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerInitials: { color: "#fff", fontSize: 8, fontWeight: "700" },
  sellerName: { ...typography.caption, marginLeft: 4, maxWidth: 90 },
  rating: { ...typography.caption, marginLeft: 2 },
  priceCol: { alignItems: "flex-end", marginLeft: spacing.sm },
  price: { ...typography.titleSm, fontWeight: "700" },
  unit: { ...typography.caption },
  freshBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  freshText: { ...typography.caption, fontWeight: "600" },
});
