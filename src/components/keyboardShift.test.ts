import { calculateAndroidKeyboardShift } from './keyboardShift';

describe('calculateAndroidKeyboardShift', () => {
  it('lifts by the full keyboard height when the window did not resize', () => {
    expect(calculateAndroidKeyboardShift(300, 800, 800)).toBe(300);
  });

  it('does not double-shift when the window already resized', () => {
    expect(calculateAndroidKeyboardShift(300, 800, 500)).toBe(0);
  });

  it('uses only the part the window did not absorb', () => {
    expect(calculateAndroidKeyboardShift(300, 800, 750)).toBe(250);
  });

  it('never returns a negative shift', () => {
    expect(calculateAndroidKeyboardShift(0, 800, 800)).toBe(0);
    expect(calculateAndroidKeyboardShift(200, 0, 800)).toBe(200);
  });
});
