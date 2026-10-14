// The popup sends only deliberate commands to the currently active tab.
const PROFILE_KEY = 'autofillerProfile';
const PROFILE_FIELDS = [
  ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address']
];
const list = document.getElementById('mapping-list');
const count = document.getElementById('field-count');
const statusText = document.getElementById('status');
const statusCard = document.querySelector('.status-card');
const fillButton = document.getElementById('fill');
const clearButton = document.getElementById('clear');
let fields = [];
let profile = {};

function setStatus(message, kind = '') {
  statusText.textContent = message;
  statusCard.classList.remove('good', 'error');
  if (kind) statusCard.classList.add(kind);
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab is available.');
  return tab.id;
}

async function sendTabCommand(command, payload = {}) {
  const tabId = await getActiveTabId();
  return chrome.runtime.sendMessage({ type: 'AUTOFILLER_TAB_COMMAND', tabId, command, payload });
}

function renderFields() {
  count.textContent = `${fields.length} / 5`;
  list.replaceChildren();
  if (!fields.length) {
    const empty = document.createElement('p'); empty.className = 'empty-state';
    empty.textContent = 'No fields selected yet. Start selection, then click fields on the page.';
    list.append(empty);
  }
  for (const field of fields) {
    const row = document.createElement('div'); row.className = 'mapping-row';
    const label = document.createElement('div'); label.className = 'field-label';
    const strong = document.createElement('strong'); strong.textContent = field.label;
    const small = document.createElement('small'); small.textContent = field.tag === 'input' ? field.type : field.tag;
    label.append(strong, small);
    const select = document.createElement('select'); select.setAttribute('aria-label', `Profile value for ${field.label}`);
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose value…'; select.append(placeholder);
    for (const [key, title] of PROFILE_FIELDS) {
      if (!String(profile[key] || '').trim()) continue;
      const option = document.createElement('option'); option.value = key; option.textContent = title; select.append(option);
    }
    row.append(label, select); list.append(row);
  }
  const canFill = fields.length > 0 && PROFILE_FIELDS.some(([key]) => String(profile[key] || '').trim());
  fillButton.disabled = !canFill;
  clearButton.disabled = fields.length === 0;
}

async function loadProfile() {
  try {
    const result = await chrome.storage.local.get(PROFILE_KEY);
    profile = result[PROFILE_KEY] && typeof result[PROFILE_KEY] === 'object' ? result[PROFILE_KEY] : {};
    const populated = PROFILE_FIELDS.filter(([key]) => String(profile[key] || '').trim()).length;
    document.getElementById('profile-summary').textContent = populated ? `${populated} of 5 profile values saved locally` : 'No profile saved yet';
  } catch (_) {
    profile = {};
    setStatus('Could not read the local profile. Open profile settings to check storage.', 'error');
  }
}

async function loadPageState() {
  try {
    const result = await sendTabCommand('getState');
    if (!result?.ok) throw new Error(result?.error || 'This page is not available to Autofiller.');
    fields = Array.isArray(result.fields) ? result.fields.slice(0, 5) : [];
    renderFields();
    setStatus(result.selecting ? 'Selection mode is active. Click form fields on the page.' : (fields.length ? `${fields.length} field${fields.length === 1 ? '' : 's'} ready to map.` : 'Ready. Select fields on the current page.'));
  } catch (error) {
    fields = []; renderFields();
    setStatus(error?.message || 'Open a regular webpage to use Autofiller.', 'error');
    document.getElementById('start-selection').disabled = true;
  }
}

async function startSelection() {
  try {
    const result = await sendTabCommand('startSelection');
    if (!result?.ok) throw new Error(result?.error || 'Could not start field selection.');
    setStatus('Selection started. Click up to five visible fields on the page; press Esc to stop.', 'good');
  } catch (error) { setStatus(error?.message || 'Could not start field selection.', 'error'); }
}

async function clearMapping() {
  try {
    const result = await sendTabCommand('clearMapping');
    if (!result?.ok) throw new Error(result?.error || 'Could not clear field mapping.');
    fields = result.fields || []; renderFields(); setStatus('Current mapping cleared.', 'good');
  } catch (error) { setStatus(error?.message || 'Could not clear mapping.', 'error'); }
}

async function fillFields() {
  const mappings = [...list.querySelectorAll('.mapping-row')].map((row, index) => ({
    fieldId: fields[index]?.id,
    profileKey: row.querySelector('select').value,
    value: profile[row.querySelector('select').value] || ''
  })).filter(mapping => mapping.profileKey);
  if (!mappings.length) { setStatus('Choose a saved profile value for at least one field.', 'error'); return; }
  try {
    fillButton.disabled = true;
    const result = await sendTabCommand('fill', { mappings });
    if (!result?.ok) throw new Error(result?.error || 'Could not fill the selected fields.');
    setStatus(result.status || `Filled ${result.filled || 0} fields. Forms were not submitted.`, result.filled ? 'good' : 'error');
  } catch (error) { setStatus(error?.message || 'Could not fill selected fields.', 'error'); }
  finally { fillButton.disabled = false; }
}

document.getElementById('start-selection').addEventListener('click', startSelection);
clearButton.addEventListener('click', clearMapping);
fillButton.addEventListener('click', fillFields);
document.getElementById('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  const icon = document.getElementById('theme-icon'); icon.textContent = event.matches ? '☾' : '☼';
  icon.setAttribute('aria-label', event.matches ? 'Dark system theme' : 'Light system theme');
});
(async () => {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.getElementById('theme-icon').textContent = dark ? '☾' : '☼';
  await loadProfile();
  renderFields();
  await loadPageState();
})();
