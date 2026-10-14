// Popup UI state mirrors the active tab's local cleanup controller.
const statusNode = document.getElementById('status');
const statusCard = document.querySelector('.status-card');
const confirmButton = document.getElementById('confirm');
const popupSwitch = document.getElementById('popups');
const blurSwitch = document.getElementById('blur');
const themeQuery = matchMedia('(prefers-color-scheme: dark)');
let busy = false;
let activeTabId = null;
let appearance = 'system';

function showStatus(message, kind = 'idle', needsConfirm = false) {
  statusNode.textContent = message;
  statusCard.classList.remove('is-working', 'is-success', 'is-error');
  if (kind !== 'idle') statusCard.classList.add(`is-${kind}`);
  confirmButton.hidden = !needsConfirm;
}

function renderSwitch(element, isOn) {
  element.setAttribute('aria-checked', String(Boolean(isOn)));
  element.classList.toggle('is-on', Boolean(isOn));
  element.querySelector('.switch-state').textContent = isOn ? 'ON' : 'OFF';
}

function renderState(state = {}) {
  renderSwitch(popupSwitch, state.popups);
  renderSwitch(blurSwitch, state.blur);
}

function syncSystemTheme() {
  if (appearance === 'system') document.body.dataset.theme = 'system';
}

function renderAppearance() {
  document.body.dataset.theme = appearance;
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === appearance));
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab is available.');
  activeTabId = tab.id;
  return tab;
}

async function sendCommand(command, type = 'SLIMEVIEW_ACTIVATE') {
  const tab = await getActiveTab();
  return chrome.runtime.sendMessage({ type, tabId: tab.id, command });
}

async function runAction(command) {
  if (busy) return;
  busy = true;
  confirmButton.hidden = true;
  showStatus('Updating this tab…', 'working');
  try {
    const result = await sendCommand(command);
    if (!result?.ok) throw new Error(result?.error || 'Could not run slimeView on this page.');
    renderState(result.state);
    const requiresConfirmation = Boolean(result.confirm);
    const isError = /disabled|could not|error|not available/i.test(result.status || '');
    showStatus(result.status || 'Done.', isError ? 'error' : (requiresConfirmation ? 'idle' : 'success'), requiresConfirmation);
  } catch (error) {
    showStatus(error?.message || 'This page does not allow extensions to modify it.', 'error');
  } finally {
    busy = false;
  }
}

async function loadTabState() {
  try {
    const result = await sendCommand('getState', 'SLIMEVIEW_STATE');
    if (!result?.ok) throw new Error(result?.error || 'This page does not allow slimeView.');
    renderState(result.state);
    showStatus(result.status || 'Ready when you are.', 'idle', Boolean(result.confirm));
  } catch (error) {
    showStatus(error?.message || 'Open a regular webpage to use slimeView.', 'error');
    popupSwitch.disabled = true; blurSwitch.disabled = true;
  }
}

async function loadAppearance() {
  try {
    const stored = await chrome.storage.local.get('slimeViewAppearance');
    appearance = ['system', 'light', 'dark'].includes(stored.slimeViewAppearance) ? stored.slimeViewAppearance : 'system';
  } catch (_) { appearance = 'system'; }
  renderAppearance();
}

popupSwitch.addEventListener('click', () => runAction('togglePopups'));
blurSwitch.addEventListener('click', () => runAction('toggleBlur'));
document.getElementById('undo').addEventListener('click', () => runAction('undo'));
document.getElementById('reset').addEventListener('click', () => runAction('reset'));
confirmButton.addEventListener('click', () => runAction('confirmCleanup'));
document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', async () => {
  appearance = button.dataset.themeChoice;
  renderAppearance();
  try { await chrome.storage.local.set({ slimeViewAppearance: appearance }); }
  catch (_) { showStatus('Could not save the appearance preference.', 'error'); }
}));
themeQuery.addEventListener('change', () => { if (appearance === 'system') syncSystemTheme(); });

(async () => { await loadAppearance(); await loadTabState(); })();
