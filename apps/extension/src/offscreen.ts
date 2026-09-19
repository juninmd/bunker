// Service workers cannot touch the clipboard; this hidden document empties it on request.
function clearClipboard() {
  const onCopy = (event: ClipboardEvent) => {
    event.clipboardData?.setData('text/plain', '');
    event.preventDefault();
  };
  document.addEventListener('copy', onCopy, { once: true });
  document.execCommand('copy');
}

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  if (message?.target !== 'offscreen' || sender.id !== chrome.runtime.id) return false;
  if (message.type === 'CLEAR_CLIPBOARD') clearClipboard();
  sendResponse({ status: 'ACK' });
  return false;
});
