// Inject terminal modules only after an explicit toolbar click or keyboard shortcut.
const INJECTION_FILES = [
  'commands/index.js', 'commands/navigation.js', 'commands/dom.js', 'commands/extraction.js', 'commands/forms.js',
  'content/terminal.js', 'content/content.js'
];

async function toggleForTab(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: INJECTION_FILES });
    const result = await chrome.tabs.sendMessage(tabId, { type: 'WWW2CLI_COMMAND', command: 'toggle' });
    if (!result?.ok) throw new Error(result?.error || 'Terminal could not open on this page.');
    await chrome.action.setBadgeText({ tabId, text: '' });
    await chrome.action.setTitle({ tabId, title: 'www2CLI terminal (Ctrl+Shift+K)' });
  } catch (error) {
    try {
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#c62828' });
      await chrome.action.setBadgeText({ tabId, text: '!' });
      await chrome.action.setTitle({ tabId, title: `www2CLI cannot run on this page: ${error?.message || 'restricted page'}` });
    } catch (_) { /* Browser-owned pages may reject even toolbar status updates. */ }
  }
}

chrome.action.onClicked.addListener(tab => { if (Number.isInteger(tab.id)) void toggleForTab(tab.id); });
chrome.commands.onCommand.addListener(async command => {
  if (command !== 'toggle-terminal') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (Number.isInteger(tab?.id)) void toggleForTab(tab.id);
});
