// Classic content script loaded before content.js; shares its isolated world.

function offerSave(username: string, password: string) {
  chrome.runtime.sendMessage({ type: 'OFFER_SAVE', username, password }, response => {
    if (chrome.runtime.lastError) return;
    if (response?.pending) promptPendingSave();
  });
}

function promptPendingSave() {
  chrome.runtime.sendMessage({ type: 'TAKE_PENDING_SAVE' }, response => {
    if (chrome.runtime.lastError || !response?.offer) return;
    const { host, username, update } = response.offer;
    const question = update
      ? `BunkerPass: atualizar a senha de ${username} em ${host}?`
      : `BunkerPass: salvar a senha de ${username} para ${host}?`;
    const accept = window.confirm(question);
    chrome.runtime.sendMessage({ type: 'RESOLVE_PENDING_SAVE', accept }, () => void chrome.runtime.lastError);
  });
}
