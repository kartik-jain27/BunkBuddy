import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { useSheetKeyboardInset } from './useSheetKeyboardInset';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BottomSheet({ visible, onClose, title, children, style }: BottomSheetProps) {
  const {
    colors,
    spacing,
    radii,
    fontSize,
    fontWeight,
    layout,
  } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const { onRootLayout, androidKeyboardShift } = useSheetKeyboardInset(mounted);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    if (!mounted) return;

    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, mounted, progress]);

  useEffect(() => {
    if (!mounted || !visible) return;

    const animation = Animated.spring(progress, {
      toValue: 1,
      damping: 22,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [mounted, visible, progress]);

  if (!mounted) return null;

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(windowHeight, 0), 0],
  });

  const sheet = (
    <Animated.View
      accessibilityViewIsModal
      onAccessibilityEscape={onClose}
      style={[
        styles.sheet,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          borderWidth: 1,
          flexShrink: 1,
          overflow: 'hidden',
          maxHeight: Math.max(0, windowHeight - insets.top - spacing.xxl),
          maxWidth: layout.sheetMaxWidth,
          width: '100%',
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      <View
        style={{
          width: layout.sheetHandleWidth,
          height: layout.sheetHandleHeight,
          borderRadius: radii.full,
          backgroundColor: colors.border,
          alignSelf: 'center',
          marginTop: spacing.md,
        }}
      />

      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            columnGap: spacing.sm,
          },
        ]}
      >
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={{
            flex: 1,
            color: colors.text,
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
          }}
        >
          {title ?? ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          onPress={onClose}
          hitSlop={spacing.xs}
          style={({ pressed }) => [
            styles.close,
            {
              width: layout.minTouchTarget,
              height: layout.minTouchTarget,
              borderRadius: radii.full,
              backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
            },
          ]}
        >
          <Text style={{ color: colors.textMuted, fontSize: fontSize.lg }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flexShrink: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          paddingTop: spacing.sm,
          rowGap: spacing.md,
        }}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.fill} onLayout={onRootLayout}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.overlay, opacity: backdropOpacity },
          ]}
        />
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        {Platform.OS === 'ios' ? (
          <KeyboardAvoidingView
            behavior="padding"
            style={[styles.fill, styles.bottom, { paddingTop: spacing.xxl }]}
          >
            {sheet}
          </KeyboardAvoidingView>
        ) : (
          <View
            style={[
              styles.fill,
              styles.bottom,
              { paddingTop: spacing.xxl, paddingBottom: androidKeyboardShift },
            ]}
          >
            {sheet}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  bottom: {
    justifyContent: 'flex-end',
  },
  sheet: {
    alignSelf: 'center',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  close: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
