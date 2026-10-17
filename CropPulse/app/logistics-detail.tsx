/**
 * LogisticsDetailScreen — View details of a transport request, accept/reject join requests,
 * check matching nearby requests, and manage status or open chat.
 */

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius, elevation } from "@/constants/theme";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  useLogistics,
  useLogisticsRequest,
  useIsParticipant,
} from "@/context/LogisticsContext";
import {
  formatLocation,
  formatLogisticsDate,
  findCompatibleRequests,
  formatDistance,
} from "@/utils/logistics";
import { StatusBadge } from "@/components/logistics/StatusBadge";
import type { LogisticsStatus, JoinRequestStatus } from "@/types/logistics";

export default function LogisticsDetailScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, requestToJoin, respondToJoin, updateRequestStatus } = useLogistics();
  const { user } = useAuth();
  const { request, participants, pendingJoins, totalQuantity, farmerCount } =
    useLogisticsRequest(id || "");
  const { isOwner, hasPendingJoin, isParticipant } =
    useIsParticipant(id || "");

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [respondingJoinId, setRespondingJoinId] = useState<string | null>(null);
  const [joinFeedback, setJoinFeedback] = useState<{ text: string; error: boolean } | null>(null);

  // Find compatible nearby requests
  const compatibleRequests = useMemo(() => {
    if (!request) return [];
    return findCompatibleRequests(state.requests, request, 50); // within 50km
  }, [state.requests, request]);

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <Header title="Not Found" showBack onBack={() => router.back()} />
        <View style={styles.errorCenter}>
          <Text style={{ color: colors.onSurface }}>Logistics request not found.</Text>
          <Button label="Go Back" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const remainingCapacity = Math.max(0, request.vehicleCapacity - totalQuantity);
  const groupIsFull = farmerCount >= request.maxFarmers || remainingCapacity <= 0;
  const capacityPercent = Math.min((totalQuantity / request.vehicleCapacity) * 100, 100);

  const handleJoinRequest = async () => {
    setJoining(true);
    setJoinFeedback(null);
    try {
      await requestToJoin(
        request.id,
        Math.min(200, Math.max(1, remainingCapacity)),
        [user?.village, user?.district, user?.state].filter(Boolean).join(", ")
      );
      setJoinFeedback({ text: "Request sent. The transport organizer will be notified.", error: false });
    } catch (error) {
      setJoinFeedback({
        text: error instanceof Error ? error.message : "Couldn't send request. Please try again.",
        error: true,
      });
    } finally {
      setJoining(false);
    }
  };

  const handleRespondToJoin = async (joinRequestId: string, status: "ACCEPTED" | "REJECTED") => {
    setRespondingJoinId(joinRequestId);
    setJoinFeedback(null);
    try {
      await respondToJoin(joinRequestId, status);
      setJoinFeedback({
        text: status === "ACCEPTED" ? "Join request accepted." : "Join request declined.",
        error: false,
      });
    } catch (error) {
      setJoinFeedback({
        text: error instanceof Error ? error.message : "Couldn't update join request. Please try again.",
        error: true,
      });
    } finally {
      setRespondingJoinId(null);
    }
  };

  const handleUpdateStatus = async (status: LogisticsStatus) => {
    setStatusDropdownOpen(false);
    try {
      await updateRequestStatus(request.id, status);
    } catch (error) {
      Alert.alert("Couldn't Update Status", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const possibleStatuses: LogisticsStatus[] = [
    ...(request.status === "CONFIRMED" ? ["IN_PROGRESS" as const, "CANCELLED" as const] : []),
    ...(request.status === "IN_PROGRESS" ? ["COMPLETED" as const, "CANCELLED" as const] : []),
    ...(request.status === "OPEN" ? ["CANCELLED" as const] : []),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <Header title="Request Details" showBack onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          {/* Main Info Card */}
          <Card padded style={styles.mainCard}>
            <View style={styles.headerRow}>
              <View style={styles.cropInfo}>
                <Text style={styles.cropIcon}>{request.cropIcon}</Text>
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={[styles.cropName, { color: colors.onSurface }]}>{request.crop}</Text>
                  <Text style={[styles.ownerName, { color: colors.onSurfaceVariant }]}>
                    Organized by {request.farmerName}
                  </Text>
                </View>
              </View>
              <StatusBadge status={request.status} size="md" />
            </View>

            {/* Owner Actions (Status Dropdown) */}
            {isOwner && possibleStatuses.length > 0 && (
              <View style={{ marginTop: spacing.md, zIndex: 10 }}>
                <Pressable
                  onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  style={[styles.statusSelectBtn, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.statusSelectText, { color: colors.onSurface }]}>
                    Manage Status: {request.status}
                  </Text>
                  <MaterialCommunityIcons
                    name={statusDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.onSurface}
                  />
                </Pressable>
                {statusDropdownOpen && (
                  <View style={[styles.statusDropdown, { backgroundColor: colors.card, borderColor: colors.outlineVariant }]}>
                    {possibleStatuses.map((st) => (
                      <Pressable
                        key={st}
                        onPress={() => handleUpdateStatus(st)}
                        style={[styles.dropdownItem, request.status === st && { backgroundColor: colors.primaryContainer }]}
                      >
                        <Text style={{ color: colors.onSurface, ...typography.bodySm, fontWeight: "600" }}>{st}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Route Detail */}
            <View style={styles.routeSection}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <View style={styles.routeTextWrap}>
                  <Text style={[styles.routeLabel, { color: colors.onSurfaceVariant }]}>PICKUP</Text>
                  <Text style={[styles.routeValue, { color: colors.onSurface }]}>
                    {formatLocation(request.pickupLocation)}
                  </Text>
                  <Text style={[styles.routeSubText, { color: colors.onSurfaceVariant }]}>
                    {request.pickupLocation.state}
                  </Text>
                </View>
              </View>
              <View style={[styles.routeLine, { borderLeftColor: colors.outlineVariant }]} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.accent }]} />
                <View style={styles.routeTextWrap}>
                  <Text style={[styles.routeLabel, { color: colors.onSurfaceVariant }]}>DESTINATION</Text>
                  <Text style={[styles.routeValue, { color: colors.onSurface }]}>
                    {formatLocation(request.destination)}
                  </Text>
                  <Text style={[styles.routeSubText, { color: colors.onSurfaceVariant }]}>
                    {request.destination.state}
                  </Text>
                </View>
              </View>
            </View>

            {/* Key Logistics Details Grid */}
            <View style={[styles.grid, { borderColor: colors.outlineVariant }]}>
              <View style={styles.gridItem}>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.primary} />
                <View style={styles.gridText}>
                  <Text style={[styles.gridLabel, { color: colors.onSurfaceVariant }]}>Date</Text>
                  <Text style={[styles.gridVal, { color: colors.onSurface }]}>
                    {formatLogisticsDate(request.preferredDate)}
                  </Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                <View style={styles.gridText}>
                  <Text style={[styles.gridLabel, { color: colors.onSurfaceVariant }]}>Time</Text>
                  <Text style={[styles.gridVal, { color: colors.onSurface }]}>{request.preferredTime}</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <MaterialCommunityIcons name="truck-outline" size={18} color={colors.primary} />
                <View style={styles.gridText}>
                  <Text style={[styles.gridLabel, { color: colors.onSurfaceVariant }]}>Vehicle</Text>
                  <Text style={[styles.gridVal, { color: colors.onSurface }]}>{request.vehicleType}</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <MaterialCommunityIcons name="cash" size={18} color={colors.primary} />
                <View style={styles.gridText}>
                  <Text style={[styles.gridLabel, { color: colors.onSurfaceVariant }]}>Total Cost</Text>
                  <Text style={[styles.gridVal, { color: colors.onSurface }]}>
                    ₹{request.estimatedCost.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Capacity Meter */}
            <View style={styles.capacitySection}>
              <View style={styles.capacityHeader}>
                <Text style={{ color: colors.onSurface, ...typography.titleSm }}>Vehicle Capacity</Text>
                <Text style={{ color: colors.primary, ...typography.titleSm, fontWeight: "700" }}>
                  {totalQuantity} kg / {request.vehicleCapacity} kg
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.outlineVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${capacityPercent}%`,
                      backgroundColor: capacityPercent >= 100 ? colors.danger : colors.primary,
                    },
                  ]}
                />
              </View>
              <View style={styles.capacityFooter}>
                <Text style={[styles.capacityLabel, { color: colors.onSurfaceVariant }]}>
                  {farmerCount} farmers participating
                </Text>
                <Text style={[styles.capacityLabel, { color: colors.onSurfaceVariant }]}>
                  {remainingCapacity > 0 ? `${remainingCapacity} kg left` : "No capacity left"}
                </Text>
              </View>
            </View>

            {/* Notes Section */}
            {request.notes ? (
              <View style={[styles.notesBox, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.notesTitle, { color: colors.onSurface }]}>Notes:</Text>
                <Text style={[styles.notesText, { color: colors.onSurfaceVariant }]}>{request.notes}</Text>
              </View>
            ) : null}

            {/* Action Section */}
            <View style={{ marginTop: spacing.lg }}>
              {isParticipant ? (
                <Button
                  label="Open Group Chat"
                  onPress={() => router.push(`/logistics-chat?id=${request.id}` as any)}
                  icon="chat-outline"
                  fullWidth
                  size="lg"
                />
              ) : request.status === "OPEN" && !groupIsFull ? (
                hasPendingJoin ? (
                  <Button
                    label="Join Request Pending"
                    disabled
                    variant="outline"
                    icon="clock-outline"
                    fullWidth
                    size="lg"
                  />
                ) : (
                  <Button
                    label={joining ? "Sending Request..." : "Request to Join"}
                    onPress={handleJoinRequest}
                    disabled={joining}
                    icon="account-plus-outline"
                    fullWidth
                    size="lg"
                  />
                )
              ) : (
                <Button label="Transport Full/Unavailable" disabled variant="outline" fullWidth size="lg" />
              )}
              {joinFeedback && (
                <Text
                  accessibilityRole="alert"
                  style={{
                    color: joinFeedback.error ? colors.danger : colors.success,
                    ...typography.bodySm,
                    marginTop: spacing.sm,
                    textAlign: "center",
                  }}
                >
                  {joinFeedback.text}
                </Text>
              )}
            </View>
          </Card>

          {/* Group Participants */}
          <Card padded style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Transport Group</Text>
            <View style={styles.participantRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {request.farmerName.split(" ").map((n: string) => n[0]).join("")}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.participantName, { color: colors.onSurface }]}>
                  {request.farmerName} (Organizer)
                </Text>
                <Text style={[styles.participantSub, { color: colors.onSurfaceVariant }]}>
                  {request.quantity} kg
                </Text>
              </View>
            </View>
            {participants.map((p) => (
              <View key={p.id} style={styles.participantRow}>
                <View style={[styles.avatar, { backgroundColor: colors.secondaryContainer }]}>
                  <Text style={{ color: colors.secondary, fontWeight: "700" }}>
                    {p.farmerName.split(" ").map((n: string) => n[0]).join("")}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[styles.participantName, { color: colors.onSurface }]}>{p.farmerName}</Text>
                  <Text style={[styles.participantSub, { color: colors.onSurfaceVariant }]}>
                    {p.quantity} kg
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Join Requests (Owner only) */}
          {isOwner && pendingJoins.length > 0 && (
            <Card padded style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Join Requests</Text>
              {pendingJoins.map((jr) => (
                <View key={jr.id} style={styles.jrRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.participantName, { color: colors.onSurface }]}>{jr.farmerName}</Text>
                    <Text style={[styles.participantSub, { color: colors.onSurfaceVariant }]}>
                      {jr.quantity} kg of {jr.crop}
                    </Text>
                    <Text style={[styles.jrLocation, { color: colors.onSurfaceVariant }]}>
                      📍 {jr.farmerLocation}
                    </Text>
                  </View>
                  <View style={styles.jrActions}>
                    <Pressable
                      onPress={() => handleRespondToJoin(jr.id, "REJECTED")}
                      disabled={respondingJoinId === jr.id}
                      style={[styles.jrBtn, { backgroundColor: colors.danger + "15" }]}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={colors.danger} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRespondToJoin(jr.id, "ACCEPTED")}
                      disabled={respondingJoinId === jr.id}
                      style={[styles.jrBtn, { backgroundColor: colors.primary }]}
                    >
                      <MaterialCommunityIcons name="check" size={18} color={colors.onPrimary} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Location-based Matching Section */}
          <Card padded style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Potential shared transport available nearby
            </Text>
            {compatibleRequests.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No other matching transport requests found nearby on this date.
              </Text>
            ) : (
              compatibleRequests.map((cr) => (
                <Pressable
                  key={cr.id}
                  onPress={() => router.push(`/logistics-detail?id=${cr.id}` as any)}
                  style={[styles.compatCard, { backgroundColor: colors.surfaceVariant }]}
                >
                  <View style={styles.compatTop}>
                    <View style={styles.compatLeft}>
                      <Text style={{ fontSize: 20 }}>{cr.cropIcon}</Text>
                      <View style={{ marginLeft: spacing.sm }}>
                        <Text style={[styles.compatTitle, { color: colors.onSurface }]}>{cr.crop}</Text>
                        <Text style={[styles.compatFarmer, { color: colors.onSurfaceVariant }]}>
                          {cr.farmerName} · {cr.quantity} kg
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.distanceText, { color: colors.primary, fontWeight: "700" }]}>
                      📍 {formatDistance(cr.distanceKm)}
                    </Text>
                  </View>
                  <View style={styles.compatBottom}>
                    <Text style={[styles.compatLabel, { color: colors.onSurfaceVariant }]}>Route:</Text>
                    <Text style={[styles.compatRoute, { color: colors.onSurface }]} numberOfLines={1}>
                      {formatLocation(cr.pickupLocation)} → {formatLocation(cr.destination)}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </Card>

          <View style={{ height: spacing.xxl }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  errorCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  mainCard: { ...elevation.level1, marginBottom: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cropInfo: { flexDirection: "row", alignItems: "center" },
  cropIcon: { fontSize: 32 },
  cropName: { ...typography.headline },
  ownerName: { ...typography.caption, marginTop: 1 },
  statusSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  statusSelectText: { ...typography.bodySm, fontWeight: "700" },
  statusDropdown: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  dropdownItem: { padding: spacing.md },
  routeSection: { marginTop: spacing.xl, paddingLeft: spacing.xs },
  routeRow: { flexDirection: "row", alignItems: "flex-start" },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeLine: { borderLeftWidth: 2, borderStyle: "dashed", height: 24, marginLeft: 4 },
  routeTextWrap: { marginLeft: spacing.md, flex: 1 },
  routeLabel: { ...typography.caption, fontWeight: "700", letterSpacing: 0.5 },
  routeValue: { ...typography.bodySm, fontWeight: "600" },
  routeSubText: { ...typography.caption },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  gridItem: { flexDirection: "row", width: "45%", alignItems: "center", gap: spacing.sm },
  gridText: { flex: 1 },
  gridLabel: { ...typography.caption },
  gridVal: { ...typography.bodySm, fontWeight: "600" },
  capacitySection: { marginTop: spacing.xl },
  capacityHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  capacityFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  capacityLabel: { ...typography.caption },
  notesBox: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl },
  notesTitle: { ...typography.caption, fontWeight: "700" },
  notesText: { ...typography.bodySm, marginTop: 2, lineHeight: 18 },
  sectionCard: { ...elevation.level1, marginBottom: spacing.md },
  sectionTitle: { ...typography.title, marginBottom: spacing.md },
  participantRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  participantName: { ...typography.bodySm, fontWeight: "600" },
  participantSub: { ...typography.caption },
  jrRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#eee", paddingVertical: spacing.md },
  jrLocation: { ...typography.caption, marginTop: 2 },
  jrActions: { flexDirection: "row", gap: spacing.sm, marginLeft: spacing.sm },
  jrBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyText: { ...typography.bodySm, textAlign: "center", marginVertical: spacing.md },
  compatCard: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  compatTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  compatLeft: { flexDirection: "row", alignItems: "center" },
  compatTitle: { ...typography.titleSm },
  compatFarmer: { ...typography.caption },
  distanceText: { ...typography.caption },
  compatBottom: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: spacing.sm },
  compatLabel: { ...typography.caption },
  compatRoute: { ...typography.caption, flex: 1, fontWeight: "600" },
});
