import React from "react";
import { View, StyleSheet, ViewStyle, Pressable, GestureResponderEvent } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, elevation } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: (e: GestureResponderEvent) => void;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ children, style, onPress, padded = true, elevated = true }: CardProps) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.outlineVariant,
        },
        padded && { padding: spacing.lg },
        elevated && elevation.level1,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: colors.outlineVariant }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
