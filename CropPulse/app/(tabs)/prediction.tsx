import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline, Circle, Line as SvgLine } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius, elevation } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { Card } from "@/components/Card";
import { predictionsService } from "@/services/api/predictions";
import { cropsService, Crop, Market } from "@/services/api/crops";
import type { PredictionResult } from "@/types";

export default function PredictionScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [cropId, setCropId] = useState("");
  const [marketId, setMarketId] = useState("");

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const selectedCrop = crops.find((c) => c.id === cropId);
  const selectedMarket = markets.find((m) => m.id === marketId);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const [cropResult, marketResult] = await Promise.allSettled([
        cropsService.getCrops(),
        cropsService.getMarkets(),
      ]);
      let cropList = cropResult.status === "fulfilled" ? cropResult.value : [];
      let marketList = marketResult.status === "fulfilled" ? marketResult.value : [];

      if (cropList.length === 0 || marketList.length === 0) {
        const predictionCatalog = await predictionsService.getCatalog();
        if (cropList.length === 0) cropList = predictionCatalog.crops;
        if (marketList.length === 0) marketList = predictionCatalog.markets;
      }

      if (cropList.length === 0 || marketList.length === 0) {
        throw new Error("No crops or markets are configured for price predictions.");
      }

      setCrops(cropList);
      setMarkets(marketList);
      setCropId((current) => cropList.some((crop) => crop.id === current) ? current : cropList[0].id);
      setMarketId((current) => marketList.some((market) => market.id === current) ? current : marketList[0].id);
    } catch (error) {
      console.error("Failed to load prediction catalog:", error);
      setCatalogError(error instanceof Error ? error.message : "Could not load crops and markets.");
      setCrops([]);
      setMarkets([]);
      setCropId("");
      setMarketId("");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (catalogLoading || !cropId || !marketId) {
      setLoading(catalogLoading);
      return;
    }

    setLoading(true);
    setPredictionError(null);
    predictionsService.getPrediction(cropId, marketId, 7)
      .then((res) => {
        if (!Number.isFinite(res.expected_price) || res.expected_price <= 0 || res.message) {
          throw new Error(res.message || "The model did not return a valid price prediction.");
        }
        if (res.history.length === 0) {
          throw new Error("No recent market history is available for this crop and market.");
        }
        const lastPrice = res.history[res.history.length - 1].price;
        const trend = res.expected_price > lastPrice * 1.01
          ? "up"
          : res.expected_price < lastPrice * 0.99
            ? "down"
            : "flat";
        setResult({
          cropId,
          marketId,
          expectedPrice: res.expected_price,
          unit: "quintal",
          confidence: res.confidence,
          trend,
          history: res.history,
          recommendation: `AI forecast for ${res.horizon} days, based on recent market prices.`,
        });
      })
      .catch((err) => {
        console.error(err);
        setResult(null);
        setPredictionError(err instanceof Error ? err.message : "Could not generate a price prediction.");
      })
      .finally(() => setLoading(false));
  }, [cropId, marketId, catalogLoading, retryCount]);

  const trendColor =
    result?.trend === "up" ? colors.success : result?.trend === "down" ? colors.danger : colors.onSurfaceVariant;
  const trendIcon = result?.trend === "up" ? "trending-up" : result?.trend === "down" ? "trending-down" : "trending-neutral";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.onSurface }]}>AI Price Prediction</Text>
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                Forecast prices before you sell
              </Text>
            </View>
            <View style={[styles.aiBadge, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="creation" size={16} color={colors.primary} />
              <Text style={[styles.aiBadgeText, { color: colors.onPrimaryContainer }]}>AI</Text>
            </View>
          </View>

          {/* Crop selector */}
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>SELECT CROP</Text>
          {catalogLoading ? (
            <ActivityIndicator style={{ marginBottom: spacing.lg, alignSelf: "flex-start" }} color={colors.primary} />
          ) : catalogError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{catalogError}</Text>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            {crops.map((c) => {
              const active = c.id === cropId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCropId(c.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceVariant,
                      marginRight: spacing.sm,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>{c.icon}</Text>
                  <Text style={[styles.chipText, { color: active ? colors.onPrimary : colors.onSurface }]}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Market selector */}
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>SELECT MARKET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xl }}>
            {markets.map((m) => {
              const active = m.id === marketId;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMarketId(m.id)}
                  style={[
                    styles.marketChip,
                    {
                      backgroundColor: active ? colors.secondaryContainer : colors.surfaceVariant,
                      borderColor: active ? colors.secondary : "transparent",
                      marginRight: spacing.sm,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.onSurface }]}>{m.name}</Text>
                  <Text style={[styles.marketDistrict, { color: colors.onSurfaceVariant }]}>{m.district}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Result card */}
          {loading ? (
            <View style={{ padding: spacing.xxl, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : result ? (
            <Card style={styles.resultCard}>
              <View style={styles.resultTop}>
                <View>
                  <Text style={[styles.resultLabel, { color: colors.onSurfaceVariant }]}>Expected Price</Text>
                  <Text style={[styles.resultPrice, { color: colors.primary }]}>
                    {formatCurrency(result.expectedPrice)}
                    <Text style={[styles.resultUnit, { color: colors.onSurfaceVariant }]}> /{result.unit}</Text>
                  </Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: trendColor + "22" }]}>
                  <MaterialCommunityIcons name={trendIcon} size={16} color={trendColor} />
                  <Text style={[styles.trendBadgeText, { color: trendColor }]}>
                    {result.trend === "up" ? "Rising" : result.trend === "down" ? "Falling" : "Stable"}
                  </Text>
                </View>
              </View>

              {/* Confidence meter */}
              <View style={{ marginTop: spacing.lg }}>
                <View style={styles.confidenceRow}>
                  <Text style={[styles.confidenceLabel, { color: colors.onSurfaceVariant }]}>Confidence</Text>
                  <Text style={[styles.confidenceValue, { color: colors.onSurface }]}>{result.confidence}%</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${result.confidence}%`, backgroundColor: colors.accent },
                    ]}
                  />
                </View>
              </View>

              {/* Trend chart */}
              <View style={{ marginTop: spacing.xl }}>
                <Text style={[styles.confidenceLabel, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}>
                  Recent Market Prices
                </Text>
                <TrendChart points={result.history} color={colors.primary} gridColor={colors.outlineVariant} />
              </View>

              {/* Recommendation */}
              <View style={[styles.recommendBox, { backgroundColor: colors.secondaryContainer }]}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.onSecondaryContainer} />
                <Text style={[styles.recommendText, { color: colors.onSecondaryContainer }]}>
                  {result.recommendation}
                </Text>
              </View>

              {/* Find Shared Transport Link */}
              <Pressable
                onPress={() =>
                  router.push(
                    `/logistics-create?crop=${encodeURIComponent(selectedCrop?.name || "")}&destination=${encodeURIComponent(selectedMarket?.name || "")}` as any
                  )
                }
                style={[styles.transportLink, { borderColor: colors.primary }]}
              >
                <MaterialCommunityIcons name="truck-delivery-outline" size={18} color={colors.primary} />
                <Text style={[styles.transportLinkText, { color: colors.primary }]}>
                  Find Shared Transport
                </Text>
              </Pressable>
            </Card>
          ) : (
            <View style={{ padding: spacing.xxl, alignItems: "center" }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
                {catalogError || predictionError || "Select a crop and market to generate a prediction."}
              </Text>
              <Pressable
                onPress={() => {
                  if (catalogError) void loadCatalog();
                  else setRetryCount((count) => count + 1);
                }}
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: colors.onPrimary, ...typography.label }}>
                  {catalogError ? "Retry loading data" : "Retry prediction"}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 16 }}>{selectedCrop?.icon || "🌱"}</Text>
            <Text style={[styles.summaryText, { color: colors.onSurfaceVariant }]}>
              {selectedCrop?.name || "Crop"} · {selectedMarket?.name || "Market"}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrendChart({
  points,
  color,
  gridColor,
}: {
  points: { label: string; price: number }[];
  color: string;
  gridColor: string;
}) {
  const width = 300;
  const height = 140;
  const paddingX = 12;
  const paddingY = 16;

  const prices = points.map((p) => p.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = paddingX + (i / (points.length - 1)) * (width - paddingX * 2);
    const y = paddingY + (1 - (p.price - min) / range) * (height - paddingY * 2);
    return { x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {[0.25, 0.5, 0.75].map((f) => (
        <SvgLine
          key={f}
          x1={paddingX}
          x2={width - paddingX}
          y1={paddingY + f * (height - paddingY * 2)}
          y2={paddingY + f * (height - paddingY * 2)}
          stroke={gridColor}
          strokeWidth={1}
        />
      ))}
      <Polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => (
        <Circle key={i} cx={c.x} cy={c.y} r={3.5} fill={color} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xl },
  title: { ...typography.headline },
  subtitle: { ...typography.bodySm, marginTop: 2 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  aiBadgeText: { ...typography.caption, fontWeight: "700" },
  label: { ...typography.label, marginBottom: spacing.sm, letterSpacing: 0.5 },
  errorText: { ...typography.bodySm, textAlign: "center" },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  chipText: { ...typography.bodySm, fontWeight: "600" },
  marketChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  marketDistrict: { ...typography.caption, marginTop: 1 },
  resultCard: { ...elevation.level2 },
  resultTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  resultLabel: { ...typography.bodySm },
  resultPrice: { ...typography.displayMd, fontWeight: "700", marginTop: 2 },
  resultUnit: { ...typography.body, fontWeight: "400" },
  trendBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, gap: 4 },
  trendBadgeText: { ...typography.caption, fontWeight: "700" },
  confidenceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  confidenceLabel: { ...typography.bodySm },
  confidenceValue: { ...typography.bodySm, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  recommendBox: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  recommendText: { ...typography.bodySm, flex: 1, lineHeight: 19 },
  transportLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    marginTop: spacing.md,
    borderStyle: "dashed",
  },
  transportLinkText: {
    ...typography.bodySm,
    fontWeight: "700",
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.lg, justifyContent: "center" },
  summaryText: { ...typography.caption },
});
