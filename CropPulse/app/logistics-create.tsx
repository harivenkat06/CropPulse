/**
 * Create Transport Request — Form for creating a new shared logistics request.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius } from "@/constants/theme";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useLogistics } from "@/context/LogisticsContext";
import {
  LOCATION_OPTIONS,
  VEHICLE_OPTIONS,
  LOGISTICS_CROP_OPTIONS,
} from "@/data/logistics-options";
import type { FarmerLocation, VehicleType } from "@/types/logistics";
import { Animated } from "react-native";

export default function LogisticsCreateScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const { createRequest } = useLogistics();
  const params = useLocalSearchParams<{ crop?: string; destination?: string }>();

  // Form state
  const [crop, setCrop] = useState(params.crop || "");
  const [cropIcon, setCropIcon] = useState(
    LOGISTICS_CROP_OPTIONS.find((c) => c.name === params.crop)?.icon || ""
  );
  const [quantity, setQuantity] = useState("");
  const [pickupLocation, setPickupLocation] = useState<FarmerLocation | null>(null);
  const [destination, setDestination] = useState<FarmerLocation | null>(
    params.destination
      ? LOCATION_OPTIONS.find((l) => l.town.toLowerCase().includes(params.destination!.toLowerCase())) || null
      : null
  );
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [maxFarmers, setMaxFarmers] = useState("4");
  const [vehicleCapacity, setVehicleCapacity] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Pickers
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!crop) return Alert.alert("Required", "Please select a crop.");
    if (!quantity || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) return Alert.alert("Required", "Please enter a valid quantity in kg.");
    if (!pickupLocation) return Alert.alert("Required", "Please select a pickup location.");
    if (!destination) return Alert.alert("Required", "Please select a destination.");
    if (!preferredDate) return Alert.alert("Required", "Please enter a preferred date (YYYY-MM-DD).");
    if (!preferredTime) return Alert.alert("Required", "Please enter a preferred time.");
    if (!vehicleType) return Alert.alert("Required", "Please select a vehicle type.");

    // Date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(preferredDate)) {
      return Alert.alert("Invalid Date", "Please enter date in YYYY-MM-DD format (e.g., 2026-08-12).");
    }

    setLoading(true);
    try {
      await createRequest({
        crop,
        quantity: Number(quantity),
        pickupLocation,
        destination,
        preferredDate,
        preferredTime,
        vehicleType: vehicleType as VehicleType,
        maxFarmers: Number(maxFarmers) || 4,
        vehicleCapacity: Number(vehicleCapacity) || 1000,
        estimatedCost: Number(estimatedCost) || 0,
        notes,
      });
      Alert.alert("Request Created", "Your transport request is now live for nearby farmers.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Couldn't Create Request", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <Header title="Create Transport Request" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {/* Crop Selector */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>CROP *</Text>
            <Pressable
              onPress={() => setShowCropPicker(!showCropPicker)}
              style={[styles.selector, { backgroundColor: colors.surfaceVariant, borderColor: showCropPicker ? colors.primary : "transparent" }]}
            >
              {crop ? (
                <View style={styles.selectorContent}>
                  <Text style={{ fontSize: 18 }}>{cropIcon}</Text>
                  <Text style={[styles.selectorText, { color: colors.onSurface }]}>{crop}</Text>
                </View>
              ) : (
                <Text style={[styles.selectorPlaceholder, { color: colors.placeholder }]}>Select crop</Text>
              )}
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
            {showCropPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.outlineVariant }]}>
                {LOGISTICS_CROP_OPTIONS.map((c) => (
                  <Pressable
                    key={c.name}
                    onPress={() => {
                      setCrop(c.name);
                      setCropIcon(c.icon);
                      setShowCropPicker(false);
                    }}
                    style={[styles.pickerItem, crop === c.name && { backgroundColor: colors.primaryContainer }]}
                  >
                    <Text style={{ fontSize: 16 }}>{c.icon}</Text>
                    <Text style={[styles.pickerItemText, { color: colors.onSurface }]}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Quantity */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>QUANTITY (KG) *</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="weight" size={18} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g., 300"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                style={[styles.input, { color: colors.onSurface }]}
              />
              <Text style={[styles.unitLabel, { color: colors.onSurfaceVariant }]}>kg</Text>
            </View>

            {/* Pickup Location */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>PICKUP LOCATION *</Text>
            <Pressable
              onPress={() => setShowPickupPicker(!showPickupPicker)}
              style={[styles.selector, { backgroundColor: colors.surfaceVariant, borderColor: showPickupPicker ? colors.primary : "transparent" }]}
            >
              {pickupLocation ? (
                <View style={styles.selectorContent}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
                  <Text style={[styles.selectorText, { color: colors.onSurface }]}>
                    {pickupLocation.town}, {pickupLocation.district}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.selectorPlaceholder, { color: colors.placeholder }]}>Select pickup location</Text>
              )}
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
            {showPickupPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.outlineVariant }]}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {LOCATION_OPTIONS.map((loc) => (
                    <Pressable
                      key={loc.town}
                      onPress={() => {
                        setPickupLocation(loc);
                        setShowPickupPicker(false);
                      }}
                      style={[
                        styles.pickerItem,
                        pickupLocation?.town === loc.town && { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.onSurfaceVariant} />
                      <Text style={[styles.pickerItemText, { color: colors.onSurface }]}>
                        {loc.town}, {loc.district}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Destination */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>DESTINATION *</Text>
            <Pressable
              onPress={() => setShowDestPicker(!showDestPicker)}
              style={[styles.selector, { backgroundColor: colors.surfaceVariant, borderColor: showDestPicker ? colors.primary : "transparent" }]}
            >
              {destination ? (
                <View style={styles.selectorContent}>
                  <MaterialCommunityIcons name="flag-checkered" size={16} color={colors.accent} />
                  <Text style={[styles.selectorText, { color: colors.onSurface }]}>
                    {destination.town}, {destination.district}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.selectorPlaceholder, { color: colors.placeholder }]}>Select destination</Text>
              )}
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
            {showDestPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.outlineVariant }]}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {LOCATION_OPTIONS.map((loc) => (
                    <Pressable
                      key={loc.town}
                      onPress={() => {
                        setDestination(loc);
                        setShowDestPicker(false);
                      }}
                      style={[
                        styles.pickerItem,
                        destination?.town === loc.town && { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.onSurfaceVariant} />
                      <Text style={[styles.pickerItemText, { color: colors.onSurface }]}>
                        {loc.town}, {loc.district}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Date and Time */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>DATE *</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
                  <TextInput
                    value={preferredDate}
                    onChangeText={setPreferredDate}
                    placeholder="2026-08-12"
                    placeholderTextColor={colors.placeholder}
                    style={[styles.input, { color: colors.onSurface }]}
                  />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>TIME *</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
                  <TextInput
                    value={preferredTime}
                    onChangeText={setPreferredTime}
                    placeholder="06:00 AM"
                    placeholderTextColor={colors.placeholder}
                    style={[styles.input, { color: colors.onSurface }]}
                  />
                </View>
              </View>
            </View>

            {/* Vehicle Type */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>VEHICLE TYPE *</Text>
            <Pressable
              onPress={() => setShowVehiclePicker(!showVehiclePicker)}
              style={[styles.selector, { backgroundColor: colors.surfaceVariant, borderColor: showVehiclePicker ? colors.primary : "transparent" }]}
            >
              {vehicleType ? (
                <View style={styles.selectorContent}>
                  <MaterialCommunityIcons
                    name={(VEHICLE_OPTIONS.find((v) => v.label === vehicleType)?.icon || "truck-outline") as any}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.selectorText, { color: colors.onSurface }]}>{vehicleType}</Text>
                </View>
              ) : (
                <Text style={[styles.selectorPlaceholder, { color: colors.placeholder }]}>Select vehicle type</Text>
              )}
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
            {showVehiclePicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.outlineVariant }]}>
                {VEHICLE_OPTIONS.map((v) => (
                  <Pressable
                    key={v.label}
                    onPress={() => {
                      setVehicleType(v.label as VehicleType);
                      setShowVehiclePicker(false);
                    }}
                    style={[styles.pickerItem, vehicleType === v.label && { backgroundColor: colors.primaryContainer }]}
                  >
                    <MaterialCommunityIcons name={v.icon as any} size={16} color={colors.onSurfaceVariant} />
                    <View>
                      <Text style={[styles.pickerItemText, { color: colors.onSurface }]}>{v.label}</Text>
                      <Text style={[styles.pickerItemMeta, { color: colors.onSurfaceVariant }]}>{v.capacity}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Max Farmers & Capacity */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>MAX FARMERS</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
                  <TextInput
                    value={maxFarmers}
                    onChangeText={setMaxFarmers}
                    placeholder="4"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    style={[styles.input, { color: colors.onSurface }]}
                  />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>CAPACITY (KG)</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialCommunityIcons name="weight" size={18} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
                  <TextInput
                    value={vehicleCapacity}
                    onChangeText={setVehicleCapacity}
                    placeholder="1000"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    style={[styles.input, { color: colors.onSurface }]}
                  />
                </View>
              </View>
            </View>

            {/* Estimated Cost */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>ESTIMATED COST (₹)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.currencySymbol, { color: colors.onSurfaceVariant }]}>₹</Text>
              <TextInput
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                placeholder="2500"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                style={[styles.input, { color: colors.onSurface }]}
              />
            </View>

            {/* Notes */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>ADDITIONAL NOTES</Text>
            <View style={[styles.textAreaWrap, { backgroundColor: colors.surfaceVariant }]}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions, loading details, etc."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[styles.textArea, { color: colors.onSurface }]}
              />
            </View>

            {/* Submit */}
            <Button
              label="Create Transport Request"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
              icon="truck-check-outline"
              style={{ marginTop: spacing.xl }}
            />

            <View style={{ height: spacing.xxl }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.sm },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    ...typography.body,
    height: "100%",
  },
  unitLabel: { ...typography.bodySm, fontWeight: "600" },
  currencySymbol: { ...typography.body, fontWeight: "600", marginRight: spacing.sm },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selectorText: { ...typography.body },
  selectorPlaceholder: { ...typography.body },
  pickerDropdown: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pickerItemText: { ...typography.bodySm },
  pickerItemMeta: { ...typography.caption, marginTop: 1 },
  row: { flexDirection: "row" },
  textAreaWrap: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    padding: spacing.md,
    minHeight: 88,
  },
  textArea: {
    ...typography.body,
    minHeight: 60,
  },
});
