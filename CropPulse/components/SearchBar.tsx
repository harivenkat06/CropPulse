import React from "react";
import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = "Search crops, sellers...", onFilterPress }: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceVariant }]}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, { color: colors.onSurface }]}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceVariant} />
        </Pressable>
      )}
      {onFilterPress && (
        <Pressable onPress={onFilterPress} hitSlop={8} style={[styles.filterBtn, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="tune-variant" size={16} color={colors.onPrimary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    height: "100%",
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
