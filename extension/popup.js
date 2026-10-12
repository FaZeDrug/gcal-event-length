const fieldset = document.querySelector('fieldset');
const status = document.querySelector('#status');

async function load() {
  try {
    const { durationStyle } = await chrome.storage.local.get('durationStyle');
    document.querySelector(`input[value="${durationStyle === 'text' ? 'text' : 'box'}"]`).checked = true;
    fieldset.disabled = false;
    status.textContent = 'Preferences are saved on this device.';
  } catch {
    status.textContent = 'Could not load settings. Close and reopen this popup to retry.';
  }
}

fieldset.addEventListener('change', async (event) => {
  fieldset.disabled = true;
  status.textContent = 'Saving…';
  try {
    await chrome.storage.local.set({ durationStyle: event.target.value });
    status.textContent = 'Saved.';
  } catch {
    status.textContent = 'Could not save. Select the style again to retry.';
    event.target.checked = false;
  } finally {
    fieldset.disabled = false;
  }
});

load();
