/**
 * How far an Android bottom sheet must be lifted above the IME.
 *
 * `keyboardHeight` is RN's keyboard event height (IME inset minus system bars).
 * When the modal window has already resized, `baseHeight - rootHeight` accounts
 * for it, so the result never double-shifts.
 */
export function calculateAndroidKeyboardShift(
  keyboardHeight: number,
  baseHeight: number,
  rootHeight: number,
): number {
  const resizedBy = Math.max(0, baseHeight - rootHeight);
  return Math.max(0, keyboardHeight - resizedBy);
}
