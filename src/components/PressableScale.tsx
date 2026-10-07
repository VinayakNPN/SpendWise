import React, { useCallback } from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PressableProps & {
  scaleValue?: number;
  haptic?: "none" | "light" | "medium" | "heavy";
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * A Pressable that scales down subtly on press, giving immediate tactile feedback.
 * Fixes the double-tap issue by using Reanimated for non-blocking animations
 * and ensuring proper touch handling inside ScrollViews.
 */
export const PressableScale = ({
  scaleValue = 0.97,
  haptic = "light",
  children,
  style,
  onPress,
  ...rest
}: PressableScaleProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (haptic === "light") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else if (haptic === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else if (haptic === "heavy") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    
    scale.value = withTiming(scaleValue, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });
  }, [scale, scaleValue, haptic]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  }, [scale]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[animatedStyle, style]}
      android_ripple={null}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};
