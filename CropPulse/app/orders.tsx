import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";
import { ordersService, Order } from "@/services/api/orders";
import { formatCurrency } from "@/utils/format";

export default function OrdersScreen() {
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersService.getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <View style={styles.row}>
              <Text style={[styles.crop, { color: colors.onSurface }]}>{item.listing?.crop?.name || 'Crop'}</Text>
              <Text style={[styles.status, { color: colors.primary }]}>{item.status}</Text>
            </View>
            <Text style={[styles.details, { color: colors.onSurfaceVariant }]}>
              {item.quantity} {item.listing?.unit || 'units'} · {formatCurrency(item.price)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No orders yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: spacing.lg },
  title: { ...typography.headline },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  crop: { ...typography.titleSm },
  status: { ...typography.caption, fontWeight: "600" },
  details: { ...typography.bodySm },
  emptyText: { ...typography.body, marginTop: spacing.sm },
});
