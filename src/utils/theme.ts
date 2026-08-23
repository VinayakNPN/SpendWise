import { DefaultTheme, DarkTheme } from "@react-navigation/native";

// ─── Color Palettes ───────────────────────────────────────────────

export const LightColors = {
  // Backgrounds
  background: "#F4F6F5",
  surface: "#FFFFFF",
  surfaceElevated: "#EDF2F0",
  surfacePressed: "#E4ECE8",

  // Text
  text: "#1F2928",
  textSecondary: "#6F7977",
  textTertiary: "#8B9792",
  textInverse: "#FFFFFF",

  // Brand
  primary: "#1DB954",
  primaryDark: "#18A34A",
  primaryMuted: "#E6F5ED",
  primaryText: "#FFFFFF",
  accent: "#2D8A73",

  // Borders & dividers
  border: "#E2E8E5",
  borderLight: "#EEF1EF",
  divider: "#E9EEEB",

  // Semantic
  destructive: "#D32F2F",
  destructiveMuted: "#F8E8E8",
  success: "#2E7D32",
  successMuted: "#D5E8D4",
  warning: "#F59E0B",
  warningMuted: "#FEF3C7",
  error: "#E05555",
  info: "#1976D2",
  infoMuted: "#E3F2FD",

  // Status
  healthy: "#2D8A73",
  healthyBar: "#2D8A73",
  cautionTone: "#7B6B24",
  cautionBar: "#EAB308",
  warningTone: "#A05C22",
  warningBar: "#F59E0B",
  overTone: "#A23D3D",
  overBar: "#E05555",
  noLimit: "#C3CBC8",

  // Components
  cardBackground: "#FFFFFF",
  cardBorder: "#E6EBE8",
  chipBackground: "#F8FAF9",
  chipBorder: "#DCE3DF",
  chipActiveBackground: "#1DB954",
  chipActiveBorder: "#1DB954",
  chipText: "#34403D",
  chipActiveText: "#FFFFFF",
  inputBackground: "#F2F4F3",
  inputText: "#1F2928",
  inputPlaceholder: "#80908A",
  modalOverlay: "rgba(0,0,0,0.5)",
  modalBackground: "#FFFFFF",
  searchBackground: "#EEF1EF",
  progressTrack: "#E9ECEA",
  progressBar: "#1DB954",
  fabBackground: "#1DB954",
  fabIcon: "#FFFFFF",

  // Tab bar
  tabBarBackground: "#FFFFFF",
  tabBarBorder: "#E7EBE9",
  tabBarActive: "#1DB954",
  tabBarInactive: "#94A3A0",

  // Switch
  switchTrackOff: "#CED6D2",
  switchTrackOn: "#8BB2A9",
  switchThumb: "#FFFFFF",

  // Forecast card
  forecastBackground: "#E6F5ED",
  forecastTitle: "#18703C",
  forecastBody: "#3D4D47",
  forecastSub: "#5F7069",
};

export const DarkColors: typeof LightColors = {
  // Backgrounds — Spotify-inspired deep blacks
  background: "#121212",
  surface: "#181818",
  surfaceElevated: "#282828",
  surfacePressed: "#333333",

  // Text
  text: "#FFFFFF",
  textSecondary: "#B3B3B3",
  textTertiary: "#727272",
  textInverse: "#121212",

  // Brand — Spotify green
  primary: "#1DB954",
  primaryDark: "#1ED760",
  primaryMuted: "#1A3A2A",
  primaryText: "#121212",
  accent: "#1ED760",

  // Borders & dividers
  border: "#333333",
  borderLight: "#282828",
  divider: "#2A2A2A",

  // Semantic
  destructive: "#FF4444",
  destructiveMuted: "#3A1A1A",
  success: "#1DB954",
  successMuted: "#1A3A2A",
  warning: "#FFB800",
  warningMuted: "#3A3010",
  error: "#FF6B6B",
  info: "#4DA6FF",
  infoMuted: "#1A2A3A",

  // Status
  healthy: "#1DB954",
  healthyBar: "#1DB954",
  cautionTone: "#E0C050",
  cautionBar: "#EAB308",
  warningTone: "#FFB800",
  warningBar: "#F59E0B",
  overTone: "#FF6B6B",
  overBar: "#FF4444",
  noLimit: "#555555",

  // Components
  cardBackground: "#181818",
  cardBorder: "#282828",
  chipBackground: "#282828",
  chipBorder: "#333333",
  chipActiveBackground: "#1DB954",
  chipActiveBorder: "#1DB954",
  chipText: "#B3B3B3",
  chipActiveText: "#121212",
  inputBackground: "#282828",
  inputText: "#FFFFFF",
  inputPlaceholder: "#727272",
  modalOverlay: "rgba(0,0,0,0.7)",
  modalBackground: "#282828",
  searchBackground: "#282828",
  progressTrack: "#333333",
  progressBar: "#1DB954",
  fabBackground: "#1DB954",
  fabIcon: "#121212",

  // Tab bar
  tabBarBackground: "#181818",
  tabBarBorder: "#282828",
  tabBarActive: "#1DB954",
  tabBarInactive: "#727272",

  // Switch
  switchTrackOff: "#555555",
  switchTrackOn: "#1A5A3A",
  switchThumb: "#FFFFFF",

  // Forecast card
  forecastBackground: "#1A3A2A",
  forecastTitle: "#1DB954",
  forecastBody: "#B3B3B3",
  forecastSub: "#727272",
};

// ─── Spacing Scale ────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Typography Scale ─────────────────────────────────────────────

export const FontSize = {
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 15,
  subtitle: 16,
  title: 18,
  headline: 22,
  display: 28,
} as const;

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

// ─── Border Radius ────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 22,
  pill: 999,
} as const;

// ─── Elevation / Shadows ──────────────────────────────────────────

export const Elevation = {
  light: {
    none: {},
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
    },
  },
  dark: {
    none: {},
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 5,
    },
  },
};

// ─── Navigation Themes ────────────────────────────────────────────

export const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: LightColors.background,
    card: LightColors.surface,
    text: LightColors.text,
    border: LightColors.border,
    primary: LightColors.primary,
  },
};

export const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: DarkColors.background,
    card: DarkColors.surface,
    text: DarkColors.text,
    border: DarkColors.border,
    primary: DarkColors.primary,
  },
};

// ─── Theme Type ───────────────────────────────────────────────────

export type ThemeColors = typeof LightColors;
export type ThemeMode = "light" | "dark" | "system";

// Legacy export for backwards compatibility during migration
export const AppTheme = LightNavTheme;
