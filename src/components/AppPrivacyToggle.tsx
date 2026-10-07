import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../state/AppStore";
import { useTheme } from "../state/ThemeContext";

export const AppPrivacyToggle = () => {
  const insets = useSafeAreaInsets();
  const { preferences, setPreferences } = useAppStore();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { top: Math.max(insets.top, 10) }]}>
      <Pressable
        onPress={() => setPreferences({ ...preferences, isPrivacyEnabled: !preferences.isPrivacyEnabled })}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          pressed && { opacity: 0.7 }
        ]}
      >
        <Feather name={preferences.isPrivacyEnabled ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 9999,
  },
  button: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  }
});
