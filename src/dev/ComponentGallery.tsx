import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { RiskChip } from '../components/RiskChip';
import { useSnackbar } from '../components/Snackbar';
import { Stepper } from '../components/Stepper';
import {
  TickCrossButtons,
  type TickCrossState,
} from '../components/TickCrossButtons';
import type { RiskLevel } from '../lib/attendance';
import { useTheme } from '../theme/ThemeProvider';
import type { ThemeMode } from '../theme/tokens';
import { Section } from './Section';

const RISKS: RiskLevel[] = ['safe', 'warning', 'danger', 'no-data'];

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export function ComponentGallery() {
  const {
    colors,
    spacing,
    radii,
    fontSize,
    lineHeight,
    layout,
    mode,
    scheme,
    setMode,
  } = useTheme();
  const { show } = useSnackbar();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [stepperValue, setStepperValue] = useState(3);
  const [markState, setMarkState] = useState<TickCrossState>('unmarked');
  const [undoCount, setUndoCount] = useState(0);

  const mutedText = {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  };
  const swatches = [
    { label: 'Primary', color: colors.primary },
    { label: 'Secondary', color: colors.secondary },
    { label: 'Safe', color: colors.safe },
    { label: 'Warning', color: colors.warning },
    { label: 'Danger', color: colors.danger },
    { label: 'Surface', color: colors.surface },
    { label: 'Text', color: colors.text },
    { label: 'Border', color: colors.border },
  ];

  return (
    <View style={{ rowGap: spacing.lg }}>
      <Section title="Theme">
        <Text style={mutedText}>
          Mode: {mode}. Resolved palette: {scheme}.
        </Text>
        <View style={{ flexDirection: 'row', columnGap: spacing.sm }}>
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              label={option.label}
              variant={mode === option.value ? 'primary' : 'secondary'}
              onPress={() => setMode(option.value)}
              style={{ flex: 1, paddingHorizontal: 0 }}
            />
          ))}
        </View>
      </Section>

      <Section title="Button">
        <View style={{ rowGap: spacing.sm }}>
          <Button label="Primary action" onPress={() => undefined} />
          <Button label="Secondary action" variant="secondary" onPress={() => undefined} />
          <Button label="Ghost action" variant="ghost" onPress={() => undefined} />
          <Button label="Saving…" loading onPress={() => undefined} />
          <Button label="Disabled" disabled onPress={() => undefined} />
        </View>
      </Section>

      <Section title="Chip and RiskChip">
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: spacing.sm,
            rowGap: spacing.sm,
          }}
        >
          <Chip label="No dot" />
          <Chip label="DBMS" dotColor={colors.primary} />
          <Chip label="Lab" dotColor={colors.secondary} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: spacing.sm,
            rowGap: spacing.sm,
          }}
        >
          {RISKS.map((risk) => (
            <RiskChip key={risk} risk={risk} />
          ))}
        </View>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          title="No classes today"
          message="Enjoy the free time — or add an extra class."
          actionLabel="Add extra class"
          onAction={() => setSheetVisible(true)}
        />
      </Section>

      <Section title="Stepper">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: spacing.md,
          }}
        >
          <Text style={{ color: colors.text, fontSize: fontSize.md }}>Skip next classes</Text>
          <Stepper
            value={stepperValue}
            onChange={setStepperValue}
            min={0}
            max={10}
            accessibilityLabel="classes to skip"
          />
        </View>
      </Section>

      <Section title="TickCrossButtons">
        <Text style={mutedText}>State: {markState}</Text>
        <TickCrossButtons
          state={markState}
          onPresent={() => setMarkState('present')}
          onAbsent={() => setMarkState('absent')}
        />
        <Button
          label="Clear mark"
          variant="ghost"
          onPress={() => setMarkState('unmarked')}
          style={{ alignSelf: 'flex-start' }}
        />
      </Section>

      <Section title="BottomSheet">
        <Text style={mutedText}>
          Open the sheet, then tap the input. It must stay above the Android keyboard.
        </Text>
        <Button label="Open bottom sheet" onPress={() => setSheetVisible(true)} />
      </Section>

      <Section title="Snackbar">
        <Text style={mutedText}>
          Undo count: {undoCount}. The snackbar auto-dismisses after 4 seconds.
        </Text>
        <Button
          label="Show undo snackbar"
          variant="secondary"
          onPress={() =>
            show({
              message: 'Class marked present',
              actionLabel: 'Undo',
              onAction: () => setUndoCount((count) => count + 1),
            })
          }
        />
      </Section>

      <Section title="Palette">
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: spacing.md,
            rowGap: spacing.md,
          }}
        >
          {swatches.map((swatch) => (
            <View key={swatch.label} style={{ alignItems: 'center', rowGap: spacing.xs }}>
              <View
                style={{
                  width: layout.swatchSize,
                  height: layout.swatchSize,
                  borderRadius: radii.full,
                  backgroundColor: swatch.color,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                {swatch.label}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Extra class"
      >
        <Text style={mutedText}>
          This input must stay visible above the keyboard on Android edge-to-edge.
        </Text>
        <Chip label="Extra class · today" dotColor={colors.secondary} />
        <TextInput
          placeholder="Room (optional)"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={{
            minHeight: layout.minTouchTarget,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: fontSize.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        />
        <Button label="Save and close" onPress={() => setSheetVisible(false)} />
      </BottomSheet>
    </View>
  );
}
