// Profile fields are stored only in chrome.storage.local and never transmitted.
const STORAGE_KEY = 'autofillerProfile';
const FIELD_IDS = ['firstName', 'lastName', 'email', 'phone', 'address'];
const form = document.getElementById('profile-form');
const status = document.getElementById('status');

function showStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#c23b48' : '';
}

async function loadProfile() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const profile = result[STORAGE_KEY] || {};
    for (const id of FIELD_IDS) document.getElementById(id).value = typeof profile[id] === 'string' ? profile[id] : '';
    showStatus('Profile is stored only in this browser.');
  } catch (error) { showStatus(error?.message || 'Could not load the saved profile.', true); }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (email && !document.getElementById('email').checkValidity()) { showStatus('Enter a valid email address, or leave the field empty.', true); return; }
  const profile = Object.fromEntries(FIELD_IDS.map(id => [id, document.getElementById(id).value.trim()]));
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: profile });
    showStatus('Profile saved locally in this browser.');
  } catch (error) { showStatus(error?.message || 'Could not save the profile.', true); }
});

document.getElementById('delete').addEventListener('click', async () => {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    form.reset();
    showStatus('Saved profile deleted from this browser.');
  } catch (error) { showStatus(error?.message || 'Could not delete the saved profile.', true); }
});

loadProfile();
