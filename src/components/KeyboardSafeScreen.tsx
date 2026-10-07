import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  View,
  ViewStyle,
  StyleProp,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../state/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  scrollEnabled?: boolean;
}

export const KeyboardSafeScreen: React.FC<Props> = ({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  scrollEnabled = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const Comp = scrollEnabled ? ScrollView : View;
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
      style={[styles.container, { backgroundColor: colors.background }, style]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Comp
          style={styles.container}
          contentContainerStyle={[
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 40),
              paddingHorizontal: 16,
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          bounces={scrollEnabled}
        >
          {children}
        </Comp>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
