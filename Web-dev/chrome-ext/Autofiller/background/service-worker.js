// Restrict page access to the active tab and user-initiated extension actions.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'AUTOFILLER_TAB_COMMAND' || !Number.isInteger(message.tabId)) return;
  (async () => {
    try {
      await chrome.scripting.executeScript({ target: { tabId: message.tabId }, files: ['content/content.js'] });
      const response = await chrome.tabs.sendMessage(message.tabId, {
        type: 'AUTOFILLER_COMMAND', command: message.command, payload: message.payload || {}
      });
      sendResponse(response || { ok: true });
    } catch (error) {
      sendResponse({ ok: false, error: error?.message || 'Autofiller cannot access this page.' });
    }
  })();
  return true;
});
