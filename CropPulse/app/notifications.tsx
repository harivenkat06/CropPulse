/**
 * NotificationsScreen — Displays real-time in-app notifications for logistics actions.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius } from "@/constants/theme";
import { Header } from "@/components/Header";
import { useLogistics } from "@/context/LogisticsContext";
import { formatRelativeTime } from "@/utils/logistics";
import type { LogisticsNotificationType } from "@/types/logistics";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const {
    state,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useLogistics();
  React.useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const handleNotificationPress = async (notificationId: string, requestId: string) => {
    try {
      await markNotificationRead(notificationId);
      if (requestId) router.push(`/logistics-detail?id=${requestId}` as any);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error(error);
    }
  };

  const notifications = state.notifications;

  const getNotificationIconMeta = (type: LogisticsNotificationType) => {
    switch (type) {
      case "JOIN_REQUEST":
        return { name: "account-plus" as const, colorKey: "primary" as const };
      case "JOIN_ACCEPTED":
      case "LOGISTICS_MATCHED":
        return { name: "check-decagram" as const, colorKey: "success" as const };
      case "JOIN_REJECTED":
        return { name: "close-circle" as const, colorKey: "danger" as const };
      case "NEW_MESSAGE":
        return { name: "message-text-outline" as const, colorKey: "info" as const };
      case "REQUEST_UPDATED":
      case "LOGISTICS_STATUS":
        return { name: "alert-circle-outline" as const, colorKey: "warning" as const };
      case "DATE_APPROACHING":
        return { name: "calendar-clock" as const, colorKey: "warning" as const };
      default:
        return { name: "bell-outline" as const, colorKey: "onSurfaceVariant" as const };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <Header
        title="Notifications"
        showBack
        onBack={() => router.back()}
        rightIcon="check-all"
        onRightPress={handleMarkAllRead}
      />

      <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const iconMeta = getNotificationIconMeta(item.type);
            const iconColor = colors[iconMeta.colorKey];

            return (
              <Pressable
                onPress={() => handleNotificationPress(item.id, item.requestId)}
                style={[
                  styles.notificationItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.outlineVariant,
                  },
                  !item.read && {
                    backgroundColor: colors.primaryContainer + "1A",
                    borderColor: colors.primary + "33",
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: iconColor + "15" }]}>
                  <MaterialCommunityIcons name={iconMeta.name} size={20} color={iconColor} />
                </View>

                <View style={styles.textWrap}>
                  <Text style={[styles.title, { color: colors.onSurface }, !item.read && { fontWeight: "700" }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.message, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={[styles.time, { color: colors.onSurfaceVariant }]}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>

                {!item.read && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <MaterialCommunityIcons name="bell-off-outline" size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>All caught up!</Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                You have no new notifications at the moment.
              </Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  notificationItem: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  textWrap: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.bodySm, fontWeight: "600" },
  message: { ...typography.caption, marginTop: 2, lineHeight: 16 },
  time: { fontSize: 9, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  emptyCenter: { padding: spacing.xl, alignItems: "center", justifyContent: "center", paddingTop: 120 },
  emptyTitle: { ...typography.title, marginTop: spacing.md },
  emptyText: { ...typography.bodySm, textAlign: "center", marginTop: spacing.xs },
});
