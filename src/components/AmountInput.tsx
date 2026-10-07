import React, { useRef, useEffect } from 'react';
import { TextInput, StyleSheet, Text, View, StyleProp, ViewStyle, TextInputProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { useTheme } from '../state/ThemeContext';
import { formatInputMoney, parseInputMoney } from '../utils/finance';
import type { ThemeColors } from '../utils/theme';
import { FontSize } from '../utils/theme';

interface AmountInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeAmount: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  amountCurrency: {
    color: c.text,
    fontSize: FontSize.display,
    fontWeight: "700",
    marginRight: 4,
    marginTop: -4,
  },
  amountInput: {
    color: c.text,
    fontSize: FontSize.display * 1.5,
    fontWeight: "800",
    minWidth: 80,
    textAlign: "center",
  },
});

export const AmountInput = React.forwardRef<TextInput, AmountInputProps>(
  ({ value, onChangeAmount, containerStyle, autoFocus, ...rest }, ref) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors, isDark]);

    const scaleAnim = useSharedValue(1);
    
    const triggerAmountAnimation = () => {
      scaleAnim.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
    };

    const handleAmountChange = (val: string) => {
      onChangeAmount(parseInputMoney(val));
      if (val.length > 0) triggerAmountAnimation();
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleAnim.value }],
    }));

    return (
      <Animated.View style={[styles.amountInputWrap, containerStyle, animatedStyle]}>
        <Text style={styles.amountCurrency}>₹</Text>
        <TextInput
          ref={ref}
          placeholder="0"
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="numeric"
          value={formatInputMoney(value)}
          onChangeText={handleAmountChange}
          style={styles.amountInput}
          returnKeyType="done"
          autoFocus={autoFocus}
          maxLength={15} // Prevent extremely large numbers breaking layout
          {...rest}
        />
      </Animated.View>
    );
  }
);
