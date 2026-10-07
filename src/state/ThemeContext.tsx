import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LightColors,
  DarkColors,
  LightNavTheme,
  DarkNavTheme,
  Elevation,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
  type ThemeColors,
  type ThemeMode,
} from "../utils/theme";

const THEME_KEY = "velnora-theme-mode";

type ThemeContextType = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  colors: ThemeColors;
  navTheme: typeof LightNavTheme;
  elevation: typeof Elevation.light;
  spacing: typeof Spacing;
  fontSize: typeof FontSize;
  fontWeight: typeof FontWeight;
  radius: typeof Radius;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  // Load persisted theme preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored: any) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode);
  }, []);

  const resolvedMode: "light" | "dark" = useMemo(() => {
    if (mode === "system") {
      return systemScheme === "dark" ? "dark" : "light";
    }
    return mode;
  }, [mode, systemScheme]);

  const isDark = resolvedMode === "dark";

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      resolvedMode,
      colors: isDark ? DarkColors : LightColors,
      navTheme: isDark ? DarkNavTheme : LightNavTheme,
      elevation: isDark ? Elevation.dark : Elevation.light,
      spacing: Spacing,
      fontSize: FontSize,
      fontWeight: FontWeight,
      radius: Radius,
      isDark,
      setMode,
    }),
    [mode, resolvedMode, isDark, setMode]
  );

  // Don't render until we've loaded the persisted preference to avoid flash
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

/**
 * Hook to create theme-aware StyleSheets.
 * Usage:
 *   const styles = useThemedStyles((colors, isDark) => StyleSheet.create({ ... }));
 */
export const useThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  createStyles: (colors: ThemeColors, isDark: boolean) => T
): T => {
  const { colors, isDark } = useTheme();
  return useMemo(() => createStyles(colors, isDark), [colors, isDark, createStyles]);
};
