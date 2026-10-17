import { useColorScheme } from "react-native";
import { lightColors, darkColors, ThemeColors } from "@/constants/theme";

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

/**
 * Returns the active color palette based on the device color scheme.
 * Falls back to light theme when the scheme cannot be determined.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}
