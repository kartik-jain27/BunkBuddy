import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../components/Card';
import { useTheme } from '../theme/ThemeProvider';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, spacing, fontSize, fontWeight } = useTheme();

  return (
    <Card>
      <View style={{ rowGap: spacing.md }}>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize.md,
            fontWeight: fontWeight.semibold,
          }}
        >
          {title}
        </Text>
        {children}
      </View>
    </Card>
  );
}
