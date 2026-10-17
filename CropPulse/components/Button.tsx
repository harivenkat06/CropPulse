import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  GestureResponderEvent,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const heights: Record<Size, number> = { sm: 36, md: 48, lg: 56 };
  const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.secondaryContainer,
    outline: "transparent",
    ghost: "transparent",
  };
  const textColor: Record<Variant, string> = {
    primary: colors.onPrimary,
    secondary: colors.onSecondaryContainer,
    outline: colors.primary,
    ghost: colors.primary,
  };

  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && { width: "100%" },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          {
            height: heights[size],
            backgroundColor: bg[variant],
            borderWidth: variant === "outline" ? 1.5 : 0,
            borderColor: colors.primary,
            opacity: isDisabled ? 0.5 : 1,
          },
          fullWidth && { width: "100%" },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor[variant]} />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <MaterialCommunityIcons
                name={icon}
                size={size === "sm" ? 16 : 20}
                color={textColor[variant]}
                style={{ marginRight: spacing.sm }}
              />
            )}
            <Text
              style={[
                styles.label,
                { color: textColor[variant], fontSize: fontSizes[size] },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {icon && iconPosition === "right" && (
              <MaterialCommunityIcons
                name={icon}
                size={size === "sm" ? 16 : 20}
                color={textColor[variant]}
                style={{ marginLeft: spacing.sm }}
              />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: "600",
  },
});
