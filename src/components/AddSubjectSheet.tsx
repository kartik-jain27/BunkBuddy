import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { useSnackbar } from './Snackbar';

const SUBJECT_COLORS = ['#1C4A3B', '#255E4B', '#7248C4', '#98511D', '#B3261E', '#6B6862'];

export interface SubjectDraft {
  name: string;
  color: string;
  initialPresent: number;
  initialTotal: number;
}

interface AddSubjectSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (draft: SubjectDraft) => Promise<void>;
}

type SheetMode = 'choose' | 'import' | 'manual';

export function AddSubjectSheet({ visible, onClose, onCreate }: AddSubjectSheetProps) {
  const { colors, spacing, radii, fontSize, lineHeight } = useTheme();
  const { show } = useSnackbar();
  const [mode, setMode] = useState<SheetMode>('choose');
  const [name, setName] = useState('');
  const [attended, setAttended] = useState('');
  const [total, setTotal] = useState('');
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setMode('choose');
    onClose();
  };

  const submit = async () => {
    const cleanName = name.trim();
    const openingPresent = attended === '' ? 0 : Number(attended);
    const openingTotal = total === '' ? 0 : Number(total);
    if (!cleanName) {
      show({ message: 'Enter a subject name.' });
      return;
    }
    if (!Number.isInteger(openingPresent) || !Number.isInteger(openingTotal) || openingPresent < 0 || openingTotal < 0 || openingPresent > openingTotal) {
      show({ message: 'Check the attended and total numbers.' });
      return;
    }

    setSaving(true);
    try {
      await onCreate({ name: cleanName, color: selectedColor, initialPresent: openingPresent, initialTotal: openingTotal });
      setName('');
      setAttended('');
      setTotal('');
      setSelectedColor(SUBJECT_COLORS[0]);
      close();
    } catch {
      show({ message: "Couldn't save the subject. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BottomSheet visible={visible && mode === 'choose'} onClose={close} title="Add subjects">
        <Text style={{ color: colors.textMuted, fontSize: fontSize.md, lineHeight: lineHeight.md }}>
          Add one subject manually, or import your whole timetable and review the scanned classes.
        </Text>
        <Button label="Import timetable" onPress={() => setMode('import')} />
        <Button label="Add manually" variant="secondary" onPress={() => setMode('manual')} />
      </BottomSheet>

      <BottomSheet visible={visible && mode === 'import'} onClose={close} title="Import timetable">
        <Text style={{ color: colors.textMuted, fontSize: fontSize.md, lineHeight: lineHeight.md }}>
          Upload the complete timetable. We will scan it and let you review every class before saving.
        </Text>
        <Button label="Upload an image" onPress={() => show({ message: 'Image picker and timetable scanning will be connected next.' })} />
        <Button label="Upload a PDF" variant="secondary" onPress={() => show({ message: 'PDF picker and timetable scanning will be connected next.' })} />
      </BottomSheet>

      <BottomSheet visible={visible && mode === 'manual'} onClose={close} title="Add a subject">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' }}>Subject name</Text>
          <TextInput autoFocus value={name} onChangeText={setName} placeholder="e.g. DBMS" placeholderTextColor={colors.textMuted} style={{ color: colors.text, backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, minHeight: 48, paddingHorizontal: spacing.md, fontSize: fontSize.md, marginTop: spacing.xs }} />
          <View style={{ flexDirection: 'row', columnGap: spacing.md, marginTop: spacing.md }}>
            <NumberField label="Attended" value={attended} onChangeText={setAttended} />
            <NumberField label="Total" value={total} onChangeText={setTotal} />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.lg }}>Colour</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.md, marginTop: spacing.sm }}>
            {SUBJECT_COLORS.map((color) => (
              <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Choose colour ${color}`} onPress={() => setSelectedColor(color)} style={{ width: 40, height: 40, backgroundColor: color, borderColor: selectedColor === color ? colors.text : 'transparent', borderRadius: radii.full, borderWidth: 3 }} />
            ))}
          </View>
          <Button label="Add subject" onPress={submit} loading={saving} style={{ marginTop: spacing.xl }} />
        </KeyboardAvoidingView>
      </BottomSheet>
    </>
  );
}

function NumberField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const { colors, spacing, radii, fontSize } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' }}>{label}</Text>
      <TextInput keyboardType="number-pad" value={value} onChangeText={onChangeText} placeholder="0" placeholderTextColor={colors.textMuted} style={{ color: colors.text, backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, minHeight: 48, paddingHorizontal: spacing.md, fontSize: fontSize.md, marginTop: spacing.xs }} />
    </View>
  );
}
