const ALARM = 'clearClipboard';
const OFFSCREEN_PATH = 'src/offscreen.html';
export const CLIPBOARD_CLEAR_SECONDS = 30;

// Chrome alarms fire no sooner than 30s, which is also the clearing window users expect from LastPass.
export function scheduleClipboardClear() {
  chrome.alarms.create(ALARM, { delayInMinutes: CLIPBOARD_CLEAR_SECONDS / 60 });
}

export function isClipboardAlarm(alarm: chrome.alarms.Alarm) {
  return alarm.name === ALARM;
}

let clearing: Promise<void> | null = null;

// Only one offscreen document may exist, so overlapping clears share the same run.
export function clearClipboardNow(): Promise<void> {
  clearing ??= runClear().finally(() => { clearing = null; });
  return clearing;
}

async function runClear() {
  if (!chrome.offscreen) return;
  if (!(await chrome.offscreen.hasDocument())) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Clear copied passwords from the clipboard'
    });
  }
  await chrome.runtime.sendMessage({ target: 'offscreen', type: 'CLEAR_CLIPBOARD' });
  await chrome.offscreen.closeDocument();
}
