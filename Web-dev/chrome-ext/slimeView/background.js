// Inject the page controller only when the user opens the popup or changes a switch.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!['SLIMEVIEW_ACTIVATE', 'SLIMEVIEW_STATE'].includes(message?.type)) return;
  (async () => {
    try {
      const tabId = message.tabId;
      if (!Number.isInteger(tabId)) throw new Error('No active tab is available.');
      if (message.type === 'SLIMEVIEW_ACTIVATE' && message.command === 'reset') {
        await chrome.tabs.reload(tabId);
        sendResponse({ ok: true, status: 'Page reloading.' });
        return;
      }
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      const command = message.type === 'SLIMEVIEW_STATE' ? 'getState' : message.command;
      const response = await chrome.tabs.sendMessage(tabId, { type: 'SLIMEVIEW_COMMAND', command });
      sendResponse(response || { ok: true, status: 'Ready.', state: { popups: false, blur: false } });
    } catch (error) {
      sendResponse({ ok: false, error: error?.message || 'Could not run slimeView on this page.', state: { popups: false, blur: false } });
    }
  })();
  return true;
});
