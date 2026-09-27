// Replaces the clipboard with an empty string; needs a document, so it runs in Chrome's offscreen page or Firefox's event page.
export function clearClipboard() {
  const onCopy = (event: ClipboardEvent) => {
    event.clipboardData?.setData('text/plain', '');
    event.preventDefault();
  };
  document.addEventListener('copy', onCopy, { once: true });
  document.execCommand('copy');
}
