import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

export const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, delay, useNativeDriver: true })
    ]).start();
  }, [delay, opacity, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
};
