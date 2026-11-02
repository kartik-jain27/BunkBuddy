import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';

export interface EmptyStateProps {
  message: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  message,
  title,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors, spacing, fontSize, lineHeight, fontWeight } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxl,
          rowGap: spacing.md,
        },
        style,
      ]}
    >
      {title ? (
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: fontSize.lg,
            lineHeight: lineHeight.lg,
            fontWeight: fontWeight.semibold,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      ) : null}
      <Text
        style={{
          color: colors.textMuted,
          fontSize: fontSize.md,
          lineHeight: lineHeight.md,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.xs }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
