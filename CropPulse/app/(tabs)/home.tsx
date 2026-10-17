import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  useWindowDimensions,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius, elevation } from "@/constants/theme";
import { getGreeting } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import { quickActions } from "@/data/user";
import { weatherData, banners } from "@/data/weather";
import { trendingCrops, recommendedCrops } from "@/data/crops";
import { WeatherWidget } from "@/components/WeatherWidget";
import { PriceCard } from "@/components/PriceCard";
import { Card } from "@/components/Card";
import { useLogisticsNotifications } from "@/context/LogisticsContext";
import { cropsService } from "@/services/api/crops";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [bannerIndex, setBannerIndex] = useState(0);
  const { opacity, translateY } = useFadeIn(40);
  const { unreadCount } = useLogisticsNotifications();
  const { user } = useAuth();
  
  const [prices, setPrices] = useState<any[]>([]);

  React.useEffect(() => {
    cropsService.getLatestPrices().then((res) => {
      const mapped = res.map((r) => ({
        id: r.id,
        cropName: r.crop.name,
        icon: r.crop.icon || "🌱",
        pricePerUnit: r.modalPrice,
        unit: r.unit,
        market: r.market.name,
        trend: "up", // hardcoded for now or randomly assigned
        changePercent: 1.5,
      }));
      setPrices(mapped);
    }).catch(console.error);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          {/* Greeting header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.onSurfaceVariant }]}>
                {getGreeting()} 👋
              </Text>
              <Text style={[styles.name, { color: colors.onSurface }]}>{user?.name || "Welcome"}</Text>
            </View>
            <Pressable
              onPress={() => router.push("/notifications")}
              style={[styles.bellBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={colors.onSurface} />
              {unreadCount > 0 && (
                <View style={[styles.dot, { backgroundColor: colors.accent, borderColor: colors.background }]} />
              )}
            </Pressable>
          </View>

          {/* Weather */}
          <View style={styles.section}>
            <WeatherWidget data={weatherData} />
          </View>

          {/* Banner carousel */}
          <View style={{ marginTop: spacing.lg }}>
            <FlatList
              data={banners}
              keyExtractor={(b) => b.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (width - spacing.lg * 2)))
              }
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => (
                <LinearGradient
                  colors={[item.colorFrom, item.colorTo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.banner, { width: width - spacing.lg * 2 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={styles.bannerIcon}>{item.icon}</Text>
                </LinearGradient>
              )}
            />
            <View style={styles.dotsRow}>
              {banners.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.smallDot,
                    {
                      backgroundColor: i === bannerIndex ? colors.primary : colors.outlineVariant,
                      width: i === bannerIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <SectionTitle title="Quick Actions" />
            <View style={styles.quickRow}>
              {quickActions.map((qa) => (
                <Pressable
                  key={qa.id}
                  onPress={() => router.push(qa.route as any)}
                  style={styles.quickItem}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: colors.primaryContainer }]}>
                    <MaterialCommunityIcons name={qa.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickLabel, { color: colors.onSurface }]} numberOfLines={1}>
                    {qa.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Crop prices */}
          <View style={styles.section}>
            <SectionTitle title="Today's Crop Prices" actionLabel="See all" onAction={() => router.push("/(tabs)/marketplace")} />
            <FlatList
              data={prices}
              keyExtractor={(c) => c.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => <PriceCard item={item} />}
            />
          </View>

          {/* Trending crops */}
          <View style={styles.section}>
            <SectionTitle title="Trending Crops" />
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              {trendingCrops.map((t) => (
                <Card key={t.id} padded style={styles.trendingCard}>
                  <Text style={styles.trendingIcon}>{t.icon}</Text>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[styles.trendingName, { color: colors.onSurface }]}>{t.cropName}</Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${t.demandScore}%`, backgroundColor: colors.secondary },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.demandScore, { color: colors.primary }]}>{t.demandScore}</Text>
                </Card>
              ))}
            </View>
          </View>

          {/* Recommended crops */}
          <View style={[styles.section, { marginBottom: spacing.xxl }]}>
            <SectionTitle title="Recommended For You" />
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              {recommendedCrops.map((r) => (
                <Card key={r.id} padded style={styles.recCard}>
                  <View style={[styles.recIconWrap, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={{ fontSize: 24 }}>{r.icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[styles.recName, { color: colors.onSurface }]}>{r.cropName}</Text>
                    <Text style={[styles.recReason, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                      {r.reason}
                    </Text>
                  </View>
                  <View style={[styles.suitBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.suitText}>{r.suitability}%</Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greeting: { ...typography.bodySm },
  name: { ...typography.headline, marginTop: 2 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.title },
  sectionAction: { ...typography.bodySm, fontWeight: "700" },
  banner: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 110,
    ...elevation.level2,
  },
  bannerTitle: { color: "#fff", ...typography.title, fontWeight: "700" },
  bannerSubtitle: { color: "rgba(255,255,255,0.9)", ...typography.bodySm, marginTop: 4 },
  bannerIcon: { fontSize: 40, marginLeft: spacing.md },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: spacing.sm },
  smallDot: { height: 6, borderRadius: 3 },
  quickRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 0 },
  quickItem: { alignItems: "center", width: "23%" },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  quickLabel: { ...typography.caption, textAlign: "center" },
  trendingCard: { flexDirection: "row", alignItems: "center" },
  trendingIcon: { fontSize: 26 },
  trendingName: { ...typography.titleSm },
  progressTrack: { height: 6, borderRadius: 3, marginTop: 6, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  demandScore: { ...typography.title, fontWeight: "700", marginLeft: spacing.sm },
  recCard: { flexDirection: "row", alignItems: "center" },
  recIconWrap: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  recName: { ...typography.titleSm },
  recReason: { ...typography.caption, marginTop: 2 },
  suitBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, marginLeft: spacing.sm },
  suitText: { color: "#fff", ...typography.caption, fontWeight: "700" },
});
