import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { spacing, typography, radius } from "@/constants/theme";

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="account-circle-outline" size={24} color={colors.onSurface} />
              <View style={styles.rowText}>
                <Text style={[styles.itemName, { color: colors.onSurface }]}>{user?.name || "Your account"}</Text>
                <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>{user?.phone || "No phone"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="theme-light-dark" size={24} color={colors.onSurface} />
              <View style={styles.rowText}>
                <Text style={[styles.itemName, { color: colors.onSurface }]}>Dark Mode</Text>
                <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>
                  {isDark ? "Enabled" : "Disabled"}
                </Text>
              </View>
              </View>
            </View>
        </View>

        <Pressable style={[styles.logoutBtn, { backgroundColor: colors.errorContainer }]} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.onErrorContainer} />
          <Text style={[styles.logoutText, { color: colors.onErrorContainer }]}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  title: { ...typography.headline },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.titleSm, marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  rowText: { marginLeft: spacing.md },
  itemName: { ...typography.body, fontWeight: "500" },
  itemSub: { ...typography.caption, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  logoutText: { ...typography.body, fontWeight: "600" },
});
