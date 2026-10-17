import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  isPassword?: boolean;
}

export function Input({ label, error, icon, isPassword, style, ...rest }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: error ? colors.danger : focused ? colors.primary : "transparent",
          },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.onSurfaceVariant}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <TextInput
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { color: colors.onSurface }, style]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          secureTextEntry={secure}
          {...rest}
        />
        {isPassword && (
          <Pressable onPress={() => setSecure((s) => !s)} hitSlop={8}>
            <MaterialCommunityIcons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    ...typography.body,
    height: "100%",
  },
  error: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
