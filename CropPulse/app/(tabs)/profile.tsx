import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";

const menuItems: {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
}[] = [
  { id: "orders", label: "My Orders", icon: "clipboard-list-outline", route: "/orders" },
  { id: "logistics", label: "Shared Logistics", icon: "truck-outline", route: "/logistics" },
  { id: "notifications", label: "Notifications", icon: "bell-outline", route: "/notifications" },
  { id: "settings", label: "Settings", icon: "cog-outline", route: "/settings" },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const { user, logout } = useAuth();

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  const location = [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || 'Unknown';

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Profile</Text>

          {/* Profile header */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ marginLeft: spacing.lg, flex: 1 }}>
              <Text style={[styles.name, { color: colors.onSurface }]}>{user?.name || 'Your profile'}</Text>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.onSurfaceVariant} />
                <Text style={[styles.location, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {location}
                </Text>
              </View>
              <Text style={[styles.member, { color: colors.onSurfaceVariant }]}>
                {user?.role || 'FARMER'}
              </Text>
            </View>
            <Pressable style={[styles.editBtn, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{user?.phone || '-'}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Phone</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{user?.district || '-'}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>District</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{user?.state || '-'}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>State</Text>
            </Card>
          </View>

          {/* Menu */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Settings</Text>
            <Card padded={false} style={{ overflow: "hidden" }}>
              {menuItems.map((item, i) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  style={[
                    styles.menuRow,
                    i !== menuItems.length - 1 && { borderBottomWidth: StyleSheet_hairline, borderBottomColor: colors.outlineVariant },
                  ]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: colors.surfaceVariant }]}>
                    <MaterialCommunityIcons name={item.icon} size={18} color={colors.onSurface} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.onSurface }]}>{item.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              ))}
            </Card>
          </View>

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { backgroundColor: colors.danger + "15" }]}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StyleSheet_hairline = 0.5;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.headline, marginBottom: spacing.lg },
  profileHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", ...typography.title, fontWeight: "700" },
  name: { ...typography.title },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 3 },
  location: { ...typography.caption },
  member: { ...typography.caption, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  statCard: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  statValue: { ...typography.headline, fontWeight: "700" },
  statLabel: { ...typography.caption, marginTop: 2 },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.title, marginBottom: spacing.md },
  cropsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cropChip: { width: "47%", alignItems: "flex-start" },
  cropName: { ...typography.titleSm, marginTop: spacing.xs },
  cropAcreage: { ...typography.caption, marginTop: 2 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.md },
  menuIconWrap: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, ...typography.body },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.xl,
  },
  logoutText: { ...typography.body, fontWeight: "700" },
});
