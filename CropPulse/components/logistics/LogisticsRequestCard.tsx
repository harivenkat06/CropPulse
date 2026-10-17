/**
 * LogisticsRequestCard — Displays a transport request in card format.
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius, elevation } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { formatLogisticsDate, formatLocation, formatDistance } from "@/utils/logistics";
import type { LogisticsRequest } from "@/types/logistics";
import { StatusBadge } from "./StatusBadge";

interface LogisticsRequestCardProps {
  request: LogisticsRequest;
  farmerCount: number;
  totalQuantity: number;
  distanceKm?: number;
  onViewDetails?: () => void;
  onJoinRequest?: () => void;
  joinPending?: boolean;
  joining?: boolean;
  showJoinButton?: boolean;
}

export function LogisticsRequestCard({
  request,
  farmerCount,
  totalQuantity,
  distanceKm,
  onViewDetails,
  onJoinRequest,
  joinPending = false,
  joining = false,
  showJoinButton = true,
}: LogisticsRequestCardProps) {
  const { colors } = useTheme();
  const usedCapacity = totalQuantity;
  const remainingCapacity = request.vehicleCapacity - usedCapacity;
  const capacityPercent = Math.min((usedCapacity / request.vehicleCapacity) * 100, 100);

  return (
    <Pressable
      onPress={onViewDetails}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.outlineVariant,
          opacity: pressed ? 0.92 : 1,
        },
        elevation.level1,
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.cropIcon}>{request.cropIcon}</Text>
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={[styles.cropName, { color: colors.onSurface }]} numberOfLines={1}>
              {request.crop}
            </Text>
            <Text style={[styles.quantity, { color: colors.onSurfaceVariant }]}>
              {request.quantity} kg
            </Text>
          </View>
        </View>
        <StatusBadge status={request.status} />
      </View>

      {/* Route */}
      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
          <View style={styles.routeTextWrap}>
            <Text style={[styles.routeLabel, { color: colors.onSurfaceVariant }]}>Pickup</Text>
            <Text style={[styles.routeValue, { color: colors.onSurface }]} numberOfLines={1}>
              {formatLocation(request.pickupLocation)}
            </Text>
          </View>
        </View>
        <View style={[styles.routeLine, { borderLeftColor: colors.outlineVariant }]} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.accent }]} />
          <View style={styles.routeTextWrap}>
            <Text style={[styles.routeLabel, { color: colors.onSurfaceVariant }]}>Destination</Text>
            <Text style={[styles.routeValue, { color: colors.onSurface }]} numberOfLines={1}>
              {formatLocation(request.destination)}
            </Text>
          </View>
        </View>
      </View>

      {/* Distance badge (if provided) */}
      {distanceKm !== undefined && (
        <View style={[styles.distanceBadge, { backgroundColor: colors.primaryContainer }]}>
          <MaterialCommunityIcons name="map-marker-distance" size={12} color={colors.primary} />
          <Text style={[styles.distanceText, { color: colors.onPrimaryContainer }]}>
            📍 {formatDistance(distanceKm)}
          </Text>
        </View>
      )}

      {/* Info row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            {formatLogisticsDate(request.preferredDate)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="clock-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            {request.preferredTime}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="truck-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            {request.vehicleType}
          </Text>
        </View>
      </View>

      {/* Capacity & farmers row */}
      <View style={[styles.capacitySection, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.capacityRow}>
          <View style={styles.capacityStat}>
            <MaterialCommunityIcons name="account-group-outline" size={14} color={colors.primary} />
            <Text style={[styles.capacityStatText, { color: colors.onSurface }]}>
              {farmerCount} / {request.maxFarmers}
            </Text>
            <Text style={[styles.capacityStatLabel, { color: colors.onSurfaceVariant }]}>
              farmers
            </Text>
          </View>
          <View style={styles.capacityStat}>
            <MaterialCommunityIcons name="weight" size={14} color={colors.primary} />
            <Text style={[styles.capacityStatText, { color: colors.onSurface }]}>
              {remainingCapacity > 0 ? remainingCapacity : 0} kg
            </Text>
            <Text style={[styles.capacityStatLabel, { color: colors.onSurfaceVariant }]}>
              available
            </Text>
          </View>
          <View style={styles.capacityStat}>
            <Text style={[styles.costValue, { color: colors.primary }]}>
              {formatCurrency(request.estimatedCost)}
            </Text>
            <Text style={[styles.capacityStatLabel, { color: colors.onSurfaceVariant }]}>
              est. cost
            </Text>
          </View>
        </View>

        {/* Capacity bar */}
        <View style={[styles.capacityBar, { backgroundColor: colors.outlineVariant }]}>
          <View
            style={[
              styles.capacityFill,
              {
                width: `${capacityPercent}%`,
                backgroundColor: capacityPercent >= 100 ? colors.danger : colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onViewDetails}
          style={[styles.actionBtn, { borderColor: colors.outlineVariant }]}
        >
          <MaterialCommunityIcons name="eye-outline" size={15} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>View Details</Text>
        </Pressable>
        {showJoinButton && request.status === "OPEN" && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onJoinRequest?.();
            }}
            disabled={joinPending || joining}
            style={[
              styles.actionBtn,
              styles.joinBtn,
              { backgroundColor: joinPending ? colors.surfaceVariant : colors.primary },
              (joinPending || joining) && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name={joinPending ? "clock-outline" : "account-plus-outline"}
              size={15}
              color={joinPending ? colors.onSurfaceVariant : colors.onPrimary}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: joinPending ? colors.onSurfaceVariant : colors.onPrimary },
              ]}
            >
              {joining ? "Sending..." : joinPending ? "Request Pending" : "Request to Join"}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cropIcon: { fontSize: 28 },
  cropName: { ...typography.title },
  quantity: { ...typography.caption, marginTop: 1 },
  routeSection: {
    marginTop: spacing.lg,
    paddingLeft: spacing.xs,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    borderLeftWidth: 2,
    borderStyle: "dashed",
    height: 16,
    marginLeft: 4,
  },
  routeTextWrap: {
    marginLeft: spacing.md,
    flex: 1,
  },
  routeLabel: { ...typography.caption },
  routeValue: { ...typography.bodySm, fontWeight: "600" },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    gap: 4,
  },
  distanceText: { ...typography.caption, fontWeight: "600" },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  infoText: { ...typography.caption },
  capacitySection: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  capacityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  capacityStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  capacityStatText: { ...typography.bodySm, fontWeight: "700" },
  capacityStatLabel: { ...typography.caption },
  costValue: { ...typography.bodySm, fontWeight: "700" },
  capacityBar: {
    height: 5,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  joinBtn: {
    borderWidth: 0,
  },
  actionBtnText: { ...typography.bodySm, fontWeight: "600" },
});
