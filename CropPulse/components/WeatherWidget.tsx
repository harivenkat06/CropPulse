import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, spacing, typography } from "@/constants/theme";
import { WeatherData } from "@/types";

interface WeatherWidgetProps {
  data: WeatherData;
}

export function WeatherWidget({ data }: WeatherWidgetProps) {
  return (
    <LinearGradient
      colors={["#2E7D32", "#66BB6A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#FFFFFF" />
            <Text style={styles.location}>{data.location}</Text>
          </View>
          <Text style={styles.condition}>{data.condition}</Text>
        </View>
        <Text style={styles.bigIcon}>{data.icon}</Text>
      </View>

      <Text style={styles.temp}>{data.temperatureC}°C</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="water-percent" size={16} color="#FFFFFF" />
          <Text style={styles.statText}>{data.humidity}%</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="weather-windy" size={16} color="#FFFFFF" />
          <Text style={styles.statText}>{data.windKph} km/h</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="weather-pouring" size={16} color="#FFFFFF" />
          <Text style={styles.statText}>{data.rainChance}%</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg }}>
        {data.forecast.map((f) => (
          <View key={f.day} style={styles.forecastItem}>
            <Text style={styles.forecastDay}>{f.day}</Text>
            <Text style={styles.forecastIcon}>{f.icon}</Text>
            <Text style={styles.forecastTemp}>
              {f.high}° <Text style={styles.forecastLow}>{f.low}°</Text>
            </Text>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  locationRow: { flexDirection: "row", alignItems: "center" },
  location: { color: "#fff", ...typography.bodySm, marginLeft: 4, opacity: 0.9 },
  condition: { color: "#fff", ...typography.titleSm, marginTop: 2 },
  bigIcon: { fontSize: 40 },
  temp: { color: "#fff", fontSize: 44, fontWeight: "700", marginTop: spacing.xs },
  statsRow: { flexDirection: "row", marginTop: spacing.md, gap: spacing.lg },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "#fff", ...typography.caption, opacity: 0.95 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: spacing.md },
  forecastItem: { alignItems: "center", minWidth: 40 },
  forecastDay: { color: "#fff", ...typography.caption, opacity: 0.85 },
  forecastIcon: { fontSize: 18, marginVertical: 2 },
  forecastTemp: { color: "#fff", ...typography.caption, fontWeight: "700" },
  forecastLow: { opacity: 0.7, fontWeight: "400" },
});
