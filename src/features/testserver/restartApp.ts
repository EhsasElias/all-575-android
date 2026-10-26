/** The address is read once when the app starts, so a new one takes effect on the next load. */
export function restartApp(): void {
  window.location.reload();
}
