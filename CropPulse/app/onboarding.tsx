import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/Button";
import { spacing, typography, radius } from "@/constants/theme";

const slides = [
  {
    id: "1",
    icon: "📊",
    title: "AI Price Predictions",
    description: "Know your crop's expected market value before you sell, powered by AI.",
  },
  {
    id: "2",
    icon: "🛒",
    title: "Direct Marketplace",
    description: "Connect straight with verified buyers and sellers, no middlemen.",
  },
  {
    id: "3",
    icon: "🌦️",
    title: "Live Weather Insights",
    description: "Plan your harvest around accurate, hyperlocal weather forecasts.",
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.skipRow}>
        <Text
          onPress={() => router.replace("/login")}
          style={[styles.skip, { color: colors.onSurfaceVariant }]}
        >
          Skip
        </Text>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: "center", paddingHorizontal: spacing.xl }}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.primary : colors.outlineVariant,
                width: i === index ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={index === slides.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          fullWidth
          size="lg"
          icon="arrow-right"
          iconPosition="right"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipRow: { alignItems: "flex-end", paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  skip: { ...typography.body, fontWeight: "600" },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  icon: { fontSize: 64 },
  title: { ...typography.headline, textAlign: "center", marginBottom: spacing.sm },
  description: { ...typography.body, textAlign: "center", paddingHorizontal: spacing.md },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: spacing.xs, marginVertical: spacing.xl },
  dot: { height: 8, borderRadius: radius.full },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
});
