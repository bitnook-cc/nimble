let activated: HTMLElement | null = null;

// Safari leaves the previous field focused when a button is clicked. Remember
// the activated control without forcing focus (which changes mobile behavior).
export function rememberDialogOpener(event: MouseEvent) {
  if (event.button !== 0 || !(event.target instanceof Element)) return;
  activated = event.target.closest<HTMLElement>(
    'button:not(:disabled), a[href], [role="button"]',
  );
}
export function clearDialogOpener() {
  activated = null;
}
export function getDialogOpener() {
  return activated?.isConnected
    ? activated
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
}
