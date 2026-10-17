/**
 * CropPulse design tokens.
 * Material 3 inspired agriculture theme.
 */

export const brand = {
  primary: "#2E7D32",
  secondary: "#66BB6A",
  accent: "#FFC107",
  background: "#F7F9F5",
};

export const lightColors = {
  primary: "#2E7D32",
  onPrimary: "#FFFFFF",
  primaryContainer: "#C8E6C9",
  onPrimaryContainer: "#0B3B10",

  secondary: "#66BB6A",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E1F3E2",
  onSecondaryContainer: "#1B4A1E",

  accent: "#FFC107",
  onAccent: "#3D2E00",

  background: "#F7F9F5",
  onBackground: "#1B1F1C",

  surface: "#FFFFFF",
  onSurface: "#1B1F1C",
  surfaceVariant: "#E7ECE4",
  onSurfaceVariant: "#454B45",

  outline: "#77817A",
  outlineVariant: "#DDE4D9",

  success: "#2E7D32",
  warning: "#F9A825",
  danger: "#D32F2F",
  error: "#B3261E",
  errorContainer: "#F9DEDC",
  onErrorContainer: "#410E0B",
  info: "#1976D2",

  card: "#FFFFFF",
  shadow: "#000000",
  overlay: "rgba(17, 24, 19, 0.5)",
  disabled: "#C6CCC3",
  placeholder: "#8A928A",
  tabInactive: "#8A928A",
};

export const darkColors = {
  primary: "#8BD08F",
  onPrimary: "#0B3B10",
  primaryContainer: "#1E5322",
  onPrimaryContainer: "#C8E6C9",

  secondary: "#8FD592",
  onSecondary: "#12321A",
  secondaryContainer: "#2C5A31",
  onSecondaryContainer: "#E1F3E2",

  accent: "#FFCF48",
  onAccent: "#3D2E00",

  background: "#12140F",
  onBackground: "#E4E8E0",

  surface: "#1B1F1A",
  onSurface: "#E4E8E0",
  surfaceVariant: "#2A2F27",
  onSurfaceVariant: "#C2C9BD",

  outline: "#8C948A",
  outlineVariant: "#3A4038",

  success: "#8BD08F",
  warning: "#FFCA5C",
  danger: "#EF9A9A",
  error: "#F2B8B5",
  errorContainer: "#8C1D18",
  onErrorContainer: "#F9DEDC",
  info: "#90CAF9",

  card: "#1E231C",
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.6)",
  disabled: "#3A4038",
  placeholder: "#7C857A",
  tabInactive: "#7C857A",
};

export type ThemeColors = typeof lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  displayLg: { fontSize: 32, fontWeight: "700" as const, lineHeight: 40 },
  displayMd: { fontSize: 26, fontWeight: "700" as const, lineHeight: 34 },
  headline: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  title: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  titleSm: { fontSize: 15, fontWeight: "600" as const, lineHeight: 20 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: "500" as const, lineHeight: 14 },
};

export const elevation = {
  level1: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  level2: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  level3: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.12,
    elevation: 8,
  },
};
