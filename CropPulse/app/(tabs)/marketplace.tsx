import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Animated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius } from "@/constants/theme";
import { marketplaceCategories } from "@/data/marketplace";
import { SearchBar } from "@/components/SearchBar";
import { CropCard } from "@/components/CropCard";
import { listingsService, type Listing } from "@/services/api/listings";
import type { MarketplaceListing } from "@/types";

const getListingCategory = (cropName: string): string => {
  const crop = cropName.toLowerCase();
  if (/wheat|rice|paddy|maize|corn/.test(crop)) return "grains";
  if (/tomato|onion|chilli|chili|potato|vegetable/.test(crop)) return "vegetables";
  if (/mango|banana|fruit|apple|grape/.test(crop)) return "fruits";
  if (/turmeric|spice|pepper|cardamom/.test(crop)) return "spices";
  if (/cotton|sugarcane|groundnut/.test(crop)) return "cash-crops";
  return "all";
};

const getFreshness = (harvestDate?: string): MarketplaceListing["freshness"] => {
  if (!harvestDate) return "1-3 days";
  const ageInDays = Math.max(0, (Date.now() - new Date(harvestDate).getTime()) / 86_400_000);
  if (ageInDays <= 1) return "Just harvested";
  if (ageInDays <= 3) return "1-3 days";
  return "4-7 days";
};

const toMarketplaceListing = (listing: Listing): MarketplaceListing => {
  const sellerName = listing.seller?.name || "Farmer";
  return {
    id: listing.id,
    category: getListingCategory(listing.crop?.name || ""),
    cropName: listing.crop?.name || "Unknown crop",
    icon: listing.crop?.icon || "🌱",
    pricePerUnit: listing.expectedPrice,
    unit: listing.unit,
    quantityAvailable: `${listing.quantity} ${listing.unit}`,
    location: listing.location || listing.seller?.district || "Location not provided",
    freshness: getFreshness(listing.harvestDate),
    seller: {
      id: listing.sellerId,
      name: sellerName,
      initials: sellerName.substring(0, 2).toUpperCase(),
      avatarColor: "#F59E0B",
      rating: 4.5,
      reviews: 0,
      verified: true,
    },
  };
};

export default function MarketplaceScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const liveListings = (await listingsService.getListings()).map(toMarketplaceListing);
      setListings(liveListings);
    } catch (error) {
      console.error("Failed to load marketplace listings:", error);
      setListings([]);
      setLoadError(error instanceof Error ? error.message : "Live listings are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesCategory = category === "all" || l.category === category;
      const matchesQuery =
        query.trim().length === 0 ||
        l.cropName.toLowerCase().includes(query.toLowerCase()) ||
        l.seller.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category, listings]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Marketplace</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {filtered.length} live listings
          </Text>
        </View>

        {!loading && loadError && (
          <View style={[styles.errorNotice, { backgroundColor: colors.errorContainer }]}>
            <Text style={[styles.errorNoticeText, { color: colors.onErrorContainer }]}>
              Listings couldn't load: {loadError}
            </Text>
            <Pressable onPress={() => void loadListings()} accessibilityRole="button">
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} onFilterPress={() => {}} />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <FlatList
            data={marketplaceCategories}
            keyExtractor={(c) => c.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
            renderItem={({ item }) => {
              const active = item.id === category;
              return (
                <Pressable
                  onPress={() => setCategory(item.id)}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: active ? colors.primary : colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={active ? colors.onPrimary : colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: active ? colors.onPrimary : colors.onSurfaceVariant },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <CropCard listing={item} onPress={() => {}} />}
          ListHeaderComponent={loading ? (
            <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} />
          ) : null}
          ListEmptyComponent={!loading ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="sprout-outline" size={40} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {loadError
                  ? "Listings are unavailable"
                  : listings.length === 0
                    ? "No listings yet"
                    : "No listings match your search"}
              </Text>
            </View>
          ) : null}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  errorNotice: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  errorNoticeText: { ...typography.caption, flex: 1 },
  retryText: { ...typography.caption, fontWeight: "700" },
  title: { ...typography.headline },
  subtitle: { ...typography.bodySm, marginTop: 2 },
  searchWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 6,
  },
  categoryText: { ...typography.caption, fontWeight: "600" },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: spacing.xxxl, gap: spacing.sm },
  emptyText: { ...typography.body },
});
