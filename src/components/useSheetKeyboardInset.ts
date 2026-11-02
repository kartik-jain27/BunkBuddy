import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type LayoutChangeEvent } from 'react-native';

import { calculateAndroidKeyboardShift } from './keyboardShift';

interface SheetKeyboardInset {
  onRootLayout: (event: LayoutChangeEvent) => void;
  androidKeyboardShift: number;
}

/**
 * Android's Modal uses a dialog window. With edge-to-edge, adjustResize may not
 * fully move the sheet above the IME. Shift by the keyboard height minus any
 * resize the window already applied, so the two can never double up.
 */
export function useSheetKeyboardInset(mounted: boolean): SheetKeyboardInset {
  const [rootHeight, setRootHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const baseHeightRef = useRef(0);

  useEffect(() => {
    if (mounted) return;
    baseHeightRef.current = 0;
    setRootHeight(0);
    setKeyboardHeight(0);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || Platform.OS !== 'android') return;

    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [mounted]);

  const onRootLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= 0) return;
    if (baseHeightRef.current === 0) baseHeightRef.current = height;
    setRootHeight(height);
  };

  const androidKeyboardShift =
    Platform.OS === 'android'
      ? calculateAndroidKeyboardShift(keyboardHeight, baseHeightRef.current, rootHeight)
      : 0;

  return { onRootLayout, androidKeyboardShift };
}
