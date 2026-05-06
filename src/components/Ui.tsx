import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

export const Title = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.title}>{children}</Text>
);

export const Pill = ({ text, danger }: { text: string; danger?: boolean }) => (
  <View style={[styles.pill, danger && styles.pillDanger]}>
    <Text style={styles.pillText}>{text}</Text>
  </View>
);

export const PrimaryButton = ({
  text,
  onPress
}: {
  text: string;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={styles.button}>
    <Text style={styles.buttonText}>{text}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: { backgroundColor: "#111827", borderRadius: 18, padding: 14, marginBottom: 12 },
  title: { color: "white", fontWeight: "700", fontSize: 18, marginBottom: 8 },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#164E63",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  pillDanger: { backgroundColor: "#7F1D1D" },
  pillText: { color: "#E2E8F0", fontSize: 12, fontWeight: "600" },
  button: {
    backgroundColor: "#06B6D4",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8
  },
  buttonText: { color: "#082F49", fontWeight: "800" }
});
