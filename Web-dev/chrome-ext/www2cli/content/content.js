// Coordinator for the terminal overlay and service-worker hotkey/action messages.
(() => {
  const api = window.__www2cli;
  if (!api || window.__www2cliCoordinator) return;
  window.__www2cliCoordinator = true;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'WWW2CLI_COMMAND' || message.command !== 'toggle') return;
    try { api.ui?.toggle(); sendResponse({ ok: true }); }
    catch (error) { sendResponse({ ok: false, error: error?.message || 'www2CLI could not open on this page.' }); }
    return true;
  });
})();
