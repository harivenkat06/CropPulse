/**
 * Shared Logistics Dashboard — Main screen showing available transport requests.
 */

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius, elevation } from "@/constants/theme";
import { useLogistics, useMyLogistics, useLogisticsNotifications } from "@/context/LogisticsContext";
import { formatLocation, formatLogisticsDate, formatRoute } from "@/utils/logistics";
import { LogisticsRequestCard } from "@/components/logistics/LogisticsRequestCard";
import { StatusBadge } from "@/components/logistics/StatusBadge";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import type { LogisticsRequest } from "@/types/logistics";

type TabKey = "available" | "my";

export default function LogisticsScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const { state, requestToJoin, refresh, loading: requestsLoading } = useLogistics();
  const { user } = useAuth();
  const { myRequests, joinedRequests } = useMyLogistics();
  const { unreadCount } = useLogisticsNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>("available");
  const [query, setQuery] = useState("");
  const [joiningRequestId, setJoiningRequestId] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState<{ requestId: string; text: string; error: boolean } | null>(null);

  // Available requests: exclude current user's own requests
  const availableRequests = useMemo(() => {
    return state.requests
      .filter((r) => {
        if (r.farmerId === user?.id) return false;
        if (!["OPEN", "CONFIRMED"].includes(r.status)) return false;
        if (query.trim().length > 0) {
          const q = query.toLowerCase();
          return (
            r.crop.toLowerCase().includes(q) ||
            r.pickupLocation.town.toLowerCase().includes(q) ||
            r.destination.town.toLowerCase().includes(q) ||
            r.farmerName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.requests, query, user?.id]);

  const getParticipantInfo = (request: LogisticsRequest) => {
    const participants = state.participants.filter(
      (p) => p.requestId === request.id && p.status === "ACCEPTED"
    );
    const farmerCount = participants.length + 1;
    const totalQuantity =
      request.quantity + participants.reduce((sum, p) => sum + p.quantity, 0);
    return { farmerCount, totalQuantity };
  };

  const handleJoinRequest = async (request: LogisticsRequest) => {
    const alreadyJoined = state.participants.some(
      (p) => p.requestId === request.id && p.farmerId === user?.id
    );
    const hasPending = state.joinRequests.some(
      (j) => j.requestId === request.id && j.farmerId === user?.id && j.status === "PENDING"
    );

    if (alreadyJoined) {
      setJoinMessage({ requestId: request.id, text: "You are already part of this transport group.", error: true });
      return;
    }
    if (hasPending) {
      setJoinMessage({ requestId: request.id, text: "Your join request is already pending.", error: false });
      return;
    }

    setJoiningRequestId(request.id);
    setJoinMessage(null);
    try {
      await requestToJoin(
        request.id,
        200,
        [user?.village, user?.district, user?.state].filter(Boolean).join(", ")
      );
      setJoinMessage({
        requestId: request.id,
        text: "Request sent. The transport organizer will be notified.",
        error: false,
      });
    } catch (error) {
      setJoinMessage({
        requestId: request.id,
        text: error instanceof Error ? error.message : "Couldn't send request. Please try again.",
        error: true,
      });
    } finally {
      setJoiningRequestId(null);
    }
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "available", label: "Available", icon: "truck-outline" },
    { key: "my", label: "My Logistics", icon: "account-outline" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[styles.title, { color: colors.onSurface }]}>Shared Logistics</Text>
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                Coordinate transport with nearby farmers
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={[styles.bellBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={colors.onSurface} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Create button */}
          <Pressable
            onPress={() => router.push("/logistics-create" as any)}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
            <Text style={[styles.createBtnText, { color: colors.onPrimary }]}>
              Create Transport Request
            </Text>
          </Pressable>

          {/* Tabs */}
          <View style={[styles.tabRow, { backgroundColor: colors.surfaceVariant }]}>
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tab,
                    active && { backgroundColor: colors.primary },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={16}
                    color={active ? colors.onPrimary : colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: active ? colors.onPrimary : colors.onSurfaceVariant },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {activeTab === "available" ? (
          <>
            {/* Search */}
            <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Search crops, locations..."
              />
            </View>

            {/* Request list */}
            <FlatList
              data={availableRequests}
              keyExtractor={(r) => r.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const info = getParticipantInfo(item);
                const message = joinMessage?.requestId === item.id ? joinMessage : null;
                return (
                  <View>
                    <LogisticsRequestCard
                      request={item}
                      farmerCount={info.farmerCount}
                      totalQuantity={info.totalQuantity}
                      onViewDetails={() => router.push(`/logistics-detail?id=${item.id}` as any)}
                      onJoinRequest={() => handleJoinRequest(item)}
                      joining={joiningRequestId === item.id}
                      joinPending={state.joinRequests.some(
                        (join) => join.requestId === item.id && join.farmerId === user?.id && join.status === "PENDING"
                      )}
                    />
                    {message && (
                      <Text
                        accessibilityRole="alert"
                        style={{
                          color: message.error ? colors.danger : colors.success,
                          marginTop: -spacing.sm,
                          marginBottom: spacing.md,
                          paddingHorizontal: spacing.xs,
                        }}
                      >
                        {message.text}
                      </Text>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="truck-outline" size={48} color={colors.onSurfaceVariant} />
                  <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                    No transport requests
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                    {query
                      ? "No requests match your search. Try different keywords."
                      : "Be the first to create a transport request and connect with nearby farmers."}
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <MyLogisticsTab />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────
// My Logistics Tab (inline)
// ────────────────────────────────────────────

function MyLogisticsTab() {
  const { colors } = useTheme();
  const { state, refresh } = useLogistics();
  const { myRequests, joinedRequests, completed } = useMyLogistics();

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const getParticipantInfo = (request: LogisticsRequest) => {
    const participants = state.participants.filter(
      (p) => p.requestId === request.id && p.status === "ACCEPTED"
    );
    return participants.length + 1;
  };

  const renderMiniCard = (request: LogisticsRequest, label: string) => (
    <Pressable
      key={request.id}
      onPress={() => router.push(`/logistics-detail?id=${request.id}` as any)}
      style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.outlineVariant }]}
    >
      <View style={styles.miniCardHeader}>
        <View style={styles.miniCardLeft}>
          <Text style={{ fontSize: 22 }}>{request.cropIcon}</Text>
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={[styles.miniCardTitle, { color: colors.onSurface }]}>{request.crop}</Text>
            <Text style={[styles.miniCardRoute, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {formatRoute(request.pickupLocation, request.destination)}
            </Text>
          </View>
        </View>
        <StatusBadge status={request.status} />
      </View>
      <View style={styles.miniCardFooter}>
        <View style={styles.miniCardInfo}>
          <MaterialCommunityIcons name="calendar-outline" size={12} color={colors.onSurfaceVariant} />
          <Text style={[styles.miniCardMeta, { color: colors.onSurfaceVariant }]}>
            {formatLogisticsDate(request.preferredDate)}
          </Text>
        </View>
        <View style={styles.miniCardInfo}>
          <MaterialCommunityIcons name="account-group-outline" size={12} color={colors.onSurfaceVariant} />
          <Text style={[styles.miniCardMeta, { color: colors.onSurfaceVariant }]}>
            {getParticipantInfo(request)} farmers
          </Text>
        </View>
        <Text style={[styles.miniCardLabel, { color: colors.primary }]}>{label}</Text>
      </View>
    </Pressable>
  );

  const hasContent = myRequests.length > 0 || joinedRequests.length > 0 || completed.length > 0;

  return (
    <FlatList
      data={[{ key: "content" }]}
      keyExtractor={(i) => i.key}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={() => (
        <View>
          {!hasContent && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="account-outline" size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                No logistics yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Create a transport request or join an existing one to get started.
              </Text>
            </View>
          )}

          {myRequests.length > 0 && (
            <View style={styles.mySection}>
              <Text style={[styles.mySectionTitle, { color: colors.onSurface }]}>My Requests</Text>
              {myRequests.map((r) => renderMiniCard(r, "Owner"))}
            </View>
          )}

          {joinedRequests.length > 0 && (
            <View style={styles.mySection}>
              <Text style={[styles.mySectionTitle, { color: colors.onSurface }]}>
                Requests I Joined
              </Text>
              {joinedRequests.map((r) => renderMiniCard(r, "Joined"))}
            </View>
          )}

          {completed.length > 0 && (
            <View style={styles.mySection}>
              <Text style={[styles.mySectionTitle, { color: colors.onSurface }]}>Completed</Text>
              {completed.map((r) => renderMiniCard(r, "Done"))}
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.headline },
  subtitle: { ...typography.caption, marginTop: 1 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  createBtnText: { ...typography.body, fontWeight: "700" },
  tabRow: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: 3,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  tabText: { ...typography.bodySm, fontWeight: "600" },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.title, marginTop: spacing.md },
  emptyText: { ...typography.body, textAlign: "center", marginTop: spacing.xs },

  // My Logistics
  mySection: { marginBottom: spacing.xl },
  mySectionTitle: { ...typography.title, marginBottom: spacing.md },
  miniCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  miniCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  miniCardTitle: { ...typography.titleSm },
  miniCardRoute: { ...typography.caption, marginTop: 1 },
  miniCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.md,
  },
  miniCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  miniCardMeta: { ...typography.caption },
  miniCardLabel: { ...typography.caption, fontWeight: "700", marginLeft: "auto" },
});
